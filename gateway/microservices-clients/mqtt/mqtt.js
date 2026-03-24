import mqtt from "mqtt";

const BROKER_URL = "mqtt://localhost:1883";

class MQTTClient {
    constructor() {
        this.client = mqtt.connect(BROKER_URL);
        this._pendingQueue = [];

        this.topics = {
            request: "sensor/climate/request",
            response: "sensor/climate/response",
        };

        this.client.on("connect", () => {
            console.log("[consumer] Conectado al broker");
            this.client.subscribe(this.topics.response);
        });

        this.client.on("message", (topic, payload) => {
            if (this._pendingQueue.length === 0) return;
            const { resolve, timeoutId } = this._pendingQueue.shift();
            clearTimeout(timeoutId);
            resolve(JSON.parse(payload.toString()));
        });

        this.client.on("error", (err) => {
            console.error("Error MQTT:", err);
        });
    }

    async request(option, timeout = 5000) {
        return new Promise((resolve, reject) => {
            const timeoutId = setTimeout(() => {
                const idx = this._pendingQueue.findIndex(p => p.timeoutId === timeoutId);
                if (idx !== -1) this._pendingQueue.splice(idx, 1);
                reject(new Error(`Timeout después de ${timeout}ms`));
            }, timeout);
            this._pendingQueue.push({ resolve, reject, timeoutId });
            this.client.publish(this.topics.request, option);
        });
    }
}

const mqttClient = new MQTTClient();

export default mqttClient;
