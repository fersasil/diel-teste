"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { browserApiBase } from "../shared/api-base";

export interface LivePatch {
  environmentId: string;
  lastTemp: number | null;
  latestAt: string;
  lastComfortStatus: "IN_RANGE" | "ABOVE" | "BELOW" | null;
  deviceStatus: "ONLINE" | "OFFLINE" | "NO_DATA";
}

export function useLivePatches(token: string): Map<string, LivePatch> {
  const [patches, setPatches] = useState<Map<string, LivePatch>>(new Map());
  useEffect(() => subscribe(token, (pending) => {
    setPatches((current) => {
      const next = new Map(current);
      for (const [id, patch] of pending) {
        next.set(id, patch);
      }
      return next;
    });
  }), [token]);
  return patches;
}

export function LiveRefresh({ token }: { token: string }) {
  const router = useRouter();
  useEffect(() => subscribe(token, () => router.refresh()), [router, token]);
  return null;
}

function subscribe(token: string, onFlush: (pending: Map<string, LivePatch>) => void): () => void {
  if (!token) {
    return () => undefined;
  }
  const pending = new Map<string, LivePatch>();
  const base = browserApiBase();
  const socket = new WebSocket(`${base.replace(/^http/, "ws")}/live?token=${token}`);
  socket.onmessage = (event) => {
    const patch = readPatch(String(event.data));
    if (patch) {
      pending.set(patch.environmentId, patch);
    }
  };
  const timer = window.setInterval(() => {
    if (pending.size === 0) {
      return;
    }
    const batch = new Map(pending);
    pending.clear();
    onFlush(batch);
  }, 1000);
  return () => {
    window.clearInterval(timer);
    socket.close();
  };
}

function readPatch(raw: string): LivePatch | null {
  try {
    const body = JSON.parse(raw) as Partial<LivePatch> & { type?: string };
    if (body.type !== "environment.updated" || !body.environmentId || !body.latestAt || !body.deviceStatus) {
      return null;
    }
    return {
      environmentId: body.environmentId,
      lastTemp: typeof body.lastTemp === "number" ? body.lastTemp : null,
      latestAt: body.latestAt,
      lastComfortStatus: body.lastComfortStatus ?? null,
      deviceStatus: body.deviceStatus,
    };
  } catch {
    return null;
  }
}
