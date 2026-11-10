import "reflect-metadata";
import { createReadStream } from "node:fs";
import { createInterface } from "node:readline";
import { Module } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { Logger } from "nestjs-pino";
import { IngestBatchService } from "./app/packet/services/ingest-batch/ingest-batch.service";
import { PacketModule } from "./app/packet/packet.module";
import { DatabaseModule } from "./infra/database/database.module";
import { LoggingModule } from "./infra/logging/logging.module";
import { ObjectStoreModule } from "./infra/object-store/object-store.module";
import { RedisModule } from "./infra/redis/redis.module";

const CHUNK = 2000;

@Module({
  imports: [LoggingModule, DatabaseModule, RedisModule, ObjectStoreModule, PacketModule],
})
class ReplayModule {}

async function main(): Promise<void> {
  const file = process.env.TELEMETRY_FILE;

  if (!file) {
    throw new Error("TELEMETRY_FILE is required");
  }

  const app = await NestFactory.createApplicationContext(ReplayModule, { bufferLogs: true });
  app.useLogger(app.get(Logger));
  try {
    await replay(app.get(IngestBatchService), file);
  } finally {
    await app.close();
  }
}

async function replay(ingest: IngestBatchService, file: string): Promise<void> {
  const lines = createInterface({ input: createReadStream(file), crlfDelay: Infinity });
  let seen = 0;
  let acked = 0;
  let chunk: string[] = [];
  for await (const line of lines) {
    const trimmed = line.trim();

    if (!trimmed) {
      continue;
    }

    seen += 1;
    chunk.push(trimmed);

    if (chunk.length < CHUNK) {
      continue;
    }

    acked += await flush(ingest, chunk);
    chunk = [];

    process.stdout.write(`replayed ${acked}/${seen}\n`);
  }

  acked += await flush(ingest, chunk);

  process.stdout.write(`replayed ${acked}/${seen}\n`);
}

async function flush(ingest: IngestBatchService, chunk: string[]): Promise<number> {
  if (chunk.length === 0) {
    return 0;
  }

  return await ingest.execute(chunk) ? chunk.length : 0;
}

void main().catch((error: unknown) => {
  console.error(error);

  process.exit(1);
});
