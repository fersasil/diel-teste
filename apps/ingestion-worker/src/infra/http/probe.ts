import type { IncomingMessage, ServerResponse } from "node:http";
import { setObjectStoreFailure } from "../object-store/object-store";
import { persistLine } from "../../app/packet/services/ingest-batch/ingest-batch.service";

export async function handleProbe(request: IncomingMessage, response: ServerResponse): Promise<boolean> {
  if (process.env.WORKER_TEST_HOOKS !== "1") {
    return false;
  }
  if (request.url === "/test/object-store" && request.method === "POST") {
    const body = await readJson(request);
    setObjectStoreFailure(body.fail === true);
    response.end("ok");
    return true;
  }
  if (request.url === "/test/consume" && request.method === "POST") {
    const body = await readJson(request);
    const acked = await persistLine(body.line ?? "");
    response.setHeader("content-type", "application/json");
    response.end(JSON.stringify({ acked }));
    return true;
  }
  return false;
}

function readJson(request: IncomingMessage): Promise<{ fail?: boolean; line?: string }> {
  return new Promise((resolve) => {
    const chunks: Buffer[] = [];
    request.on("data", (chunk: Buffer) => chunks.push(chunk));
    request.on("end", () => {
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString()) as { fail?: boolean; line?: string });
      } catch {
        resolve({});
      }
    });
  });
}
