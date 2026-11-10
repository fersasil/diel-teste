import { Injectable } from "@nestjs/common";
import { createClient, type RedisClientType } from "redis";
import { ClientRepository } from "../../../clients/repositories/client.repository";
import type { FocusResult } from "./focus-client.interface";

export type { FocusResult } from "./focus-client.interface";

const memory = new Map<string, string>();
let client: RedisClientType | undefined;
let connecting: Promise<unknown> | undefined;

function focusKey(userId: string): string {
  return `operator:focus:${userId}`;
}

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

export async function setFocus(userId: string, clientId: string): Promise<void> {
  const store = await redis();

  if (!store) {
    memory.set(userId, clientId);
    return;
  }

  await store.set(focusKey(userId), clientId);
}

export async function getFocus(userId: string): Promise<string | null> {
  const store = await redis();

  if (!store) {
    return memory.get(userId) ?? null;
  }

  return (await store.get(focusKey(userId))) ?? null;
}

@Injectable()
export class FocusClientService {
  private readonly clients = new ClientRepository();

  async execute(userId: string, clientId: string): Promise<FocusResult> {
    const client = await this.clients.findById(clientId);

    if (!client) {
      return { code: "NOT_FOUND" };
    }

    await setFocus(userId, client.id);
    return { clientId: client.id };
  }
}
