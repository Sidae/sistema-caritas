const express = require('express');
const path = require('path');

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname)));

// Memoria institucional con datos listos para desbloquear la interfaz
let datosInstitucionales = {
    instancia: {
        id: 1,
        nombre: "Oficina Nacional",
        director: "Dirección Nacional",
        direccion: "Guatemala",
        telefono: "2222-2222",
        correo: "caritas@caritas.org.gt",
        departamento: "Desarrollo Humano Integral",
        subunidad: "Oficina Central",
        colorHex: "#C8102E"
    },
    usuarioActual: {
        id: 1,
        nombre: "Coordinador MEAL",
        rol: "Coordinador"
    }
};

// Ruta de Login que fuerza el desbloqueo total de la interfaz y botones
app.post('/api/login', (req, res) => {
    return res.status(200).json({ 
        success: true, 
        token: "token_activo_caritas_2027",
        mensaje: "Acceso autorizado",
        usuario: datosInstitucionales.usuarioActual,
        instancia: datosInstitucionales.instancia,
        instancia_id: 1,
        tieneInstancia: true,
        autenticado: true
    });
});

// Ruta para activar y registrar la Instancia manteniendo la sesión activa
app.post('/api/instancias/activar', (req, res) => {
    const datos = req.body;
    datosInstitucionales.instancia = {
        id: 1,
        nombre: datos.nombre || datos.nombreInstancia || "Oficina Nacional",
        director: datos.director || "",
        direccion: datos.direccion || "",
        telefono: datos.telefono || "",
        correo: datos.correo || "",
        departamento: datos.departamento || "Desarrollo Humano Integral",
        subunidad: datos.subunidad || "",
        colorHex: "#C8102E"
    };

    return res.status(200).json({ 
        success: true, 
        mensaje: "Instancia registrada con éxito",
        instancia_id: 1,
        instancia: datosInstitucionales.instancia,
        tieneInstancia: true
    });
});

// Ruta general para comprobar estado de sesión o módulos
app.get('/api/estado-sistema', (req, res) => {
    return res.status(200).json({
        success: true,
        tieneInstancia: true,
        instancia: datosInstitucionales.instancia
    });
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor operando en el puerto ${PORT}`);
});
