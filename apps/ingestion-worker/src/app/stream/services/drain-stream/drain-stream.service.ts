import { shouldDeadLetter } from "../ack-gate/ack-gate.service";
import type { StreamJob } from "./drain-stream.interface";

export type { StreamJob } from "./drain-stream.interface";

export function concurrencyForBacklog(backlog: number): number {
  const base = positive(process.env.INGEST_CONCURRENCY, 8);
  const peak = Math.max(base, positive(process.env.INGEST_CONCURRENCY_PEAK, 32));

  if (backlog >= 5000) {
    return peak;
  }

  if (backlog >= 500) {
    return Math.min(peak, base * 2);
  }

  return base;
}

function positive(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

export async function drainInOrder(
  items: StreamJob[],
  persist: (line: string) => Promise<boolean>,
  ack: (id: string) => Promise<void>,
  dead: (id: string, payload: string) => Promise<void>,
  bumpFails: (id: string) => Promise<number>,
): Promise<void> {
  for (const item of items) {
    await settle(item, persist, ack, dead, bumpFails);
  }
}

export async function drainMessages(
  items: StreamJob[],
  persist: (line: string) => Promise<boolean>,
  ack: (id: string) => Promise<void>,
  dead: (id: string, payload: string) => Promise<void>,
  bumpFails: (id: string) => Promise<number>,
  limit = 8,
): Promise<void> {
  let active = 0;
  const waiters: Array<() => void> = [];
  async function lock(): Promise<void> {
    if (active < limit) {
      active += 1;
      return;
    }

    await new Promise<void>((resolve) => waiters.push(resolve));
    active += 1;
  }

  function unlock(): void {
    active -= 1;
    waiters.shift()?.();
  }

  await Promise.all(items.map(async (item) => {
    await lock();
    try {
      await settle(item, persist, ack, dead, bumpFails);
    } finally {
      unlock();
    }
  }));
}

async function settle(
  item: StreamJob,
  persist: (line: string) => Promise<boolean>,
  ack: (id: string) => Promise<void>,
  dead: (id: string, payload: string) => Promise<void>,
  bumpFails: (id: string) => Promise<number>,
): Promise<void> {
  const ok = await persist(item.payload);

  if (ok) {
    await ack(item.id);
    return;
  }

  const fails = await bumpFails(item.id);

  if (shouldDeadLetter(fails)) {
    await dead(item.id, item.payload);
  }
}
