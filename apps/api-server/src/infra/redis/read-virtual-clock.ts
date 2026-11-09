import { createClient, type RedisClientType } from "redis";

let client: RedisClientType | undefined;
let connecting: Promise<unknown> | undefined;

async function redis(): Promise<RedisClientType | null> {
  const url = process.env.REDIS_URL;
  if (!url) {
    return null;
  }
  if (!client) {
    client = createClient({ url });
    client.on("error", () => undefined);
    connecting = client.connect();
  }
  await connecting;
  return client;
}

export async function readStoredVirtualNow(): Promise<string | null> {
  try {
    const store = await redis();
    return store ? await store.get("system:virtual_now") : null;
  } catch {
    return null;
  }
}

export async function readVirtualNow(): Promise<Date> {
  const value = await readStoredVirtualNow();
  return value ? new Date(value) : new Date();
}
