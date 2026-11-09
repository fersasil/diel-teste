import { collectDefaultMetrics, Counter, Gauge, Registry } from "prom-client";

export const registry = new Registry();
collectDefaultMetrics({ register: registry });

export const ingestBatches = new Counter({
  name: "diel_ingest_batches_total",
  help: "Lotes confirmados na ingestão",
  registers: [registry],
});

export const ingestPackets = new Counter({
  name: "diel_ingest_packets_total",
  help: "Pacotes confirmados na ingestão",
  registers: [registry],
});

export const ingestFailures = new Counter({
  name: "diel_ingest_failures_total",
  help: "Lotes rejeitados na ingestão",
  registers: [registry],
});

export const streamBacklogGauge = new Gauge({
  name: "diel_stream_backlog",
  help: "Mensagens aguardando na stream",
  registers: [registry],
});
