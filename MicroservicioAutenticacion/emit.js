const amqp = require("amqplib");
const jwt = require("jsonwebtoken");
const readline = require("readline");
require('../MicroservicioCreacionCursos/db'); // Solo importa para asegurar conexión a MongoDB
const Usuario = require('./models/Usuario'); // Modelo Mongoose

// Función para pedir datos desde consola
function prompt(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

const JWT_SECRET = 'claveSecreta';

// Funcion para solicitar datos del usuario
async function solicitarDatos() {
  const nombre = await prompt("Nombre (obligatorio): ");
  const correo = await prompt("Correo electrónico (obligatorio): ");

  const rolInput = await prompt("Rol [estudiante, creador, administrador] (default: estudiante): ");
  const rol = ["estudiante", "creador", "administrador"].includes(rolInput) ? rolInput : "estudiante";

  const idiomaInput = await prompt("Idioma [es, en] (default: es): ");
  const idioma = ["es", "en"].includes(idiomaInput) ? idiomaInput : "es";

  return {
    nombre,
    correo,
    rol,
    idioma,
  };
}

async function publishNuevoUsuario() {
  const datosUsuario = await solicitarDatos();

  const conn = await amqp.connect(
    "amqps://tigresDelSoftware:passwordtemporal@computacion.mxl.uabc.mx:80"
  );
  const canalNuevoUsuario = await conn.createChannel();
  canalNuevoUsuario.assertExchange("nuevoUsuario", "fanout", {
    durable: true,
  });

  const token = jwt.sign(datosUsuario, JWT_SECRET, { algorithm: "HS256", noTimestamp: true });

  await canalNuevoUsuario.publish("nuevoUsuario", "", Buffer.from(token), {
    persistent: true,
  });

  console.log("[x] Sent message to 'nuevoUsuario' exchange:", datosUsuario, '\nToken:', token);
  
  setTimeout(function() {
    conn.close();
    process.exit(0);
  }, 500);
}

publishNuevoUsuario().catch(console.error);