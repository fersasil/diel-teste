import { Module } from "@nestjs/common";
import { ListStoresService } from "./list-stores.service";

@Module({
  providers: [ListStoresService],
  exports: [ListStoresService],
})
export class ListStoresModule {}
