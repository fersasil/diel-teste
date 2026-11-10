import { Module } from "@nestjs/common";
import { PacketModule } from "../../app/packet/packet.module";
import { MetricsModule } from "./metrics.module";
import { MetricsServer } from "./metrics.server";
import { ProbeHooks } from "./probe";

@Module({
  imports: [MetricsModule, PacketModule],
  providers: [ProbeHooks, MetricsServer],
})
export class HttpModule {}
