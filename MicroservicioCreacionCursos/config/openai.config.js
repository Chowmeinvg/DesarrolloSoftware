/**
 * Configuración para la conexión a OpenAI
 */
require('dotenv').config();

module.exports = {
  apiKey: process.env.DEEPSEEK_API_KEY,
  model: "deepseek-chat",
  baseURL: process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com/v1',
  temperature: 0.3,
  maxTokens: 4000
};