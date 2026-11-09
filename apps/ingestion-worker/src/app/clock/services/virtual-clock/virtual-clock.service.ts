import { getRedis } from "../../../../infra/redis/redis";

const KEY = "system:virtual_now";

const ADVANCE = `
local current = redis.call("GET", KEYS[1])
if current and current >= ARGV[1] then
  return current
end
redis.call("SET", KEYS[1], ARGV[1])
return ARGV[1]
`;

export async function advanceVirtualNow(sampleTime: Date): Promise<string> {
  const store = await getRedis();
  const next = sampleTime.toISOString();
  const saved = await store.eval(ADVANCE, { keys: [KEY], arguments: [next] });
  return String(saved);
}

export async function publishLive(clientId: string, payload: unknown): Promise<void> {
  const store = await getRedis();
  await store.publish(`live:${clientId}`, JSON.stringify(payload));
}

const queued = new Map<string, { clientId: string; payload: unknown }>();
let flushTimer: ReturnType<typeof setTimeout> | undefined;

export function noteLive(clientId: string, environmentId: string, payload: unknown): void {
  queued.set(environmentId, { clientId, payload });
  if (flushTimer) {
    return;
  }
  flushTimer = setTimeout(() => {
    flushTimer = undefined;
    const notes = [...queued.values()];
    queued.clear();
    void Promise.all(notes.map((note) => publishLive(note.clientId, note.payload).catch(() => undefined)));
  }, 1000);
}
