import { Module } from "@nestjs/common";
import { GetTimeseriesService } from "./get-timeseries.service";

@Module({
  providers: [GetTimeseriesService],
  exports: [GetTimeseriesService],
})
export class GetTimeseriesModule {}
