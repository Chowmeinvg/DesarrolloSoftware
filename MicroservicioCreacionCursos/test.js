const aiService = require('./services/ai.service');

async function main() {
    try {
        const tituloCurso = "Introducción a JavaScript";
        const contenidoCurso = await aiService.generarContenidoCurso(tituloCurso);
        console.log('Contenido del curso generado:', JSON.stringify(contenidoCurso, null, 2));
    } catch (error) {
        console.error('Error:', error.message);
    }
}

main();