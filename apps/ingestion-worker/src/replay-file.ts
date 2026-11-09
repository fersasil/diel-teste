import { createReadStream } from "node:fs";
import { createInterface } from "node:readline";
import { ingestLines } from "./app/packet/services/ingest-batch/ingest-batch.service";

const CHUNK = 2000;

async function main(): Promise<void> {
  const file = process.env.TELEMETRY_FILE;
  if (!file) {
    throw new Error("TELEMETRY_FILE is required");
  }
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
    if (chunk.length >= CHUNK) {
      acked += await flush(chunk);
      chunk = [];
      process.stdout.write(`replayed ${acked}/${seen}\n`);
    }
  }
  acked += await flush(chunk);
  process.stdout.write(`replayed ${acked}/${seen}\n`);
}

async function flush(chunk: string[]): Promise<number> {
  if (chunk.length === 0) {
    return 0;
  }
  return await ingestLines(chunk) ? chunk.length : 0;
}

void main();
