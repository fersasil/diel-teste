import http from "node:http";
import { Injectable, type OnApplicationShutdown, type OnModuleInit } from "@nestjs/common";
import { PinoLogger } from "nestjs-pino";
import { IngestMetrics } from "./ingest-metrics";
import { ProbeHooks } from "./probe";

@Injectable()
export class MetricsServer implements OnModuleInit, OnApplicationShutdown {
  private server: http.Server | undefined;

  public constructor(
    private readonly metrics: IngestMetrics,
    private readonly probes: ProbeHooks,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(MetricsServer.name);
  }

  public async onModuleInit(): Promise<void> {
    await this.listen();
  }

  public async onApplicationShutdown(): Promise<void> {
    await this.close();
  }

  private listen(): Promise<void> {
    const port = Number(process.env.WORKER_PORT ?? 3002);
    this.server = http.createServer(async (request, response) => {
      if (request.url === "/metrics" && request.method === "GET") {
        response.setHeader("content-type", this.metrics.registry.contentType);
        response.end(await this.metrics.registry.metrics());
        return;
      }

      if (await this.probes.handle(request, response)) {
        return;
      }

      response.statusCode = 404;
      response.end();
    });

    return new Promise((resolve) => {
      this.server?.listen(port, () => {
        this.logger.info({ port }, "ingestion worker listening");

        resolve();
      });
    });
  }

  private close(): Promise<void> {
    return new Promise((resolve) => {
      if (!this.server) {
        resolve();
        return;
      }

      this.server.close(() => resolve());
    });
  }
}
