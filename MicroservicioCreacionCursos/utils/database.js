/**
 * Utilidad para conectarse a la base de datos MongoDB
 */
const mongoose = require('mongoose');
const dbConfig = require('../config/db.config');

/**
 * Conecta a la base de datos MongoDB
 * @returns {Promise<void>} Promesa que se resuelve cuando la conexión es exitosa
 */
exports.connectDB = async () => {
  try {
    const mongoURI = dbConfig.url;
    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      // No incluir opciones relacionadas con transacciones aquí
    });
    
    // Configurar mongoose para que no use findAndModify deprecated
    mongoose.set('strictQuery', true);
    
    // Añadir listeners para eventos de conexión
    mongoose.connection.on('error', err => {
      console.error('Error de conexión MongoDB:', err);
    });
    
    mongoose.connection.on('disconnected', () => {
      console.warn('La conexión a MongoDB se ha perdido');
    });
    
    // Manejo de señales para cerrar conexión apropiadamente
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      console.log('Conexión a MongoDB cerrada debido a terminación del proceso');
      process.exit(0);
    });
    
    return mongoose.connection;
  } catch (error) {
    console.error('Error al conectar a MongoDB:', error.message);
    throw error;
  }
};