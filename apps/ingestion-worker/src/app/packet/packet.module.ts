import { Module } from "@nestjs/common";
import { ClockModule } from "../clock/clock.module";
import { DeviceRepository } from "./repositories/device.repository";
import { PacketRepository } from "./repositories/packet.repository";
import { IngestBatchService } from "./services/ingest-batch/ingest-batch.service";

@Module({
  imports: [ClockModule],
  providers: [DeviceRepository, PacketRepository, IngestBatchService],
  exports: [IngestBatchService],
})
export class PacketModule {}
