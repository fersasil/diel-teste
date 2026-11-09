import { Module } from "@nestjs/common";
import { ReadSessionService } from "./read-session.service";

@Module({
  providers: [ReadSessionService],
  exports: [ReadSessionService],
})
export class ReadSessionModule {}
