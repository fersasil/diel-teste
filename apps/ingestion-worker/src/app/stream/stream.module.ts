import { Module } from "@nestjs/common";
import { MetricsModule } from "../../infra/http/metrics.module";
import { PacketModule } from "../packet/packet.module";
import { TelemetryStreamRepository } from "./repositories/telemetry-stream.repository";
import { ConsumeService } from "./services/consume/consume.service";

@Module({
  imports: [PacketModule, MetricsModule],
  providers: [TelemetryStreamRepository, ConsumeService],
  exports: [TelemetryStreamRepository],
})
export class StreamModule {}
