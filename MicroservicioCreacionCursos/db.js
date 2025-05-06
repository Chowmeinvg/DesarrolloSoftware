const mongoose = require('mongoose');

const uri = 'mongodb://localhost:27017/miBaseDeDatos'; // Cambia el nombre a lo que prefieras

mongoose.connect("mongodb://localhost:27017/miBaseDeDatos");


const db = mongoose.connection;

db.on('error', console.error.bind(console, '❌ Error de conexión:'));
db.once('open', () => {
  console.log('✅ Conectado a MongoDB');
});

module.exports = db;
