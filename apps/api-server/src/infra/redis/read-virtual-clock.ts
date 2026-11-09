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

export async function readVirtualNow(): Promise<Date> {
  try {
    const store = await redis();
    const value = store ? await store.get("system:virtual_now") : null;
    return value ? new Date(value) : new Date();
  } catch {
    return new Date();
  }
}
