import { Module } from "@nestjs/common";
import { RawBatchesController } from "./raw-batches.controller";
import { ListRawBatchesModule } from "./services/list-raw-batches/list-raw-batches.module";

@Module({
  imports: [ListRawBatchesModule],
  controllers: [RawBatchesController],
})
export class RawBatchesModule {}
