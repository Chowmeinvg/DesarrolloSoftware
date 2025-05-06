var amqp = require('amqplib/callback_api');
const mongoose = require('mongoose');
const Usuario = require('./Usuario'); // Asegúrate de que la ruta del archivo Usuario.js sea correcta

// Conectar a MongoDB
mongoose.connect("mongodb://localhost:27017/miBaseDeDatos")
  .then(() => {
    console.log("Conexión exitosa a MongoDB");

    // Conectar a RabbitMQ
    amqp.connect('amqps://rabbitadm:passwordtemporal@computacion.mxl.uabc.mx', function(error0, connection) {
        if (error0) {
            throw error0;
        }
        connection.createChannel(function(error1, channel) {
            if (error1) {
                throw error1;
            }
            var exchange = 'logs';
            var msg = process.argv.slice(2).join(' ') || 'Hola mundo';

            channel.assertExchange(exchange, 'fanout', {
                durable: true
            });
            channel.publish(exchange, '', Buffer.from(msg));
            console.log(" [x] Sent %s", msg);

            // Crear un nuevo usuario
            const nuevoUsuario = new Usuario({
                nombre: 'Juan Pérez', // Cambia estos valores como prefieras
                correo: 'juan.perez@example.com',
                rol: 'estudiante',
                idioma: 'es'
            });

            // Guardar el nuevo usuario en la base de datos
            nuevoUsuario.save()
                .then((usuarioGuardado) => {
                    console.log("Usuario guardado exitosamente:", usuarioGuardado);
                })
                .catch((error) => {
                    console.error("Error al guardar el usuario:", error);
                });

        });

        // Cerrar conexión después de un breve retraso
        setTimeout(function() {
            connection.close();
            process.exit(0);
        }, 500);
    });
  })
  .catch((error) => {
    console.error("Error de conexión a MongoDB:", error);
  });
