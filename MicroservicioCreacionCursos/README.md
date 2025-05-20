# Microservicio de Creación de Cursos con IA

Este microservicio utiliza la API oficial de OpenAI para generar automáticamente contenido de cursos educativos basados en un título proporcionado.

## Requisitos previos

1. Node.js (v14 o superior)
2. MongoDB instalado y ejecutándose
3. Cuenta en OpenAI con API key

## Configuración

1. Instalar las dependencias necesarias:
```bash
npm install openai dotenv mongoose express axios
``` 

2. Crear un archivo `.env` en la raíz del proyecto con el siguiente contenido:
```
PORT=3000
MONGODB_URI=mongodb://localhost:27017/creacionCursos
OPENAI_API_KEY=tu_api_key_de_openai_aqui
NODE_ENV=development
``` 

## Estructura del proyecto

La estructura del proyecto después de la configuración debe ser la siguiente:

```
DESARROLLOSOFTWARE/
├── MicroservicioCreacionCursos/
│   ├── config/
│   │   ├── db.config.js
│   │   └── openai.config.js  (NUEVO)
│   ├── models/
│   │   ├── Creador.js
│   │   ├── Curso.js
│   │   ├── Leccion.js
│   │   ├── Quiz.js
│   │   └── index.js
│   ├── services/
│   │   └── ai.service.js     (NUEVO)
│   ├── utils/
│   │   └── database.js
│   ├── crearCurso.js         (NUEVO)
│   ├── server.js
│   ├── package.json
│   └── .env                  (NUEVO)
```

## Uso

Para ejecutar el script de generación de cursos:

```bash
# Dar permisos de ejecución al script
chmod +x crearCurso.js

# Ejecutar el script
./crearCurso.js
```

O alternativamente, usando npm:

```bash
npm run generate
```

El script te pedirá que ingreses el título del curso, luego generará el contenido utilizando la API de OpenAI y finalmente guardará todos los datos en la base de datos MongoDB.

## Cómo funciona

1. **Configuración inicial**: El script carga las variables de entorno usando dotenv.
2. **Conexión a MongoDB**: Se establece una conexión a la base de datos MongoDB.
3. **Interacción con el usuario**: Se solicita el título del curso.
4. **Generación de contenido**: Se utiliza la biblioteca oficial de OpenAI para generar el contenido completo del curso.
5. **Transacción en base de datos**: Se guardan todos los documentos relacionados (Curso, Lecciones, Quizzes, Creador) en una transacción para garantizar la consistencia.

## Consideraciones

- El script utiliza transacciones de MongoDB para garantizar la consistencia de los datos.
- Asegúrate de que tu versión de MongoDB soporte transacciones (4.0+).
- La API de OpenAI tiene límites de uso y costos asociados. Verifica tu plan y cuota disponible.
- Cada solicitud a la API puede tardar varios segundos en completarse, dependiendo del tamaño y complejidad del curso a generar.

## Solución de problemas

Si encuentras errores relacionados con la API de OpenAI, verifica:
1. Que tu API key sea válida y esté correctamente configurada en el archivo `.env`
2. Que tengas saldo suficiente en tu cuenta de OpenAI
3. Que el modelo especificado (gpt-4o-mini) esté disponible para tu cuenta