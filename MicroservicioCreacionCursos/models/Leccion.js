/**
 * Modelo para la colección 'lecciones'
 */
const mongoose = require('mongoose');
const { Schema } = mongoose;

// Definición del esquema para el contenido
const contenidoSchema = new Schema({
  video: {
    url: String,
    duracion: String
  },
  texto: String,
  recursos: [{
    nombre: String,
    tipo: String,
    url: String
  }]
}, { _id: false }); // _id: false para que no genere IDs para este sub-documento

const leccionSchema = new Schema({
  titulo: {
    type: String,
    required: [true, 'El título de la lección es obligatorio'],
    trim: true
  },
  contenido: {
    type: contenidoSchema,
    required: [true, 'El contenido de la lección es obligatorio']
  },
  // Campo de relación al curso al que pertenece esta lección
  curso: {
    type: Schema.Types.ObjectId,
    ref: 'Curso'
  },
  orden: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true, // Agrega createdAt y updatedAt
  versionKey: false // No agrega el campo __v
});

// Índices para mejorar el rendimiento de las consultas
leccionSchema.index({ curso: 1, orden: 1 });

// Métodos estáticos
leccionSchema.statics.findByCurso = function(cursoId) {
  return this.find({ curso: cursoId }).sort({ orden: 1 });
};

const Leccion = mongoose.model('Leccion', leccionSchema);

module.exports = Leccion;