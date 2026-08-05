const express = require('express');
const path = require('path');

const app = express();

// Middleware para procesar JSON y datos de formularios
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir archivos estáticos desde la raíz del proyecto
app.use(express.static(path.join(__dirname)));

// Ruta de ejemplo para el inicio de sesión (ajusta la lógica según tu base de datos)
app.post('/api/login', (req, res) => {
    const { correo, password, token } = req.body;

    // Aquí validas las credenciales de tu sistema Cáritas DHI
    if (correo === "admin@caritas.org.gt" && password === "6123") {
        return res.status(200).json({ success: true, mensaje: "Login exitoso" });
    } else {
        return res.status(400).json({ error: "Credenciales incorrectas o servidor local no disponible." });
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
