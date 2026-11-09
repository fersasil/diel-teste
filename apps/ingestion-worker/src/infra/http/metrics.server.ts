import http from "node:http";
import { Injectable } from "@nestjs/common";
import pino from "pino";
import { handleProbe } from "./probe";
import { registry } from "./ingest-metrics";

@Injectable()
export class MetricsServer {
  private server: http.Server | undefined;

  listen(): Promise<void> {
    const log = pino();
    const port = Number(process.env.WORKER_PORT ?? 3002);
    this.server = http.createServer(async (request, response) => {
      if (request.url === "/metrics" && request.method === "GET") {
        response.setHeader("content-type", registry.contentType);
        response.end(await registry.metrics());
        return;
      }
      if (await handleProbe(request, response)) {
        return;
      }
      response.statusCode = 404;
      response.end();
    });
    return new Promise((resolve) => {
      this.server?.listen(port, () => {
        log.info({ port }, "ingestion worker listening");
        resolve();
      });
    });
  }

  close(): Promise<void> {
    return new Promise((resolve) => {
      if (!this.server) {
        resolve();
        return;
      }
      this.server.close(() => resolve());
    });
  }
}
