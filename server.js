const express = require('express');
const path = require('path');
const app = express();

// Configurar para servir archivos estáticos desde la raíz
app.use(express.static(path.join(__dirname)));

// Ruta principal que carga el index.html automáticamente
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor corriendo en el puerto ${PORT}`);
});

// Inicialización de la Estructura de Tablas y Relaciones
db.serialize(() => {
    // 1. Instancias
    db.run(`CREATE TABLE IF NOT EXISTS instancias (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre TEXT UNIQUE,
        director TEXT,
        direccion TEXT,
        telefono TEXT,
        correo TEXT,
        dept1 TEXT,
        dept2 TEXT,
        logo TEXT
    )`);

    // 2. Usuarios con control de Roles y Token de Activación
    db.run(`CREATE TABLE IF NOT EXISTS usuarios (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        correo TEXT UNIQUE,
        password TEXT,
        nombre TEXT,
        rol TEXT, -- Director, Coordinador, Tecnico
        token TEXT,
        activo INTEGER DEFAULT 0,
        instancia_id INTEGER,
        FOREIGN KEY(instancia_id) REFERENCES instancias(id)
    )`);

    // 3. Proyectos y Líneas de Intervención
    db.run(`CREATE TABLE IF NOT EXISTS proyectos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre TEXT,
        ejecutor TEXT,
        duracion TEXT,
        costo REAL,
        presupuesto REAL,
        donante TEXT,
        objetivo TEXT,
        lineas_intervencion TEXT, -- Ej: WASH, Medios de Vida, Salud
        instancia_id INTEGER,
        FOREIGN KEY(instancia_id) REFERENCES instancias(id)
    )`);
});

// --- RUTAS DE LA API ---

// Ruta de Registro / Creación de Usuario por el Administrador (Genera Token)
app.post('/api/usuarios/crear', (req, res) => {
    const { correo, password, nombre, rol } = req.body;
    const token = 'TOK-' + Math.random().toString(36).substring(2, 9).toUpperCase();
    
    const query = `INSERT INTO usuarios (correo, password, nombre, rol, token, activo) VALUES (?, ?, ?, ?, ?, 0)`;
    db.run(query, [correo, password, nombre, rol, token], function(err) {
        if (err) {
            return res.status(400).json({ error: "El correo ya está registrado o hay un error en los datos." });
        }
        res.json({ mensaje: "Usuario creado exitosamente.", token_generado: token, id: this.lastID });
    });
});

// Ruta de Activación de Usuario mediante Token y Registro de Instancia
app.post('/api/instancias/activar', (req, res) => {
    const { token, nombreInstancia, director, direccion, telefono, correoInst, dept1, dept2, logo } = req.body;

    // 1. Validar que no existan dos directores en la misma instancia (si se va a registrar una nueva)
    db.get(`SELECT id FROM instancias WHERE nombre = ?`, [nombreInstancia], (err, instanciaExistente) => {
        let instanciaId;

        const registrarInstanciaLogica = (idInst) => {
            // Actualizar usuario: vincular instancia, marcar activo = 1
            const updateUsuario = `UPDATE usuarios SET instancia_id = ?, activo = 1 WHERE token = ?`;
            db.run(updateUsuario, [idInst, token], function(err2) {
                if (err2) return res.status(500).json({ error: "Error al activar el usuario." });
                res.json({ mensaje: "Instancia registrada y sistema activado con éxito.", instancia_id: idInst });
            });
        };

        if (instanciaExistente) {
            // Si la instancia ya existe, verificamos si ya tiene director asignado
            db.get(`SELECT id FROM usuarios WHERE instancia_id = ? AND rol = 'Director'`, [instanciaExistente.id], (err3, dirRow) => {
                if (dirRow && director) {
                    return res.status(400).json({ error: "Restricción: Esta instancia ya cuenta con un Director registrado. Solo se permite un Director por instancia." });
                }
                registrarInstanciaLogica(instanciaExistente.id);
            });
        } else {
            // Crear nueva instancia
            const insertInst = `INSERT INTO instancias (nombre, director, direccion, telefono, correo, dept1, dept2, logo) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
            db.run(insertInst, [nombreInstancia, director, direccion, telefono, correoInst, dept1, dept2, logo], function(err4) {
                if (err4) return res.status(400).json({ error: "Error al registrar la instancia." });
                registrarInstanciaLogica(this.lastID);
            });
        }
    });
});

// Ruta de Login
app.post('/api/usuarios/crear-equipo', (req, res) => {
    const { correo, password, nombre, rol, instancia_id } = req.body;
    const token = 'TOK-' + Math.random().toString(36).substring(2, 9).toUpperCase();
    
    const query = `INSERT INTO usuarios (correo, password, nombre, rol, token, activo, instancia_id) VALUES (?, ?, ?, ?, ?, 0, ?)`;
    db.run(query, [correo, password, nombre, rol, token, instancia_id], function(err) {
        if (err) {
            return res.status(400).json({ error: "El correo ya está registrado o hay un error en los datos." });
        }
        res.json({ mensaje: "Usuario creado exitosamente.", token_generado: token, id: this.lastID });
    });
});
app.post('/api/login', (req, res) => {
    const { correo, password, token } = req.body;
    
    let query = `SELECT * FROM usuarios WHERE correo = ? AND password = ?`;
    let params = [correo, password];

    db.get(query, params, (err, usuario) => {
        if (err || !usuario) {
            return res.status(401).json({ error: "Credenciales inválidas." });
        }

        // Si el usuario no está activo, requiere validar token
        if (usuario.activo === 0 && usuario.token !== token) {
            return res.status(403).json({ error: "El usuario requiere un token de activación válido para su primer ingreso.", requiereToken: true });
        }

        res.json({
            mensaje: "Login exitoso",
            usuario: {
                id: usuario.id,
                nombre: usuario.nombre,
                rol: usuario.rol,
                activo: usuario.activo,
                instancia_id: usuario.instancia_id
            }
        });
    });
});

const PORT = process.env.PORT || 3000;
// Ruta temporal para crear el usuario administrador inicial
app.get('/api/crear-admin-test', (req, res) => {
    const query = `INSERT OR IGNORE INTO usuarios (correo, password, nombre, rol, token, activo) VALUES (?, ?, ?, ?, ?, ?)`;
    db.run(query, ['admin@caritas.org.gt', '123456', 'Administrador DHI', 'Director', 'TOK-ADMIN01', 0], function(err) {
        if (err) return res.status(400).json({ error: err.message });
        res.json({ mensaje: "Usuario administrador creado con éxito. Token: TOK-ADMIN01" });
    });
});
const path = require('path');

// Esto le dice al servidor que busque y muestre los archivos estáticos (como el index.html)
app.use(express.static(path.join(__dirname)));
app.listen(PORT, () => {
    console.log(`Servidor de Cáritas DHI corriendo en el puerto ${PORT}`);
});
