const amqp = require("amqplib");
const message = JSON.parse(process.argv[2] || "{\"message\":\"Hello, fanout!\"}");
async function publish() {
  const conn = await amqp.connect(
    "amqps://elHaditaYSusNortenos:passwordtemporal@computacion.mxl.uabc.mx:80"
  );
  const channel = await conn.createChannel();
  channel.assertExchange("logs", "fanout", {
    durable: true,
  });
  for (let i = 0; i < 10; i++) {
    message.message = `${i}`;
    await channel.publish("logs", "", Buffer.from(JSON.stringify(message)), {
      persistent: true,
    });
    console.log("[x] Sent message to 'logs' exchange:",message);
  }
  
  setTimeout(function() {
    conn.close();
    process.exit(0);
}, 500);
}

publish().catch(console.error);
