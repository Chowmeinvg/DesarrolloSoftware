const amqp = require('amqplib');
const mongoose = require('mongoose');
const User = require('./Usuario.js');
const Usuario = require('./Usuario.js');

mongoose.connect('mongodb://localhost:27017/CourseGenDB').then(() => {
    console.log('MongoDB Connected');
}).catch(err => console.error('MongoDB Connection Error:', err));

queueNuevoUsuario = 'usuarios_nuevos';
queueLoginUsuario = 'login_usuarios';

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
      const data = JSON.parse(msg.content.toString());
       
      // Mostrar el mensaje recibido
      console.log('\nNuevo usuario recibido:', data);
      
      // Validar el mensaje recibido
      if (!data.nombre || !data.correo) {
        throw new Error('Falta llenar campos obligatorios');
      }

      // Verificar que el nombre y correo no existan en la base de datos
      const existente = await Usuario.findOne({
        $or: [
          { nombre: data.nombre },
          { correo: data.correo }
        ]
      });
      
      if (existente) {
        throw new Error('Usuario ya existe con ese nombre o correo.');
      }

      // Guardar el nuevo usuario en la base de datos
      const user = new User(data);
      await user.save();
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
