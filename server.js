const express = require('express');
const path = require('path');
const { Pool } = require('pg');

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false
});

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
        `);
        console.log("Tabla instancias verificada correctamente en PostgreSQL.");
    } catch (err) {
        console.error("Error al inicializar la base de datos:", err);
    }
}

inicializarBaseDatos();

app.use(express.static(path.join(__dirname)));

// Ruta de Login adaptada para devolver el estado que el frontend reconoce
app.post('/api/login', async (req, res) => {
    try {
        const instanciaRes = await pool.query('SELECT * FROM instancias ORDER BY id DESC LIMIT 1');
        const existeInstancia = instanciaRes.rows.length > 0;
        const instancia = existeInstancia ? instanciaRes.rows[0] : null;

        return res.status(200).json({ 
            success: true, 
            token: "token_valido_caritas",
            instancia_id: existeInstancia ? instancia.id : null,
            instancia: instancia,
            tieneInstancia: existeInstancia
        });
    } catch (err) {
        console.error("Error en login:", err);
        return res.status(500).json({ error: "Error en el servidor al procesar el login." });
    }
});

// Ruta para activar y guardar la instancia en PostgreSQL
app.post('/api/instancias/activar', async (req, res) => {
    const { nombre, director, direccion, telefono, correo, departamento, subunidad } = req.body;
    
    try {
        await pool.query('DELETE FROM instancias');
        
        const query = `
            INSERT INTO instancias (nombre, director, direccion, telefono, correo, departamento, subunidad)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING *;
        `;
        const values = [
            nombre || req.body.nombreInstancia || "Oficina Nacional", 
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
            mensaje: "Instancia registrada con éxito",
            instancia_id: nuevaInstancia.id,
            instancia: nuevaInstancia
        });
    } catch (err) {
        console.error("Error al guardar instancia:", err);
        return res.status(500).json({ error: "No se pudo guardar la instancia en la base de datos." });
    }
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor de Cáritas DHI corriendo en el puerto ${PORT}`);
});
