import { Module } from "@nestjs/common";
import { ListEnvironmentOptionsService } from "./list-environment-options.service";

@Module({
  providers: [ListEnvironmentOptionsService],
  exports: [ListEnvironmentOptionsService],
})
export class ListEnvironmentOptionsModule {}
