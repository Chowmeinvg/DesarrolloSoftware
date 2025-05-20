#!/usr/bin/env node
/**
 * Script para crear automáticamente un curso completo basado en un título usando IA real
 * Conecta con OpenAI para generar el contenido del curso
 */
require('dotenv').config(); // Cargar variables de entorno
const readline = require('readline');
const mongoose = require('mongoose');
const { connectDB } = require('./utils/database');
const { Curso, Leccion, Quiz, Creador } = require('./models');
const aiService = require('./services/ai.service');

// Configurar interfaz de línea de comandos
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

/**
 * Función principal que ejecuta el flujo completo de creación de curso
 */
async function ejecutarCreacionCurso() {
  let session;
  
  try {
    // Verificar la API key de OpenAI
    if (!process.env.OPENAI_API_KEY) {
      console.error('\nERROR: No se encontró la API key de OpenAI en las variables de entorno.');
      console.log('Por favor, crea un archivo .env en la raíz del proyecto con el siguiente contenido:');
      console.log('OPENAI_API_KEY=tu_api_key_aqui\n');
      process.exit(1);
    }

    // Conectar a la base de datos
    await connectDB();
    console.log('✅ Conexión a MongoDB establecida');

    // Obtener título del curso del usuario
    const tituloCurso = await preguntarTituloCurso();
    console.log(`\n📚 Generando curso: "${tituloCurso}"`);
    
    // Consultar a la IA real para generar el contenido
    console.log('🧠 Consultando a la IA para generar contenido...');
    console.log('⏳ Este proceso puede tardar unos segundos...\n');
    
    const contenidoGenerado = await aiService.generarContenidoCurso(tituloCurso);
    
    console.log('✅ Contenido generado por IA exitosamente\n');
    mostrarResumenContenido(contenidoGenerado);

    // Confirmar con el usuario
    const confirmacion = await confirmarCreacion();
    if (!confirmacion) {
      console.log('❌ Operación cancelada por el usuario.');
      process.exit(0);
    }

    // Iniciar sesión de transacción para garantizar consistencia
    session = await mongoose.startSession();
    session.startTransaction();
    
    // Crear documentos en la base de datos
    await crearDocumentosEnBaseDeDatos(contenidoGenerado, session);
    
    // Confirmar transacción
    await session.commitTransaction();
    session.endSession();

    console.log('\n✅ ¡Curso creado exitosamente en la base de datos!');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error durante la creación del curso:', error.message);
    
    // Revertir transacción si hubo error
    if (session) {
      await session.abortTransaction();
      session.endSession();
      console.log('↩️ La transacción fue revertida, no se realizaron cambios en la base de datos.');
    }
    
    process.exit(1);
  } finally {
    rl.close();
  }
}

/**
 * Solicita al usuario el título del curso
 * @returns {Promise<string>} Título del curso
 */
function preguntarTituloCurso() {
  return new Promise((resolve) => {
    rl.question('📝 Ingrese el título del curso a generar: ', (titulo) => {
      if (!titulo || titulo.trim() === '') {
        console.log('❌ El título no puede estar vacío. Por favor, intente de nuevo.');
        return preguntarTituloCurso().then(resolve);
      }
      resolve(titulo.trim());
    });
  });
}

/**
 * Solicita confirmación al usuario para crear el curso
 * @returns {Promise<boolean>} True si confirma, false si cancela
 */
function confirmarCreacion() {
  return new Promise((resolve) => {
    rl.question('\n❓ ¿Desea crear este curso en la base de datos? (s/n): ', (respuesta) => {
      const confirmado = respuesta.toLowerCase() === 's' || respuesta.toLowerCase() === 'si';
      resolve(confirmado);
    });
  });
}

/**
 * Muestra un resumen del contenido generado por la IA
 * @param {Object} contenido - Contenido generado por la IA
 */
function mostrarResumenContenido(contenido) {
  console.log('📋 RESUMEN DEL CURSO GENERADO:');
  console.log('═════════════════════════════\n');
  
  // Información del curso
  console.log(`📚 Título: ${contenido.curso.titulo}`);
  console.log(`📝 Descripción: ${contenido.curso.descripcion}`);
  console.log(`⏱️  Duración: ${contenido.curso.duracionHoras}`);
  console.log(`👤 Creador: ${contenido.creador.nombre}`);
  
  // Lecciones
  console.log(`\n📔 Lecciones (${contenido.lecciones.length}):`);
  contenido.lecciones.forEach((leccion, index) => {
    console.log(`   ${index + 1}. ${leccion.titulo}`);
  });
  
  // Quizzes
  console.log(`\n❓ Quizzes (${contenido.quizzes.length}):`);
  contenido.quizzes.forEach((quiz, index) => {
    console.log(`   ${index + 1}. ${quiz.titulo} - ${quiz.preguntas.length} preguntas`);
  });
}

/**
 * Crea los documentos en la base de datos usando una transacción
 * @param {Object} contenido - Contenido generado por la IA
 * @param {mongoose.ClientSession} session - Sesión de MongoDB para la transacción
 * @returns {Promise<void>}
 */
async function crearDocumentosEnBaseDeDatos(contenido, session) {
  try {
    console.log('\n🔄 Creando registros en la base de datos...');
    
    // 1. Crear o recuperar el creador
    let creador = await Creador.findOne({ nombre: contenido.creador.nombre });
    
    if (!creador) {
      console.log(`👤 Creando nuevo creador: ${contenido.creador.nombre}`);
      creador = new Creador({
        nombre: contenido.creador.nombre,
        autenticado: contenido.creador.autenticado,
        cursos: []
      });
      await creador.save({ session });
    }
    
    // 2. Crear el curso
    console.log(`📚 Creando curso: ${contenido.curso.titulo}`);
    const curso = new Curso({
      titulo: contenido.curso.titulo,
      descripcion: contenido.curso.descripcion,
      duracionHoras: contenido.curso.duracionHoras,
      publicado: contenido.curso.publicado,
      fechaCreacion: new Date(),
      lecciones: [],
      quizzes: []
    });
    await curso.save({ session });
    
    // 3. Crear las lecciones
    console.log(`📔 Creando ${contenido.lecciones.length} lecciones...`);
    for (const [index, leccionData] of contenido.lecciones.entries()) {
      const leccion = new Leccion({
        titulo: leccionData.titulo,
        contenido: leccionData.contenido,
        curso: curso._id,
        orden: leccionData.orden || index + 1
      });
      await leccion.save({ session });
      
      // Añadir referencia al curso
      curso.lecciones.push(leccion._id);
    }
    
    // 4. Crear los quizzes
    console.log(`❓ Creando ${contenido.quizzes.length} quizzes...`);
    for (const quizData of contenido.quizzes) {
      const quiz = new Quiz({
        titulo: quizData.titulo,
        preguntas: quizData.preguntas,
        respuestas: quizData.respuestas,
        calificacion: 0, // Calificación inicial
        curso: curso._id
      });
      await quiz.save({ session });
      
      // Añadir referencia al curso
      curso.quizzes.push(quiz._id);
    }
    
    // Actualizar el curso con las referencias a lecciones y quizzes
    await curso.save({ session });
    
    // Actualizar el creador con la referencia al nuevo curso
    creador.cursos.push(curso._id);
    await creador.save({ session });
    
    console.log('✅ Todos los registros fueron creados correctamente');
  } catch (error) {
    console.error('❌ Error al crear los documentos:', error.message);
    throw error; // Propagar el error para que la transacción se revierta
  }
}

// Ejecutar el script
ejecutarCreacionCurso();