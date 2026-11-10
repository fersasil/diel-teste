import { Module } from "@nestjs/common";
import { PublishLiveService } from "./services/publish-live/publish-live.service";
import { VirtualClockService } from "./services/virtual-clock/virtual-clock.service";

@Module({
  providers: [VirtualClockService, PublishLiveService],
  exports: [VirtualClockService, PublishLiveService],
})
export class ClockModule {}
