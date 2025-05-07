/**
 * Modelo para la colección 'creadores'
 */
const mongoose = require('mongoose');
const { Schema } = mongoose;

const creadorSchema = new Schema({
  nombre: {
    type: String,
    required: [true, 'El nombre del creador es obligatorio'],
    trim: true
  },
  autenticado: {
    type: Boolean,
    default: false
  },
  cursos: [{
    type: Schema.Types.ObjectId,
    ref: 'Curso'
  }]
}, {
  timestamps: true, // Agrega createdAt y updatedAt
  versionKey: false // No agrega el campo __v
});

// Índices para mejorar el rendimiento de las consultas
creadorSchema.index({ nombre: 1 });

// Métodos estáticos
creadorSchema.statics.findByNombre = function(nombre) {
  return this.findOne({ nombre: nombre });
};

// Métodos de instancia
creadorSchema.methods.agregarCurso = function(cursoId) {
  if (!this.cursos.includes(cursoId)) {
    this.cursos.push(cursoId);
  }
  return this.save();
};

const Creador = mongoose.model('Creador', creadorSchema);

module.exports = Creador;