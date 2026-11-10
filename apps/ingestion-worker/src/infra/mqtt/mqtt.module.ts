import { Inject, Injectable, Module, type OnApplicationShutdown } from "@nestjs/common";
import mqtt, { type MqttClient } from "mqtt";
import { PinoLogger } from "nestjs-pino";
import { StreamModule } from "../../app/stream/stream.module";
import { MqttIngestion } from "./mqtt.ingestion";
import { MQTT_CLIENT } from "./mqtt.token";
import { workerId } from "./worker-identity";

// Opens the broker socket when the module starts. Without MQTT_URL there is
// no client and ingestion stays idle. The socket closes with the module.
const mqttClientProvider = {
  provide: MQTT_CLIENT,
  useFactory: async (logger: PinoLogger): Promise<MqttClient | null> => {
    logger.setContext("MqttClient");
    const url = process.env.MQTT_URL;

    if (!url) {
      return null;
    }

    const client = mqtt.connect(url, {
      clientId: workerId(),
      clean: true,
      protocolVersion: 4,
      keepalive: 60,
      reconnectPeriod: 1000,
    });
    client.on("reconnect", () => logger.warn("mqtt reconnecting"));
    client.on("error", (error) => logger.error({ err: error }, "mqtt error"));
    await waitForConnect(client);
    return client;
  },

  inject: [PinoLogger],
};

@Injectable()
class MqttClientShutdown implements OnApplicationShutdown {
  public constructor(@Inject(MQTT_CLIENT) private readonly client: MqttClient | null) {}

  public async onApplicationShutdown(): Promise<void> {
    if (!this.client) {
      return;
    }

    await new Promise<void>((resolve) => {
      this.client?.end(false, {}, () => resolve());
    });
  }
}

@Module({
  imports: [StreamModule],
  providers: [mqttClientProvider, MqttClientShutdown, MqttIngestion],
  exports: [MqttIngestion],
})
export class MqttModule {}

function waitForConnect(client: MqttClient): Promise<void> {
  return new Promise((resolve) => {
    client.on("connect", () => resolve());
  });
}
