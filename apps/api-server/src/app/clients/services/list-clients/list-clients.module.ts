import { Module } from "@nestjs/common";
import { ListClientsService } from "./list-clients.service";

@Module({
  providers: [ListClientsService],
  exports: [ListClientsService],
})
export class ListClientsModule {}
