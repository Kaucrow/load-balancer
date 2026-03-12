import mqtt from "mqtt";

const BROKER_URL = "mqtt://localhost:1883";

const client = mqtt.connect(BROKER_URL);

client.on("connect", () => {
  console.log(`Conectado a Broker Mosquitto ${BROKER_URL}`);
});

client.on("error", (err) => {
  console.error("Error MQTT:", err);
});
