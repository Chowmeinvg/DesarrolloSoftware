/**
 * Modelo para la colección 'cursos'
 */
const mongoose = require('mongoose');
const { Schema } = mongoose;

const cursoSchema = new Schema({
  titulo: {
    type: String,
    required: [true, 'El título del curso es obligatorio'],
    trim: true
  },
  descripcion: {
    type: String,
    required: [true, 'La descripción del curso es obligatoria'],
    trim: true
  },
  duracionHoras: {
    type: String,
    required: [true, 'La duración del curso es obligatoria'],
    trim: true
  },
  publicado: {
    type: Boolean,
    default: false
  },
  fechaCreacion: {
    type: Date,
    default: Date.now
  },
  // Campos de relación
  lecciones: [{
    type: Schema.Types.ObjectId,
    ref: 'Leccion'
  }],
  quizzes: [{
    type: Schema.Types.ObjectId,
    ref: 'Quiz'
  }]
}, {
  timestamps: true, // Agrega createdAt y updatedAt
  versionKey: false // No agrega el campo __v
});

// Índices para mejorar el rendimiento de las consultas
cursoSchema.index({ titulo: 1 });
cursoSchema.index({ publicado: 1, fechaCreacion: -1 });

// Métodos estáticos
cursoSchema.statics.findPublicados = function() {
  return this.find({ publicado: true }).sort({ fechaCreacion: -1 });
};

// Middleware pre-save
cursoSchema.pre('save', function(next) {
  // Realizar validaciones o modificaciones antes de guardar
  this.updatedAt = new Date();
  next();
});

const Curso = mongoose.model('Curso', cursoSchema);

module.exports = Curso;