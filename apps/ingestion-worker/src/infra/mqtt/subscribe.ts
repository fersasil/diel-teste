import mqtt from "mqtt";
import pino from "pino";
import { ensureBucket } from "../object-store/object-store";
import { shouldMqttAck } from "../../app/stream/services/ack-gate/ack-gate.service";
import { enqueueRaw } from "../../app/stream/repositories/telemetry-stream.repository";
import { sharedTopic, workerId } from "./worker-identity";

const log = pino();

export async function startIngestion(): Promise<{ stop: () => Promise<void> }> {
  const url = process.env.MQTT_URL;
  if (!url) {
    return { stop: async () => undefined };
  }
  for (let attempt = 0; attempt < 30; attempt += 1) {
    try {
      await ensureBucket();
      break;
    } catch (error) {
      if (attempt === 29) {
        throw error;
      }
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }
  const client = mqtt.connect(url, {
    clientId: workerId(),
    clean: true,
    protocolVersion: 4,
    keepalive: 60,
    reconnectPeriod: 1000,
  });
  client.on("reconnect", () => log.warn("mqtt reconnecting"));
  client.on("error", (error) => log.error({ err: error }, "mqtt error"));
  client.handleMessage = (packet, done) => {
    const line = packet.payload.toString();
    void enqueueRaw(line).then((enqueued) => {
      if (shouldMqttAck(enqueued)) {
        done();
        return;
      }
      log.warn("stream enqueue failed");
      done(new Error("not enqueued"));
    }).catch((error: unknown) => {
      log.error({ err: error }, "stream enqueue failed");
      done(error instanceof Error ? error : new Error("not enqueued"));
    });
  };
  await new Promise<void>((resolve) => {
    client.on("connect", () => resolve());
  });
  const topic = sharedTopic();
  await new Promise<void>((resolve, reject) => {
    client.subscribe(topic, { qos: 1 }, (error) => error ? reject(error) : resolve());
  });
  log.info({ topic, clientId: client.options.clientId }, "ingestion subscribed");
  return {
    stop: () => new Promise((resolve) => {
      client.end(false, {}, () => resolve());
    }),
  };
}
