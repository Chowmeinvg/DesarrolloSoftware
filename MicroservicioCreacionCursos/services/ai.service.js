/**
 * Servicio para interactuar con la API de OpenAI
 */
const { OpenAI } = require('openai');
const axios = require('axios');
const config = require('../config/openai.config');
const { model } = require('mongoose');

class AIService {
  constructor() {
    this.openai = new OpenAI({
      apiKey: config.apiKey,
    });
  }

  /**
   * Genera el contenido completo de un curso basado en un título
   * @param {string} tituloCurso - Título del curso a generar
   * @returns {Promise<Object>} - Objeto con la estructura del curso generado
   */

async generarContenidoCurso(tituloCurso) {
  try {
    console.log(`Solicitando a la IA generar contenido para: "${tituloCurso}"...`);

    const prompt = this.construirPrompt(tituloCurso);

    const response = await axios.post(
      `${config.baseURL}/chat/completions`,
      {
        model: config.model,
        messages: [
          {
            role: "system",
            content: "Eres un experto en educación y creación de cursos. Tu tarea es generar el contenido detallado de un curso educativo en formato JSON siguiendo la estructura que se te proporciona."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: config.temperature,
        max_tokens: config.maxTokens
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.apiKey}`
        }
      }
    );

    const choices = response.data.choices;
    if (!choices || choices.length === 0) {
      throw new Error('La respuesta de la IA no contiene datos válidos');
    }

    const content = choices[0].message.content;
    console.log('Respuesta de la IA:', content);

    const contenidoJson = JSON.parse(content);
    return this.validarEstructuraRespuesta(contenidoJson);
  } catch (error) {
    console.error('Error al generar contenido con la IA:', error.message);
    if (error.response) {
      console.error('Detalles del error:', error.response.data);
    }
    throw new Error(`Error al generar el contenido del curso: ${error.message}`);
  }
}


  /**
   * Construye el prompt para la IA
   * @param {string} tituloCurso - Título del curso
   * @returns {string} - Prompt completo para la IA
   */
  construirPrompt(tituloCurso) {
    return `
    Genera el contenido completo para un curso titulado "${tituloCurso}".
    
    Necesito que el resultado sea en formato JSON con la siguiente estructura:
    {
      "curso": {
        "titulo": "Título del curso",
        "descripcion": "Descripción detallada del curso",
        "duracionHoras": "10:30",
        "publicado": false
      },
      "creador": {
        "nombre": "Nombre del creador",
        "autenticado": true
      },
      "lecciones": [
        {
          "titulo": "Título de la lección 1",
          "contenido": {
            "video": {
              "url": "URL del video",
              "duracion": "10:15"
            },
            "texto": "Contenido textual de la lección",
            "recursos": [
              {
                "nombre": "Nombre del recurso",
                "tipo": "pdf",
                "url": "URL del recurso"
              }
            ]
          },
          "orden": 1
        }
        // Incluye al menos 5 lecciones
      ],
      "quizzes": [
        {
          "titulo": "Quiz de evaluación",
          "preguntas": [
            "¿Pregunta 1?",
            "¿Pregunta 2?",
            "¿Pregunta 3?"
          ],
          "respuestas": [
            "Respuesta 1",
            "Respuesta 2",
            "Respuesta 3"
          ]
        }
        // Incluye al menos 2 quizzes
      ]
    }
    
    Asegúrate de que:
    1. El contenido sea educativo y relevante para el título proporcionado
    2. Las lecciones tengan un orden lógico y progresivo
    3. Cada lección tenga al menos un recurso real asociado y lecturas o material extensas y detalladas de apoyo para el usuario
    4. Los quizzes tengan el mismo número de preguntas y respuestas
    5. Las URLs referenciadas sean válidas y accesibles
    6. La duración esté en formato "horas:minutos"
    
    Genera un curso completo con al menos 5 lecciones y 2 quizzes.
    `;
  }

  /**
   * Valida que la estructura de la respuesta sea correcta
   * @param {Object} respuesta - Respuesta de la IA
   * @returns {Object} - Respuesta validada
   */
  validarEstructuraRespuesta(respuesta) {
    // Verificar que existan las propiedades principales
    if (!respuesta.curso || !respuesta.creador || 
        !respuesta.lecciones || !respuesta.quizzes) {
      throw new Error('La estructura de la respuesta no es válida');
    }

    // Verificar que haya al menos una lección y un quiz
    if (!Array.isArray(respuesta.lecciones) || respuesta.lecciones.length === 0 ||
        !Array.isArray(respuesta.quizzes) || respuesta.quizzes.length === 0) {
      throw new Error('No se generaron lecciones o quizzes');
    }

    // Verificar que el curso tenga los campos requeridos
    if (!respuesta.curso.titulo || !respuesta.curso.descripcion || 
        !respuesta.curso.duracionHoras) {
      throw new Error('Faltan datos requeridos en el curso');
    }

    return respuesta;
  }
}

module.exports = new AIService();
