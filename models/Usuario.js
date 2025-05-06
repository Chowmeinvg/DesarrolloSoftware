const mongoose = require('mongoose');

const usuarioSchema = new mongoose.Schema({
  nombre: { type: String, required: true },
  correo: { type: String, required: true, unique: true },
  rol: { type: String, enum: ['estudiante', 'creador', 'administrador'], default: 'estudiante' },
  idioma: { type: String, enum: ['es', 'en'], default: 'es' },
  creadoEn: { type: Date, default: Date.now }
});

const Usuario = mongoose.model('Usuario', usuarioSchema);

module.exports = Usuario;
