import { Injectable, type OnApplicationShutdown } from "@nestjs/common";
import { createClient, type RedisClientType } from "redis";

@Injectable()
export class RedisStore implements OnApplicationShutdown {
  private client: RedisClientType | undefined;
  private reader: RedisClientType | undefined;
  private connecting: Promise<unknown> | undefined;

  public async get(): Promise<RedisClientType> {
    if (!this.client) {
      this.client = createClient({ url: process.env.REDIS_URL ?? "redis://redis:6379" });
      this.client.on("error", () => undefined);
      this.connecting = this.client.connect();
    }

    await this.connecting;
    return this.client;
  }

  public async openReader(): Promise<RedisClientType> {
    if (!this.reader) {
      const base = await this.get();
      this.reader = base.duplicate();
      this.reader.on("error", () => undefined);
      await this.reader.connect();
    }

    return this.reader;
  }

  public async close(): Promise<void> {
    const extra = this.reader;
    const current = this.client;
    this.reader = undefined;
    this.client = undefined;
    this.connecting = undefined;
    await extra?.quit().catch(() => undefined);
    await current?.quit().catch(() => undefined);
  }

  public async onApplicationShutdown(): Promise<void> {
    await this.close();
  }
}
