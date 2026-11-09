import { Injectable } from "@nestjs/common";
import { randomBytes } from "node:crypto";
import { Client } from "minio";
import { gzipBatch, rawPartKey } from "../../app/raw-batch/services/raw-batch-writer/raw-batch-writer.service";

@Injectable()
export class ObjectStore {
  private failing = false;
  private ready = false;
  private client: Client | undefined;

  setFailure(enabled: boolean): void {
    this.failing = enabled;
  }

  private store(): Client {
    if (!this.client) {
      const url = new URL(process.env.MINIO_ENDPOINT ?? "http://minio:9000");
      this.client = new Client({
        endPoint: url.hostname,
        port: Number(url.port || 9000),
        useSSL: url.protocol === "https:",
        accessKey: process.env.MINIO_ROOT_USER ?? "change-me",
        secretKey: process.env.MINIO_ROOT_PASSWORD ?? "change-me",
      });
    }
    return this.client;
  }

  async ensureBucket(): Promise<void> {
    if (this.ready) {
      return;
    }
    const bucket = process.env.MINIO_BUCKET ?? "diel-raw-telemetry";
    const exists = await this.store().bucketExists(bucket);
    if (!exists) {
      await this.store().makeBucket(bucket);
    }
    this.ready = true;
  }

  async putRawPart(lines: string[], recordedAt: Date, clientId: string): Promise<string> {
    if (this.failing) {
      throw new Error("object store unavailable");
    }
    if (lines.length === 0) {
      throw new Error("empty raw part");
    }
    await this.ensureBucket();
    const key = rawPartKey(recordedAt, clientId, randomBytes(8).toString("hex"));
    const body = await gzipBatch(lines);
    await this.store().putObject(process.env.MINIO_BUCKET ?? "diel-raw-telemetry", key, body);
    return key;
  }
}

let objects: ObjectStore | undefined;

export function setObjectStoreFailure(enabled: boolean): void {
  objects ??= new ObjectStore();
  objects.setFailure(enabled);
}

export async function ensureBucket(): Promise<void> {
  objects ??= new ObjectStore();
  await objects.ensureBucket();
}

export async function putRawPart(lines: string[], recordedAt: Date, clientId: string): Promise<string> {
  objects ??= new ObjectStore();
  return objects.putRawPart(lines, recordedAt, clientId);
}

export function useObjectStore(store: ObjectStore): void {
  objects = store;
}
