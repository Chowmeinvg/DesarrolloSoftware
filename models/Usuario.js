const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    nombre: {
        type: String,
        required: true,
        unique: true,
        trim: true,
    },
    correo: {
        type: String,
        required: true,
        unique: true,
        trim: true,
    },
    rol: {
        type: String,
        enum: ['estudiante', 'creador', 'administrador'],
        default: 'estudiante',
    },
    idioma: {
        type: String,
        enum: ['es', 'en'],
        default: 'es',
    },
    }, { timestamps: true });

module.exports = mongoose.model('Usuario', userSchema);