import { createClient, type RedisClientType } from "redis";
import { getPool } from "../database/pg-pool";

const KEY = "system:virtual_now";
const RESTORE = `
local current = redis.call("GET", KEYS[1])
if current and current >= ARGV[1] then
  return current
end
redis.call("SET", KEYS[1], ARGV[1])
return ARGV[1]
`;

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
    const cached = store ? await store.get(KEY) : null;

    if (cached) {
      return cached;
    }

    const stored = await storedVirtualNow();

    if (!stored || !store) {
      return stored;
    }

    const saved = await store.eval(RESTORE, { keys: [KEY], arguments: [stored] });
    return String(saved);
  } catch {
    return null;
  }
}

async function storedVirtualNow(): Promise<string | null> {
  if (!process.env.DATABASE_URL) {
    return null;
  }

  const result = await getPool().query<{ virtual_now: Date }>(
    "SELECT virtual_now FROM virtual_clock WHERE id = 1",
  );
  const value = result.rows[0]?.virtual_now;
  return value ? value.toISOString() : null;
}

export async function readVirtualNow(): Promise<Date> {
  const value = await readStoredVirtualNow();
  return value ? new Date(value) : new Date();
}
