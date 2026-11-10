import { Global, Module } from "@nestjs/common";
import { RedisStore } from "./redis";

@Global()
@Module({
  providers: [RedisStore],
  exports: [RedisStore],
})
export class RedisModule {}
