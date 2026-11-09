import { Module } from "@nestjs/common";
import { ListEnvironmentsService } from "./list-environments.service";

@Module({
  providers: [ListEnvironmentsService],
  exports: [ListEnvironmentsService],
})
export class ListEnvironmentsModule {}
