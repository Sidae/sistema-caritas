const express = require('express');
const path = require('path');

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname)));

// Memoria local temporal para la sesión actual (rápida, estable y sin fallos)
let memoriaInstancia = {
    nombre: "Oficina Nacional",
    director: "Dirección Nacional",
    direccion: "Guatemala",
    telefono: "2222-2222",
    correo: "caritas@caritas.org.gt",
    departamento: "Desarrollo Humano Integral",
    subunidad: "Oficina Central"
};

// Ruta de Login que siempre autoriza y devuelve la instancia activa
app.post('/api/login', (req, res) => {
    return res.status(200).json({ 
        success: true, 
        mensaje: "Login exitoso",
        instancia: memoriaInstancia,
        tieneInstancia: true
    });
});

// Ruta para guardar o actualizar la instancia instantáneamente
app.post('/api/instancias/activar', (req, res) => {
    const datos = req.body;
    memoriaInstancia = {
        nombre: datos.nombre || datos.nombreInstancia || "Oficina Nacional",
        director: datos.director || "",
        direccion: datos.direccion || "",
        telefono: datos.telefono || "",
        correo: datos.correo || "",
        departamento: datos.departamento || "Desarrollo Humano Integral",
        subunidad: datos.subunidad || ""
    };

    return res.status(200).json({ 
        success: true, 
        mensaje: "Instancia actualizada correctamente",
        instancia: memoriaInstancia
    });
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor corriendo en el puerto ${PORT}`);
});
