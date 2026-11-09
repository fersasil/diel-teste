import { readFileSync } from "node:fs";
import mqtt from "mqtt";
import { normalizeLine } from "./parse-line";

export function loadLines(path: string): string[] {
  return readFileSync(path, "utf8")
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

export const TELEMETRY_TOPIC = "diel/telemetry";
export const PUBLISH_QOS = 1 as const;

export async function publishLines(
  lines: string[],
  publish: (topic: string, payload: string, qos: 1) => Promise<void>,
): Promise<number> {
  for (const line of lines) {
    await publish(TELEMETRY_TOPIC, line, PUBLISH_QOS);
  }
  return lines.length;
}

async function main(): Promise<void> {
  const file = process.env.TELEMETRY_FILE ?? "telemetrias.jsonl";
  const lines = loadLines(file).map(normalizeLine);
  const url = process.env.MQTT_URL;
  if (!url) {
    process.stdout.write(`${lines.length}\n`);
    return;
  }
  process.stdout.write(`publishing ${lines.length} packets from ${file}\n`);
  const client = mqtt.connect(url, { reconnectPeriod: 1000 });
  await new Promise<void>((resolve, reject) => {
    client.once("connect", () => resolve());
    client.once("error", reject);
  });
  await publishLines(lines, (topic, payload, qos) => new Promise((resolve, reject) => {
    client.publish(topic, payload, { qos }, (error) => error ? reject(error) : resolve());
  }));
  await new Promise<void>((resolve) => client.end(false, {}, () => resolve()));
  process.stdout.write(`published ${lines.length}\n`);
}

if (require.main === module) {
  void main();
}
