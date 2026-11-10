import { Module } from "@nestjs/common";
import { IngestMetrics } from "./ingest-metrics";

@Module({
  providers: [IngestMetrics],
  exports: [IngestMetrics],
})
export class MetricsModule {}
