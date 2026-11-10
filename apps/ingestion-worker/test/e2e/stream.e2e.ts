import mqtt from "mqtt";
import { createClient } from "redis";
import { Pool } from "pg";
import { restoreDatasetClock } from "./restore-dataset-clock";

const mqttUrl = process.env.MQTT_URL;
const redisUrl = process.env.REDIS_URL;
const live = mqttUrl && redisUrl && process.env.DATABASE_URL ? it : it.skip;

describe("mqtt to redis stream ingest", () => {
  jest.setTimeout(20_000);

  live("enqueues on the stream and persists the sample", async () => {
    const stamp = `2026-04-04T12:${String(Date.now() % 60).padStart(2, "0")}:01.000Z`;
    const payload = {
      deviceId: "IOT001",
      timestamp: stamp,
      intervalSeconds: 60,
      readings: [23],
      savedData: false,
    };
    const published = await publish(JSON.stringify(payload));
    expect(published).toBe(true);
    const redis = createClient({ url: redisUrl });
    await redis.connect();
    const stream = process.env.REDIS_STREAM_KEY ?? "telemetry:stream";
    let pending = 1;
    for (let attempt = 0; attempt < 40; attempt += 1) {
      const info = await redis.xPending(stream, process.env.REDIS_CONSUMER_GROUP ?? "telemetry_cg");
      pending = Number(info.pending ?? info);
      if (Number.isNaN(pending)) {
        pending = 0;
      }
      if (pending === 0) {
        break;
      }
      await new Promise((resolve) => setTimeout(resolve, 250));
    }
    await redis.quit();
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    try {
      const row = await waitSample(pool, stamp);
      expect(row).toBeTruthy();
    } finally {
      await restoreDatasetClock(pool);
      await pool.end();
    }
  });
});

function publish(line: string): Promise<boolean> {
  const client = mqtt.connect(mqttUrl ?? "");
  return new Promise((resolve) => {
    const timer = setTimeout(() => {
      client.end(true);
      resolve(false);
    }, 8000);
    client.once("error", () => {
      clearTimeout(timer);
      client.end(true);
      resolve(false);
    });
    client.once("connect", () => {
      client.publish("diel/telemetry", line, { qos: 1 }, (error) => {
        clearTimeout(timer);
        client.end(true);
        resolve(!error);
      });
    });
  });
}

async function waitSample(pool: Pool, stamp: string) {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    const result = await pool.query(
      "SELECT 1 FROM telemetry_samples WHERE sample_time = $1::timestamptz LIMIT 1",
      [stamp],
    );
    if (result.rowCount) {
      return result.rows[0];
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  return null;
}
