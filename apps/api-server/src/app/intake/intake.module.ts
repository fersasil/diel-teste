import { Module } from "@nestjs/common";
import { IntakeController } from "./intake.controller";
import { GetIntakeModule } from "./services/get-intake/get-intake.module";

@Module({
  imports: [GetIntakeModule],
  controllers: [IntakeController],
})
export class IntakeModule {}
