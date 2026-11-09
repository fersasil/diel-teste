import { getRedis, getRedisReader } from "../../../infra/redis/redis";

export interface StreamMessage {
  id: string;
  payload: string;
}

const TRIM = 500_000;
const FAIL_PREFIX = "telemetry:fails:";

export function streamKey(): string {
  return process.env.REDIS_STREAM_KEY ?? "telemetry:stream";
}

export function streamGroup(): string {
  return process.env.REDIS_CONSUMER_GROUP ?? "telemetry_cg";
}

export function deadLetterKey(): string {
  return `${streamKey()}:dlq`;
}

export async function enqueueRaw(payload: string, receivedAt = new Date()): Promise<boolean> {
  try {
    const redis = await getRedis();
    await redis.xAdd(streamKey(), "*", {
      payload,
      receivedAt: receivedAt.toISOString(),
    }, {
      TRIM: { strategy: "MAXLEN", strategyModifier: "~", threshold: TRIM },
    });
    return true;
  } catch {
    return false;
  }
}

export async function streamBacklog(): Promise<number> {
  const redis = await getRedis();
  return redis.xLen(streamKey());
}

export async function ensureGroup(): Promise<void> {
  const redis = await getRedis();
  try {
    await redis.xGroupCreate(streamKey(), streamGroup(), "0", { MKSTREAM: true });
  } catch (error) {
    const text = error instanceof Error ? error.message : "";
    if (!text.includes("BUSYGROUP")) {
      throw error;
    }
  }
}

export async function readBatch(
  consumer: string,
  count: number,
  blockMs: number,
): Promise<StreamMessage[]> {
  const redis = await getRedisReader();
  const reply = await redis.xReadGroup(streamGroup(), consumer, {
    key: streamKey(),
    id: ">",
  }, { COUNT: count, BLOCK: blockMs });
  return flatten(reply);
}

export async function claimStale(
  consumer: string,
  minIdleMs: number,
  count: number,
): Promise<StreamMessage[]> {
  const redis = await getRedisReader();
  try {
    const claimed = await redis.xAutoClaim(
      streamKey(),
      streamGroup(),
      consumer,
      minIdleMs,
      "0-0",
      { COUNT: count },
    );
    return (claimed.messages ?? []).flatMap((item) => toMessage(item)).filter((item): item is StreamMessage => Boolean(item));
  } catch {
    return [];
  }
}

export async function ackAndDelete(ids: string[]): Promise<void> {
  if (ids.length === 0) {
    return;
  }
  const redis = await getRedis();
  for (const id of ids) {
    await redis.xAck(streamKey(), streamGroup(), id);
    await redis.xDel(streamKey(), id);
  }
  await redis.del(ids.map((id) => `${FAIL_PREFIX}${id}`));
}

export async function bumpFails(id: string): Promise<number> {
  const redis = await getRedis();
  return redis.incr(`${FAIL_PREFIX}${id}`);
}

export async function moveToDeadLetter(id: string, payload: string): Promise<void> {
  const redis = await getRedis();
  await redis.xAdd(deadLetterKey(), "*", { payload, sourceId: id });
  await ackAndDelete([id]);
}

function flatten(
  reply: Array<{ name: string; messages: Array<{ id: string; message: Record<string, string> }> }> | null,
): StreamMessage[] {
  if (!reply) {
    return [];
  }
  return reply.flatMap((entry) => entry.messages.flatMap((item) => toMessage(item) ?? []));
}

function toMessage(item: { id: string; message?: Record<string, string> } | null): StreamMessage | null {
  if (!item?.id) {
    return null;
  }
  const payload = item.message?.payload;
  if (!payload) {
    return null;
  }
  return { id: item.id, payload };
}
