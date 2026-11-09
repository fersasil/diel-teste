import pino from "pino";
import { ingestBatches, ingestFailures, ingestPackets, streamBacklogGauge } from "../../../../infra/http/ingest-metrics";
import { workerId } from "../../../../infra/mqtt/worker-identity";
import { ingestLines } from "../../../packet/services/ingest-batch/ingest-batch.service";
import { shouldDeadLetter } from "../ack-gate/ack-gate.service";
import {
  ackAndDelete,
  bumpFails,
  claimStale,
  ensureGroup,
  moveToDeadLetter,
  readBatch,
  streamBacklog,
} from "../../repositories/telemetry-stream.repository";

const log = pino();
const BATCH = 2000;
const BLOCK_MS = 2000;
const STALE_MS = 60_000;

export function startStreamConsumer(): { stop: () => Promise<void> } {
  let stopped = false;
  let running: Promise<void> | undefined;
  function loop(): Promise<void> {
    running = (async () => {
      await ensureGroup();
      const consumer = workerId();
      while (!stopped) {
        try {
          const stale = await claimStale(consumer, STALE_MS, BATCH);
          const fresh = stopped ? [] : await readBatch(consumer, BATCH, BLOCK_MS);
          const batch = [...stale, ...fresh];
          if (batch.length === 0) {
            continue;
          }
          const backlog = await streamBacklog();
          streamBacklogGauge.set(backlog);
          log.info({ backlog, count: batch.length }, "ingest batch");
          const ok = await ingestLines(batch.map((item) => item.payload));
          if (ok) {
            ingestBatches.inc();
            ingestPackets.inc(batch.length);
            await ackAndDelete(batch.map((item) => item.id));
            continue;
          }
          ingestFailures.inc();
          for (const item of batch) {
            const fails = await bumpFails(item.id);
            if (shouldDeadLetter(fails)) {
              await moveToDeadLetter(item.id, item.payload);
            }
          }
        } catch (error) {
          log.error({ err: error }, "stream consume failed");
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      }
    })();
    return running;
  }
  void loop();
  return {
    stop: async () => {
      stopped = true;
      await running;
    },
  };
}
