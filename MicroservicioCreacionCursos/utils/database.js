/**
 * Utilidad para conectar a la base de datos MongoDB
 */
const mongoose = require('mongoose');
const dbConfig = require('../config/db.config');

/**
 * Conecta a la base de datos MongoDB
 * @returns {Promise} Promesa que resuelve cuando se conecta a la BD
 */
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(dbConfig.url, dbConfig.options);
    
    console.log(`MongoDB conectada: ${conn.connection.host}`);
    
    // Configurar eventos de la conexión
    mongoose.connection.on('error', err => {
      console.error(`Error de conexión a MongoDB: ${err.message}`);
    });
    
    mongoose.connection.on('disconnected', () => {
      console.warn('Desconectado de MongoDB');
    });
    
    // Manejar señales de terminación para cerrar correctamente la conexión
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      console.log('Conexión a MongoDB cerrada debido a la finalización de la aplicación');
      process.exit(0);
    });
    
    return conn;
  } catch (error) {
    console.error(`Error al conectar a MongoDB: ${error.message}`);
    process.exit(1);
  }
};

module.exports = { connectDB };