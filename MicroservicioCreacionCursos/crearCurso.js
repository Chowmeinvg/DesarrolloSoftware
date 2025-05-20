#!/usr/bin/env node
/**
 * Script para crear automáticamente un curso completo basado en un título usando DeepSeek
 * Conecta con la API para generar el contenido del curso
 * Versión simplificada sin transacciones para garantizar compatibilidad con MongoDB standalone
 */
const path = require('path');
const dotenvPath = path.resolve(process.cwd(), '.env');
require('dotenv').config({ path: dotenvPath }); // Cargar variables de entorno con ruta explícita
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
  try {
    // Verificar la API key
    if (!process.env.DEEPSEEK_API_KEY) {
      console.error('\nERROR: No se encontró la API key de DeepSeek en las variables de entorno.');
      console.log('Por favor, asegúrate que el archivo .env en la raíz del proyecto contiene:');
      console.log('DEEPSEEK_API_KEY=tu_api_key_aqui');
      console.log(`\nRuta de búsqueda del archivo .env: ${dotenvPath}`);
      console.log(`Variables de entorno cargadas: ${Object.keys(process.env).filter(key => key.includes('DEEPSEEK')).join(', ') || 'ninguna relacionada con DEEPSEEK'}\n`);
      process.exit(1);
    }

    console.log(`✅ API key de DeepSeek configurada: ${process.env.DEEPSEEK_API_KEY.substring(0, 8)}...`);

    // Conectar a la base de datos
    await connectDB();
    console.log('✅ Conexión a MongoDB establecida');

    // Obtener título del curso del usuario
    const tituloCurso = await preguntarTituloCurso();
    console.log(`\n📚 Generando curso: "${tituloCurso}"`);
    
    // Consultar a la IA para generar el contenido
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
    
    // Crear documentos en la base de datos (siempre sin transacción)
    await crearDocumentos(contenidoGenerado);

    console.log('\n✅ ¡Curso creado exitosamente en la base de datos!');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error durante la creación del curso:', error.message);
    console.log('⚠️ Es posible que existan datos parciales en la base de datos.');
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
    console.log(`   ${index + 1}. ${leccion.titulo} (${leccion.contenido.video.duracion})`);
    console.log(`      📹 Video: ${leccion.contenido.video.url.substring(0, 50) + (leccion.contenido.video.url.length > 50 ? '...' : '')}`);
    console.log(`      📄 Recursos: ${leccion.contenido.recursos.length}`);
  });
  
  // Quizzes
  console.log(`\n❓ Quizzes (${contenido.quizzes.length}):`);
  contenido.quizzes.forEach((quiz, index) => {
    console.log(`   ${index + 1}. ${quiz.titulo} - ${quiz.preguntas.length} preguntas`);
  });
}

/**
 * Crea los documentos en la base de datos sin transacciones
 * @param {Object} contenido - Contenido generado por la IA
 * @returns {Promise<void>}
 */
async function crearDocumentos(contenido) {
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
      await creador.save();
    }
    
    // 2. Crear el curso
    console.log(`📚 Creando curso: ${contenido.curso.titulo}`);
    const curso = new Curso({
      titulo: contenido.curso.titulo,
      descripcion: contenido.curso.descripcion,
      duracionHoras: contenido.curso.duracionHoras,
      publicado: contenido.curso.publicado || false,
      fechaCreacion: new Date(),
      creador: creador._id,
      lecciones: [],
      quizzes: []
    });
    await curso.save();
    
    // 3. Crear las lecciones
    console.log(`📔 Creando ${contenido.lecciones.length} lecciones...`);
    for (const [index, leccionData] of contenido.lecciones.entries()) {
      const leccion = new Leccion({
        titulo: leccionData.titulo,
        contenido: {
          video: {
            url: leccionData.contenido.video.url,
            duracion: leccionData.contenido.video.duracion
          },
          texto: leccionData.contenido.texto,
          recursos: leccionData.contenido.recursos.map(recurso => ({
            nombre: recurso.nombre,
            tipo: recurso.tipo,
            url: recurso.url
          }))
        },
        curso: curso._id,
        orden: leccionData.orden || index + 1
      });
      await leccion.save();
      
      // Añadir referencia al curso
      curso.lecciones.push(leccion._id);
    }
    
    // Actualizar el curso parcialmente con las lecciones añadidas
    await Curso.findByIdAndUpdate(curso._id, { lecciones: curso.lecciones });
    
    // 4. Crear los quizzes
    console.log(`❓ Creando ${contenido.quizzes.length} quizzes...`);
    for (const quizData of contenido.quizzes) {
      // Validar datos para evitar errores
      if (!quizData.preguntas || !quizData.respuestas) {
        console.warn(`⚠️ Quiz "${quizData.titulo}" con datos faltantes. Saltando...`);
        continue;
      }
      
      if (quizData.preguntas.length !== quizData.respuestas.length) {
        console.warn(`⚠️ El quiz "${quizData.titulo}" tiene un número diferente de preguntas y respuestas. Ajustando...`);
        // Recortar al menor número
        const minLength = Math.min(quizData.preguntas.length, quizData.respuestas.length);
        quizData.preguntas = quizData.preguntas.slice(0, minLength);
        quizData.respuestas = quizData.respuestas.slice(0, minLength);
      }
      
      if (quizData.preguntas.length === 0) {
        console.warn(`⚠️ Quiz "${quizData.titulo}" sin preguntas. Saltando...`);
        continue;
      }
      
      const quiz = new Quiz({
        titulo: quizData.titulo,
        preguntas: quizData.preguntas,
        respuestas: quizData.respuestas,
        calificacion: 0, // Calificación inicial
        curso: curso._id
      });
      await quiz.save();
      
      // Añadir referencia al curso
      curso.quizzes.push(quiz._id);
    }
    
    // Actualizar el curso con las referencias a quizzes
    await Curso.findByIdAndUpdate(curso._id, { quizzes: curso.quizzes });
    
    // Actualizar el creador con la referencia al nuevo curso
    creador.cursos.push(curso._id);
    await Creador.findByIdAndUpdate(creador._id, { cursos: creador.cursos });
    
    console.log('✅ Todos los registros fueron creados correctamente');
  } catch (error) {
    console.error('❌ Error al crear los documentos:', error.message);
    if (error.name === 'ValidationError') {
      for (const field in error.errors) {
        console.error(`- Campo ${field}: ${error.errors[field].message}`);
      }
    }
    throw error;
  }
}

// Ejecutar el script
ejecutarCreacionCurso();