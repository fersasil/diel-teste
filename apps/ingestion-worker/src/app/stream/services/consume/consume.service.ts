import { Injectable } from "@nestjs/common";
import { PinoLogger } from "nestjs-pino";
import { IngestMetrics } from "../../../../infra/http/ingest-metrics";
import { workerId } from "../../../../infra/mqtt/worker-identity";
import { IngestBatchService } from "../../../packet/services/ingest-batch/ingest-batch.service";
import { shouldDeadLetter } from "../ack-gate/ack-gate.service";
import { TelemetryStreamRepository, type StreamMessage } from "../../repositories/telemetry-stream.repository";

const BATCH_SIZE = 2000;
const BLOCK_MS = 2000;
const STALE_MS = 60_000;

// Reads the Redis consumer group. A batch is acknowledged only after ingest
// persists it. A rejection leaves the ids pending, so a later claim can retry
// them. Repeated failures are copied to the dead letter and then acknowledged.
@Injectable()
export class ConsumeService {
  private stopped = false;
  private running: Promise<void> | undefined;

  public constructor(
    private readonly stream: TelemetryStreamRepository,
    private readonly ingest: IngestBatchService,
    private readonly metrics: IngestMetrics,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(ConsumeService.name);
  }

  public execute(): Promise<void> {
    return this.readUntilStopped();
  }

  // Nest calls these by name. They stay private so execute is the only public method.
  protected onModuleInit(): void {
    this.running = this.execute();
  }

  protected async onApplicationShutdown(): Promise<void> {
    this.stopped = true;
    await this.running;
  }

  private async readUntilStopped(): Promise<void> {
    await this.stream.ensureGroup();
    const consumer = workerId();
    while (!this.stopped) {
      try {
        // Lê do Redis
        const batch = await this.readStaleThenFresh(consumer);

        if (batch.length === 0) {
          continue;
        }

        // Processa o batch
        await this.ackAfterIngest(batch);
      } catch (error) {
        this.logger.error({ err: error }, "stream consume failed");

        await delay(1000);
      }
    }
  }

  // Messages left pending by a stopped consumer come first. Shutdown skips the
  // blocking read so the process does not wait out the poll interval.
  private async readStaleThenFresh(consumer: string): Promise<StreamMessage[]> {
    const stale = await this.stream.claimStale(consumer, STALE_MS, BATCH_SIZE);

    if (this.stopped) {
      return stale;
    }

    const fresh = await this.stream.readNew(consumer, BATCH_SIZE, BLOCK_MS);
    return [...stale, ...fresh];
  }

  // No acknowledge on failure: the ids stay in the pending list for another attempt.
  private async ackAfterIngest(batch: StreamMessage[]): Promise<void> {
    const backlog = await this.stream.backlog();

    this.metrics.backlog.set(backlog);

    this.logger.info({ backlog, count: batch.length }, "ingest batch");

    // Processa o batch
    const accepted = await this.ingest.execute(batch.map((item) => item.payload));

    if (accepted) {
      this.metrics.batches.inc();
      this.metrics.packets.inc(batch.length);
      await this.stream.acknowledge(batch.map((item) => item.id));
      return;
    }

    this.metrics.failures.inc();
    await this.deadLetterAfterRepeatedFailures(batch);
  }

  // Past the failure cap the payload is copied aside and acknowledged, so the
  // group stops redelivering it.
  private async deadLetterAfterRepeatedFailures(batch: StreamMessage[]): Promise<void> {
    for (const item of batch) {
      const fails = await this.stream.recordFailure(item.id);

      if (shouldDeadLetter(fails)) {
        await this.stream.moveToDeadLetter(item.id, item.payload);
      }
    }
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
