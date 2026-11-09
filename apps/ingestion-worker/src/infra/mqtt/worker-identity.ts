import { hostname } from "node:os";

const TOPIC = "diel/telemetry";

function token(value: string | undefined, fallback: string): string {
  const cleaned = (value ?? "").replace(/[^A-Za-z0-9_-]/g, "");
  return cleaned || fallback;
}

export function workerId(): string {
  const base = token(process.env.MQTT_CLIENT_ID, "ingestion");
  const host = token(hostname(), String(process.pid));
  return `${base}-${host}`.slice(0, 128);
}

export function sharedTopic(): string {
  const group = token(process.env.MQTT_SHARE_GROUP, "ingestion");
  return `$share/${group}/${TOPIC}`;
}
