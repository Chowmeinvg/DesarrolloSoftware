/**
 * Archivo principal del servidor con dotenv configurado
 */
require('dotenv').config(); // Cargar variables de entorno al inicio
const express = require('express');
const { connectDB } = require('./utils/database');

// Importar modelos
const Creador = require('./models/Creador');
const Curso = require('./models/Curso');
const Leccion = require('./models/Leccion');
const Quiz = require('./models/Quiz');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// Conectar a la base de datos
connectDB()
  .then(() => {
    console.log('Base de datos conectada con éxito');
    
    // Ejemplo de creación de colecciones si no existen
    // Esto se ejecutará automáticamente cuando se utilicen los modelos
    console.log('Modelos registrados:');
    console.log('- Creadores');
    console.log('- Cursos');
    console.log('- Lecciones');
    console.log('- Quizzes');
  })
  .catch(err => {
    console.error('Error al inicializar la base de datos:', err);
  });

// Ruta de prueba
app.get('/', (req, res) => {
  res.json({ 
    message: 'API del Microservicio de Creación de Cursos',
    status: 'online',
    database: 'MongoDB - creacionCursos'
  });
});

// Iniciar el servidor
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
  console.log(`Ambiente: ${process.env.NODE_ENV}`);
});