import mqtt from "mqtt";

const BROKER_URL = "mqtt://localhost:1883";

class MQTTClient {
    constructor() {
        this.client = mqtt.connect(BROKER_URL);
        this.lastValue = null;
        this.getResponse = true;

        this.topics = {
            request: "sensor/climate/request",
            response: "sensor/climate/response",
        };

        this.client.on("connect", () => {
            console.log("[consumer] Conectado al broker");
            this.client.subscribe(this.topics.response);
        });

        this.client.on("message", (topic, payload) => {
            if (this.getResponse){
                this.lastValue = JSON.parse(payload.toString());
                this.getResponse = false;
            }
            //console.log(`[consumer] Recibido mensaje de el topic ${topic}: ${data.temp}`);
        });

        this.client.on("error", (err) => {
            console.error("Error MQTT:", err);
        });
    }

    publish(msg){
        this.getResponse = true;
        this.client.publish(this.topics.request, msg);
        return this.lastValue;
    }

    async waitForResponse(timeout = 5000) {
        return new Promise((resolve, reject) => {
            if (!this.getResponse && this.lastValue !== null) {
                resolve(this.lastValue);
                return;
            }

            const timeoutId = setTimeout(() => {
                clearInterval(intervalId);
                reject(new Error(`Timeout después de ${timeout}ms`));
            }, timeout);

            const intervalId = setInterval(() => {
                if (!this.getResponse && this.lastValue !== null) {
                    clearInterval(intervalId);
                    clearTimeout(timeoutId);
                    resolve(this.lastValue);
                }
            }, 100);
        });
    }
}

const mqttClient = new MQTTClient();

export default mqttClient;