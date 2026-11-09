import type { Server } from "node:http";
import jwt from "jsonwebtoken";
import { createClient } from "redis";
import { WebSocketServer, type WebSocket } from "ws";
import { getFocus } from "../../app/auth/services/focus-client/focus-client.service";

interface LiveClient {
  socket: WebSocket;
  profile: string;
  clientId: string | null;
  allowedStoreIds: string[];
  userId?: string;
}

export function attachLiveSockets(server: Server): void {
  const clients = new Set<LiveClient>();
  const wss = new WebSocketServer({ noServer: true });
  server.on("upgrade", (request, socket, head) => {
    const url = new URL(request.url ?? "", "http://localhost");
    if (url.pathname !== "/live") {
      socket.destroy();
      return;
    }
    const access = verify(url.searchParams.get("token"));
    if (!access) {
      socket.destroy();
      return;
    }
    wss.handleUpgrade(request, socket, head, (ws) => {
      const live = { socket: ws, ...access };
      clients.add(live);
      ws.on("close", () => clients.delete(live));
    });
  });
  void fanout(clients).catch(() => undefined);
}

function verify(token: string | null): Omit<LiveClient, "socket"> | null {
  const secret = process.env.JWT_SECRET;
  if (!token || !secret) {
    return null;
  }
  try {
    const payload = jwt.verify(token, secret);
    if (!payload || typeof payload === "string") {
      return null;
    }
    return {
      profile: String(payload.profile),
      clientId: typeof payload.clientId === "string" ? payload.clientId : null,
      allowedStoreIds: Array.isArray(payload.allowedStoreIds) ? payload.allowedStoreIds.map(String) : [],
      userId: typeof payload.sub === "string" ? payload.sub : undefined,
    };
  } catch {
    return null;
  }
}

async function fanout(clients: Set<LiveClient>): Promise<void> {
  const url = process.env.REDIS_URL;
  if (!url) {
    return;
  }
  const subscriber = createClient({ url });
  subscriber.on("error", () => undefined);
  await subscriber.connect();
  await subscriber.pSubscribe("live:*", (message, channel) => {
    const event = JSON.parse(message) as { storeId?: string };
    const clientId = channel.slice("live:".length);
    for (const live of clients) {
      void deliver(live, clientId, event, message);
    }
  });
}

const focusCache = new Map<string, { id: string | null; until: number }>();

async function focusedClient(live: LiveClient): Promise<string | null> {
  if (live.profile !== "diel_operator") {
    return live.clientId;
  }
  const userId = live.userId ?? "";
  const hit = focusCache.get(userId);
  if (hit && hit.until > Date.now()) {
    return hit.id;
  }
  const id = await getFocus(userId);
  focusCache.set(userId, { id, until: Date.now() + 5000 });
  return id;
}

async function deliver(live: LiveClient, clientId: string, event: { storeId?: string }, message: string): Promise<void> {
  const focused = await focusedClient(live);
  if (focused !== clientId) {
    return;
  }
  if (live.profile === "store_manager" && !live.allowedStoreIds.includes(event.storeId ?? "")) {
    return;
  }
  live.socket.send(message);
}
