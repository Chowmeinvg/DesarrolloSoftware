/**
 * Modelo para la colección 'quizzes'
 */
const mongoose = require('mongoose');
const { Schema } = mongoose;

const quizSchema = new Schema({
  titulo: {
    type: String,
    required: [true, 'El título del quiz es obligatorio'],
    trim: true
  },
  preguntas: {
    type: [String],
    required: [true, 'Las preguntas del quiz son obligatorias'],
    validate: [
      {
        validator: function(v) {
          return v.length > 0;
        },
        message: 'El quiz debe tener al menos una pregunta'
      }
    ]
  },
  respuestas: {
    type: [String],
    required: [true, 'Las respuestas del quiz son obligatorias'],
    validate: [
      {
        validator: function(v) {
          return v.length === this.preguntas.length;
        },
        message: 'Debe haber una respuesta por cada pregunta'
      }
    ]
  },
  calificacion: {
    type: Number,
    min: [0, 'La calificación no puede ser menor a 0'],
    max: [100, 'La calificación no puede ser mayor a 100'],
    default: 0
  },
  // Campo de relación al curso al que pertenece este quiz
  curso: {
    type: Schema.Types.ObjectId,
    ref: 'Curso'
  }
}, {
  timestamps: true, // Agrega createdAt y updatedAt
  versionKey: false // No agrega el campo __v
});

// Índices para mejorar el rendimiento de las consultas
quizSchema.index({ curso: 1 });

// Métodos estáticos
quizSchema.statics.findByCurso = function(cursoId) {
  return this.find({ curso: cursoId });
};

// Métodos de instancia
quizSchema.methods.esAprobado = function() {
  return this.calificacion >= 60;
};

const Quiz = mongoose.model('Quiz', quizSchema);

module.exports = Quiz;