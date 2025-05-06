const amqp = require('amqplib');
const mongoose = require('mongoose');
const Usuario = require('../models/Usuario.js');
const jwt = require('jsonwebtoken');

mongoose.connect('mongodb://localhost:27017/CourseGenDB').then(() => {
    console.log('MongoDB Connected');
}).catch(err => console.error('MongoDB Connection Error:', err));

const queueNuevoUsuario = 'usuarios_nuevos';
const queueLoginUsuario = 'login_usuarios';
const JWT_SECRET = 'claveSecreta';

async function consume() {
  // Conexion a RabbitMQ
  const conn = await amqp.connect('amqps://elHaditaYSusNortenos:passwordtemporal@computacion.mxl.uabc.mx:80');

  // Canal de comunicacion hacia exchange de creacion de usuarios
  const canalNuevoUsuario = await conn.createChannel();
  await canalNuevoUsuario.assertQueue(queueNuevoUsuario, { exclusive: false, durable: true, autoDelete: false });
  await canalNuevoUsuario.bindQueue(queueNuevoUsuario, 'nuevoUsuario', ''); // Fanout exchanges ignore routing keys

  console.log('[*] Waiting for messages. To exit, press CTRL+C');
  canalNuevoUsuario.consume(queueNuevoUsuario, async (msg) => {
    try {
      console.log('Mensaje recibido:', msg.content.toString());

      // Decodificar el mensaje recibido
      const datosDecodificados = jwt.verify(msg.content.toString(), JWT_SECRET, { algorithms: ['HS256'] });

      // Mostrar el mensaje recibido
      console.log('\nNuevo usuario recibido:', datosDecodificados);
      
      // Validar el mensaje recibido
      if (!datosDecodificados.nombre || !datosDecodificados.correo) {
        throw new Error('Falta llenar campos obligatorios');
      }

      // Verificar que el nombre y correo no existan en la base de datos
      const existente = await Usuario.findOne({
        $or: [
          { nombre: datosDecodificados.nombre },
          { correo: datosDecodificados.correo }
        ]
      });
      
      if (existente) {
        throw new Error('Usuario ya existe con ese nombre o correo.');
      }

      // Guardar el nuevo usuario en la base de datos
      const usuario = new Usuario(datosDecodificados);
      await usuario.save();
      console.log('Usuario guardado con exito a MongoDB');

      // Ack el mensaje
      canalNuevoUsuario.ack(msg);
    } catch (error) {
        console.error('Error procesando el mensaje: ', error.message);
        canalNuevoUsuario.nack(msg, false, false); 
    }
  }, { noAck: false });

  // Canal de comunicacion hacia exchange de autenticacion de usuarios
  const canalLoginUsuario = await conn.createChannel();
  await canalLoginUsuario.assertQueue(queueLoginUsuario, { exclusive: false, durable: true, autoDelete: false });
  await canalLoginUsuario.bindQueue(queueLoginUsuario, 'loginUsuario', ''); // Fanout exchanges ignore routing keys

  canalLoginUsuario.consume(queueLoginUsuario, async (msg) => {
    try {
      const data = JSON.parse(msg.content.toString());
       
      // Mostrar el mensaje recibido
      console.log('Autenticacion Usuario:', data);

      if (!data.nombre || !data.correo || !data.rol) {
        throw new Error('Formato de mensaje invalido: Falta llenar campos obligatorios');
      }

      canalLoginUsuario.ack(msg);
    } catch (error) {
        console.error('Error procesando el mensaje:', error.message);
        canalLoginUsuario.nack(msg, false, false); 
    }
  }, { noAck: false });
}

consume().catch(console.error);
