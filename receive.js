const amqp = require('amqplib');

if (process.argv.length < 3) {
    console.log('Usage: receive.js <queueNumber>');
    process.exit(1);
}
const queueName = process.argv[2];

async function consume() {
  const conn = await amqp.connect('amqps://tigresDelSoftware:passwordtemporal@computacion.mxl.uabc.mx:80');
  const channel = await conn.createChannel();
  
  // Bind queue to exchange
  await channel.assertQueue(`${queueName}`, { exclusive: false, durable: true, autoDelete: false });
  await channel.bindQueue(queueName, 'logs', ''); // Fanout exchanges ignore routing keys

  console.log('[*] Waiting for messages. To exit, press CTRL+C');
  channel.consume(queueName, (msg) => {
    channel.ack(msg);
    console.log(JSON.parse(msg.content.toString()));
  }, { noAck: false });
}

consume().catch(console.error);