
/**
 * Configuración de la base de datos MongoDB
 */
require('dotenv').config();

module.exports = {
  url: process.env.MONGODB_URI || 'mongodb://localhost:27017/creacionCursos',
  options: {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  }
};