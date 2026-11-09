import { Module } from "@nestjs/common";
import { EnvironmentController } from "./environment.controller";
import { GetTimeseriesModule } from "./services/get-timeseries/get-timeseries.module";
import { ListEnvironmentOptionsModule } from "./services/list-environment-options/list-environment-options.module";
import { ListEnvironmentsModule } from "./services/list-environments/list-environments.module";

@Module({
  imports: [ListEnvironmentsModule, GetTimeseriesModule, ListEnvironmentOptionsModule],
  controllers: [EnvironmentController],
})
export class EnvironmentModule {}
