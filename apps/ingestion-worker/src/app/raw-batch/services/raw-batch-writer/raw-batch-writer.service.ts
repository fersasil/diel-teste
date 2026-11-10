import { createHash } from "node:crypto";
import { promisify } from "node:util";
import { gzip } from "node:zlib";

const gzipAsync = promisify(gzip);

export function rawPartKey(recordedAt: Date, clientId: string, partId: string): string {
  const iso = recordedAt.toISOString();
  const client = clientId.replace(/[^A-Za-z0-9_-]/g, "") || "unknown";
  return `dt=${iso.slice(0, 10)}/hour=${iso.slice(11, 13)}/client=${client}/${partId}.jsonl.gz`;
}

export function partitionedKey(packets: string[], recordedAt: Date): string {
  const iso = recordedAt.toISOString();
  return `dt=${iso.slice(0, 10)}/hour=${iso.slice(11, 13)}/${batchObjectKey(packets)}.jsonl.gz`;
}

export function batchObjectKey(packets: string[]): string {
  return createHash("sha256").update(packets.join("\n")).digest("hex");
}

export async function gzipBatch(packets: string[]): Promise<Buffer> {
  return gzipAsync(Buffer.from(packets.join("\n")));
}

export async function writeRawBatch(
  packets: string[],
  put: (key: string, body: Buffer) => Promise<void>,
): Promise<string> {
  const key = batchObjectKey(packets);

  await put(key, await gzipBatch(packets));
  return key;
}
