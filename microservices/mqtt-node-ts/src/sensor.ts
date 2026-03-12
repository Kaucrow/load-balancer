import mqtt from "mqtt";

const mqttURL = "mqtt://localhost:1883";
const msInterval = 200;

const topics = {
  request: "sensor/climate/request",
  response: "sensor/climate/response",
};

let temperature = 22;
let humidity = 55;

interface ClimateResponse {
  type: string;
  timestamp: string;
  temperature?: number;
  humidity?: number;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function drift(current: number, step: number, min: number, max: number): number {
  const delta = (Math.random() - 0.5) * 2 * step;
  return clamp(current + delta, min, max);
}

const client = mqtt.connect(mqttURL);

client.on("connect", () => {
  console.log("[sensor] Conectado al broker");
  
  client.subscribe(topics.request);

  setInterval(() => {
    temperature = parseFloat(drift(temperature, 0.5, -10, 45).toFixed(1));
    humidity = parseFloat(drift(humidity, 1, 10, 95).toFixed(1));

    console.log(`[sensor] temp=${temperature}°C  hum=${humidity}%`);

  }, msInterval);
});

client.on("message", (topic, payload) => {
  const msg = payload.toString();

  if (msg === "temperature" || msg === "humidity" || msg === "all") {
    const response: ClimateResponse = { type: msg, timestamp: new Date().toISOString() };

    if (msg === "temperature" || msg === "all") response.temperature = temperature;
    if (msg === "humidity" || msg === "all") response.humidity = humidity;

    client.publish(topics.response, JSON.stringify(response));

    console.log(`[sensor] Respondiendo a solicitud de "${msg}" en ${topic}`);
  }
});

client.on("error", (err) => console.error("[sensor] Error MQTT:", err));
