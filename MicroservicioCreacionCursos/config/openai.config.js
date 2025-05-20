/**
 * Configuración para la conexión a OpenAI
 */
module.exports = {
  apiKey: process.env.OPENAI_API_KEY,
  model: "gpt-4o-mini", // Modelo proporcionado en tu ejemplo
  temperature: 0.7,
  maxTokens: 4000
};