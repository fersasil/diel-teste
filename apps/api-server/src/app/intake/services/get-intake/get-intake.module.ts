import { Module } from "@nestjs/common";
import { GetIntakeService } from "./get-intake.service";

@Module({
  providers: [GetIntakeService],
  exports: [GetIntakeService],
})
export class GetIntakeModule {}
