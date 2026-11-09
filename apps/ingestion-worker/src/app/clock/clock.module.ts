import { Module } from "@nestjs/common";
import { RedisModule } from "../../infra/redis/redis.module";

@Module({
  imports: [RedisModule],
})
export class ClockModule {}
