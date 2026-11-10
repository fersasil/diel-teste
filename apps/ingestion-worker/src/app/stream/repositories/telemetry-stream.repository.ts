import { Injectable } from "@nestjs/common";
import { RedisStore } from "../../../infra/redis/redis";

export interface StreamMessage {
  id: string;
  payload: string;
}

const TRIM = 500_000;
const FAIL_PREFIX = "telemetry:fails:";

@Injectable()
export class TelemetryStreamRepository {
  public constructor(private readonly redis: RedisStore) {}

  // Buffer between the broker and the consumer group. The approximate MAXLEN
  // drops the oldest entries once the stream outgrows the cap. True releases
  // the MQTT PUBACK. False makes the broker deliver the packet again.
  public async enqueue(payload: string, receivedAt = new Date()): Promise<boolean> {
    try {
      const redis = await this.redis.get();

      await redis.xAdd(this.streamKey(), "*", {
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

  public async backlog(): Promise<number> {
    const redis = await this.redis.get();
    return redis.xLen(this.streamKey());
  }

  public async ensureGroup(): Promise<void> {
    const redis = await this.redis.get();
    try {
      await redis.xGroupCreate(this.streamKey(), this.group(), "0", { MKSTREAM: true });
    } catch (error) {
      const text = error instanceof Error ? error.message : "";

      if (!text.includes("BUSYGROUP")) {
        throw error;
      }
    }
  }

  public async readNew(consumer: string, count: number, blockMs: number): Promise<StreamMessage[]> {
    const redis = await this.redis.openReader();
    const reply = await redis.xReadGroup(this.group(), consumer, {
      key: this.streamKey(),
      id: ">",
    }, { COUNT: count, BLOCK: blockMs });
    return flatten(reply);
  }

  public async claimStale(consumer: string, minIdleMs: number, count: number): Promise<StreamMessage[]> {
    const redis = await this.redis.openReader();
    try {
      const claimed = await redis.xAutoClaim(
        this.streamKey(),
        this.group(),
        consumer,
        minIdleMs,
        "0-0",
        { COUNT: count },
      );
      return (claimed.messages ?? [])
        .flatMap((item) => toMessage(item))
        .filter((item): item is StreamMessage => Boolean(item));
    } catch {
      return [];
    }
  }

  public async acknowledge(ids: string[]): Promise<void> {
    if (ids.length === 0) {
      return;
    }

    const redis = await this.redis.get();
    for (const id of ids) {
      await redis.xAck(this.streamKey(), this.group(), id);
      await redis.xDel(this.streamKey(), id);
    }

    await redis.del(ids.map((id) => `${FAIL_PREFIX}${id}`));
  }

  public async recordFailure(id: string): Promise<number> {
    const redis = await this.redis.get();
    return redis.incr(`${FAIL_PREFIX}${id}`);
  }

  public async moveToDeadLetter(id: string, payload: string): Promise<void> {
    const redis = await this.redis.get();

    await redis.xAdd(this.deadLetterKey(), "*", { payload, sourceId: id });
    await this.acknowledge([id]);
  }

  private streamKey(): string {
    return process.env.REDIS_STREAM_KEY ?? "telemetry:stream";
  }

  private group(): string {
    return process.env.REDIS_CONSUMER_GROUP ?? "telemetry_cg";
  }

  private deadLetterKey(): string {
    return `${this.streamKey()}:dlq`;
  }
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
