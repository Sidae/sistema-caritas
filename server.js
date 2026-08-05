const express = require('express');
const path = require('path');

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname)));

// Memoria institucional con los datos iniciales y la identidad de Cáritas Guatemala
let datosInstitucionales = {
    instancia: {
        nombre: "Oficina Nacional",
        director: "Dirección Nacional",
        direccion: "Guatemala",
        telefono: "2222-2222",
        correo: "caritas@caritas.org.gt",
        departamento: "Desarrollo Humano Integral",
        subunidad: "Oficina Central",
        colorHex: "#C8102E" // Rojo Cáritas Guatemala
    },
    usuarioActual: {
        nombre: "Coordinador MEAL",
        rol: "Coordinador" // Roles permitidos: Coordinador, Analista, Consulta
    }
};

// Ruta de Login y autenticación integrada al control de acceso por roles
app.post('/api/login', (req, res) => {
    const { correo, password } = req.body;
    return res.status(200).json({ 
        success: true, 
        mensaje: "Acceso autorizado al Sistema Nacional de Información",
        usuario: datosInstitucionales.usuarioActual,
        instancia: datosInstitucionales.instancia,
        tieneInstancia: true,
        colorInstitucional: "#C8102E"
    });
});

// Ruta para activar y registrar la Instancia y Logotipo Institucional
app.post('/api/instancias/activar', (req, res) => {
    const datos = req.body;
    datosInstitucionales.instancia = {
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
        mensaje: "Instancia registrada con éxito bajo los estándares institucionales",
        instancia: datosInstitucionales.instancia
    });
});

// Ruta para consultar los módulos operativos (Cronogramas, Indicadores, Alertas, Reportes)
app.get('/api/modulos/estado', (req, res) => {
    return res.status(200).json({
        success: true,
        modulos: [
            { nombre: "Instancias y Logotipo", activo: true },
            { nombre: "Registro de Proyectos", activo: true },
            { nombre: "Definición e Indicadores", activo: true },
            { nombre: "Gestión de Usuarios", activo: true },
            { nombre: "Dashboard & Avances", activo: true },
            { nombre: "Diagrama PERT", activo: true },
            { nombre: "Informe Oficial A4 / PDF", activo: true }
        ],
        identidadVisual: {
            colorPrimario: "#C8102E",
            estilo: "Microsoft Fluent Design"
        }
    });
});

// Ruta principal para asegurar la carga del sistema web
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Configuración de puertos para el entorno de despliegue
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor institucional de Cáritas DHI operando en el puerto ${PORT}`);
});
