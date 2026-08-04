const express = require('express');
const path = require('path');

const app = express();

// Middleware para procesar JSON y datos de formularios
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir todos los archivos estáticos desde la raíz del proyecto
app.use(express.static(path.join(__dirname)));

// Ruta principal para asegurar que cargue el index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Configuración del puerto para Render o entorno local
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor de Cáritas DHI corriendo en el puerto ${PORT}`);
});
