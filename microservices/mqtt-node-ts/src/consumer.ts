import mqtt from "mqtt";
import readline from "node:readline";

const mqttURL = "mqtt://localhost:1883";

const topics = {
  request: "sensor/climate/request",
  response: "sensor/climate/response",
};

const client = mqtt.connect(mqttURL);

client.on("connect", () => {
  console.log("[consumer] Conectado al broker");
  client.subscribe(topics.response);

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

  console.log('Comandos disponibles: "temp", "hum", "all", "ex"');

  rl.on("line", (line) => {
    const cmd = line.trim().toLowerCase();

    if (cmd === "ex") {
      client.end();
      rl.close();
      return;
    }
    if (cmd === "temp" || cmd === "hum" || cmd === "all") {
      client.publish(topics.request, cmd);

    } else {
      console.log('No existe ese comando. Usa "temp", "hum", "all", o "ex".');
    }
  });
});

client.on("message", (topic, payload) => {
  const data = JSON.parse(payload.toString());
  console.log(`[consumer] Recibido mensaje de el topic ${topic}: ${data}`);
});

client.on("error", (err) => console.error("[consumer] Error MQTT:", err));
