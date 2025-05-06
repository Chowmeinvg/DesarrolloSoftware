const amqp = require("amqplib");
const jwt = require("jsonwebtoken");
const readline = require("readline");
require('./db'); // Solo importa para asegurar conexión a MongoDB
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

// Solicita datos por consola
async function solicitarDatos() {
  const nombre = await prompt("Nombre (obligatorio): ");
  const correo = await prompt("Correo electrónico (obligatorio): ");

  const rolInput = await prompt("Rol [estudiante, creador, administrador] (default: estudiante): ");
  const rol = ["estudiante", "creador", "administrador"].includes(rolInput) ? rolInput : "estudiante";

  const idiomaInput = await prompt("Idioma [es, en] (default: es): ");
  const idioma = ["es", "en"].includes(idiomaInput) ? idiomaInput : "es";

  return { nombre, correo, rol, idioma };
}

async function publishNuevoUsuario() {
  const datosUsuario = await solicitarDatos();

  try {
    // Guarda usuario en MongoDB
    const nuevoUsuario = new Usuario(datosUsuario);
    await nuevoUsuario.save();
    console.log("✅ Usuario guardado en MongoDB");

    // Publica en RabbitMQ
    const conn = await amqp.connect("amqps://tigresDelSoftware:passwordtemporal@computacion.mxl.uabc.mx:80");
    const canal = await conn.createChannel();
    canal.assertExchange("nuevoUsuario", "fanout", { durable: true });

    canal.publish("nuevoUsuario", "", Buffer.from(JSON.stringify(datosUsuario)), { persistent: true });

    const token = jwt.sign(datosUsuario, "secretKey", { expiresIn: "2h" });
    console.log("[x] Mensaje enviado a exchange 'nuevoUsuario':", datosUsuario, '\nToken:', token);

    setTimeout(() => {
      conn.close();
      process.exit(0);
    }, 500);

  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
}

publishNuevoUsuario().catch(console.error);
