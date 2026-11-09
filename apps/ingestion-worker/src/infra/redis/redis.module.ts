import { Global, Module } from "@nestjs/common";
import { RedisStore, useRedis } from "./redis";

@Global()
@Module({
  providers: [
    {
      provide: RedisStore,
      useFactory: () => {
        const store = new RedisStore();
        useRedis(store);
        return store;
      },
    },
  ],
  exports: [RedisStore],
})
export class RedisModule {}
