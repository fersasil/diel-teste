import { Module } from "@nestjs/common";
import { ListRawBatchesService } from "./list-raw-batches.service";

@Module({
  providers: [ListRawBatchesService],
  exports: [ListRawBatchesService],
})
export class ListRawBatchesModule {}
