import { Module } from "@nestjs/common";
import { RedisModule } from "../../infra/redis/redis.module";
import { StreamConsumer } from "./services/consume/stream.consumer";

@Module({
  imports: [RedisModule],
  providers: [StreamConsumer],
  exports: [StreamConsumer],
})
export class StreamModule {}
