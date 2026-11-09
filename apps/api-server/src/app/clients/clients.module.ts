import { Module } from "@nestjs/common";
import { ClientsController } from "./clients.controller";
import { ListClientsModule } from "./services/list-clients/list-clients.module";

@Module({
  imports: [ListClientsModule],
  controllers: [ClientsController],
})
export class ClientsModule {}
