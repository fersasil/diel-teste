import { Module } from "@nestjs/common";
import { FocusClientService } from "./focus-client.service";

@Module({
  providers: [FocusClientService],
  exports: [FocusClientService],
})
export class FocusClientModule {}
