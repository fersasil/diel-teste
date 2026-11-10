import { Injectable } from "@nestjs/common";
import { RedisStore } from "../../../../infra/redis/redis";

const COALESCE_MS = 1000;

@Injectable()
export class PublishLiveService {
  private readonly queued = new Map<string, { clientId: string; payload: unknown }>();
  private flushTimer: ReturnType<typeof setTimeout> | undefined;

  public constructor(private readonly redis: RedisStore) {}

  // Collapse a burst to one event per environment. The batch is already durable if publish fails.
  public execute(clientId: string, environmentId: string, payload: unknown): void {
    this.queued.set(environmentId, { clientId, payload });

    if (this.flushTimer) {
      return;
    }

    this.flushTimer = setTimeout(() => {
      this.flushTimer = undefined;
      const notes = [...this.queued.values()];
      this.queued.clear();
      void Promise.all(notes.map((item) => this.publishToClientChannel(item.clientId, item.payload)));
    }, COALESCE_MS);

  }

  private async publishToClientChannel(clientId: string, payload: unknown): Promise<void> {
    try {
      const store = await this.redis.get();

      await store.publish(`live:${clientId}`, JSON.stringify(payload));
    } catch {
      return;
    }
  }
}
