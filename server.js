const express = require('express');
const path = require('path');
const { Pool } = require('pg');

const app = express();

// Middleware para procesar JSON y datos de formularios
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configuración de la conexión a PostgreSQL usando la variable de entorno de Render
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false
});

// Función para inicializar las tablas automáticamente si no existen
async function inicializarBaseDatos() {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS instancias (
                id SERIAL PRIMARY KEY,
                nombre VARCHAR(255) NOT NULL,
                director VARCHAR(255),
                direccion TEXT,
                telefono VARCHAR(50),
                correo VARCHAR(255),
                departamento VARCHAR(255),
                subunidad VARCHAR(255)
            );

            CREATE TABLE IF NOT EXISTS usuarios (
                id SERIAL PRIMARY KEY,
                correo VARCHAR(255) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                token VARCHAR(100),
                rol VARCHAR(50) DEFAULT 'admin'
            );

            CREATE TABLE IF NOT EXISTS proyectos (
                id SERIAL PRIMARY KEY,
                nombre_proyecto VARCHAR(255) NOT NULL,
                descripcion TEXT,
                instancia_id INT REFERENCES instancias(id)
            );
        `);
        console.log("Tablas verificadas y creadas correctamente en PostgreSQL.");
    } catch (err) {
        console.error("Error al inicializar la base de datos:", err);
    }
}

inicializarBaseDatos();

// Servir archivos estáticos desde la raíz del proyecto
app.use(express.static(path.join(__dirname)));

// Ruta para el inicio de sesión conectado a SQL
app.post('/api/login', async (req, res) => {
    const { correo, password } = req.body;
    try {
        // Consultar si hay una instancia registrada en la base de datos
        const instanciaRes = await pool.query('SELECT * FROM instancias LIMIT 1');
        const tieneInstancia = instanciaRes.rows.length > 0;

        return res.status(200).json({ 
            success: true, 
            mensaje: "Login exitoso",
            instancia: tieneInstancia ? instanciaRes.rows[0] : null,
            tieneInstancia: tieneInstancia
        });
    } catch (err) {
        console.error("Error en login:", err);
        return res.status(500).json({ error: "Error en el servidor al procesar el login." });
    }
});

// Ruta para guardar la instancia en SQL y activar el sistema
app.post('/api/instancias/activar', async (req, res) => {
    const { nombre, director, direccion, telefono, correo, departamento, subunidad } = req.body;
    
    try {
        // Limpiamos la tabla anterior o actualizamos para mantener una única instancia oficial de la oficina
        await pool.query('DELETE FROM instancias');
        
        const query = `
            INSERT INTO instancias (nombre, director, direccion, telefono, correo, departamento, subunidad)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING *;
        `;
        const values = [
            nombre || "Oficina Nacional", 
            director || "", 
            direccion || "", 
            telefono || "", 
            correo || "", 
            departamento || "Desarrollo Humano Integral", 
            subunidad || ""
        ];

        const resultado = await pool.query(query, values);
        const nuevaInstancia = resultado.rows[0];

        return res.status(200).json({ 
            success: true, 
            mensaje: "Instancia registrada con éxito en la base de datos",
            instancia_id: nuevaInstancia.id,
            instancia: nuevaInstancia
        });
    } catch (err) {
        console.error("Error al guardar instancia:", err);
        return res.status(500).json({ error: "No se pudo guardar la instancia en la base de datos." });
    }
});

// Ruta principal para asegurar que cargue el index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Configuración del puerto para Render o entorno local
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor de Cáritas DHI corriendo en el puerto ${PORT}`);
});
