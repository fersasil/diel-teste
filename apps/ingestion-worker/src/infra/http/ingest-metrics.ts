import { Injectable } from "@nestjs/common";
import { collectDefaultMetrics, Counter, Gauge, Registry } from "prom-client";

@Injectable()
export class IngestMetrics {
  public readonly registry = new Registry();
  public readonly batches: Counter;
  public readonly packets: Counter;
  public readonly failures: Counter;
  public readonly backlog: Gauge;

  public constructor() {
    collectDefaultMetrics({ register: this.registry });
    this.batches = new Counter({
      name: "diel_ingest_batches_total",
      help: "Lotes confirmados na ingestão",
      registers: [this.registry],
    });
    this.packets = new Counter({
      name: "diel_ingest_packets_total",
      help: "Pacotes confirmados na ingestão",
      registers: [this.registry],
    });
    this.failures = new Counter({
      name: "diel_ingest_failures_total",
      help: "Lotes rejeitados na ingestão",
      registers: [this.registry],
    });
    this.backlog = new Gauge({
      name: "diel_stream_backlog",
      help: "Mensagens aguardando na stream",
      registers: [this.registry],
    });
  }
}
