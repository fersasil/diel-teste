import { Inject, Injectable } from "@nestjs/common";
import type { MqttClient } from "mqtt";
import { PinoLogger } from "nestjs-pino";
import { shouldMqttAck } from "../../app/stream/services/ack-gate/ack-gate.service";
import { TelemetryStreamRepository } from "../../app/stream/repositories/telemetry-stream.repository";
import { ObjectStore } from "../object-store/object-store";
import { MQTT_CLIENT } from "./mqtt.token";
import { sharedTopic } from "./worker-identity";

const BUCKET_ATTEMPTS = 30;

// The module owns the connected client. This service only subscribes.
// PUBACK goes out only after the raw line is appended to the Redis stream.
// MinIO and Timescale run later, in the consumer. If the append fails, the
// broker keeps the packet and delivers it again.
@Injectable()
export class MqttIngestion {
  public constructor(
    @Inject(MQTT_CLIENT) private readonly client: MqttClient | null,
    private readonly objects: ObjectStore,
    private readonly stream: TelemetryStreamRepository,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(MqttIngestion.name);
  }

  public async start(): Promise<void> {
    if (!this.client) {
      return;
    }

    try {
      await this.waitForRawBucket();
      this.client.handleMessage = (packet, done) => {
        void this.enqueueRawAndAck(packet.payload.toString(), done);
      };

      const topic = sharedTopic();

      await subscribe(this.client, topic);

      this.logger.info({ topic, clientId: this.client.options.clientId }, "ingestion subscribed");
    } catch (error) {
      await this.stop();
      throw error;
    }
  }

  public async stop(): Promise<void> {
    if (!this.client) {
      return;
    }

    const topic = sharedTopic();

    await new Promise<void>((resolve) => {
      this.client?.unsubscribe(topic, () => resolve());
    });
  }

  // done() is the PUBACK. Calling it with an error leaves the message with the broker.
  private async enqueueRawAndAck(line: string, done: (error?: Error) => void): Promise<void> {
    try {
      // Salva no Redis
      const stored = await this.stream.enqueue(line);

      if (shouldMqttAck(stored)) {
        done();
        return;
      }

      this.logger.warn("stream enqueue failed");

      done(new Error("not enqueued"));
    } catch (error) {
      this.logger.error({ err: error }, "stream enqueue failed");

      done(error instanceof Error ? error : new Error("not enqueued"));
    }
  }

  // The bucket has to exist before we accept a packet, or the later batch has nowhere to put the raw text.
  private async waitForRawBucket(): Promise<void> {
    for (let attempt = 0; attempt < BUCKET_ATTEMPTS; attempt += 1) {
      try {
        await this.objects.ensureBucket();
        return;
      } catch (error) {

        if (attempt === BUCKET_ATTEMPTS - 1) {
          throw error;
        }

        await delay(1000);
      }
    }
  }
}

function subscribe(client: MqttClient, topic: string): Promise<void> {
  return new Promise((resolve, reject) => {
    client.subscribe(topic, { qos: 1 }, (error) => (error ? reject(error) : resolve()));
  });
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
