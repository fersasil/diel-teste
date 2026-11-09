import "reflect-metadata";
import { RequestMethod } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import {
  FastifyAdapter,
  NestFastifyApplication,
} from "@nestjs/platform-fastify";
import pino from "pino";
import { collectDefaultMetrics, Counter, Registry } from "prom-client";
import { AppModule } from "./app.module";
import { ErrorCodeFilter } from "./infra/http/error-code.filter";
import { attachLiveSockets } from "./infra/live/live-socket";

async function bootstrap(): Promise<void> {
  const log = pino();
  const registry = new Registry();
  collectDefaultMetrics({ register: registry });
  const httpErrors = new Counter({
    name: "diel_http_errors_total",
    help: "Respostas HTTP 5xx da API",
    registers: [registry],
  });
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter(),
    { logger: false },
  );
  app.useGlobalFilters(new ErrorCodeFilter());
  app.enableCors({ origin: true });
  attachLiveSockets(app.getHttpServer());
  app.setGlobalPrefix("api/v1", {
    exclude: [{ path: "metrics", method: RequestMethod.GET }],
  });
  const fastify = app.getHttpAdapter().getInstance();
  fastify.addHook("onResponse", (_request, reply, done) => {
    if (reply.statusCode >= 500) {
      httpErrors.inc();
    }
    done();
  });
  fastify.get("/metrics", async (_request, reply) => {
    reply.header("Content-Type", registry.contentType);
    return registry.metrics();
  });
  const port = Number(process.env.API_PORT ?? 3000);
  await app.listen(port, "0.0.0.0");
  log.info({ port }, "api listening");
}

void bootstrap().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
