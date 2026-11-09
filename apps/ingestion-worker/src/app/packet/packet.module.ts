import { Module } from "@nestjs/common";
import { DatabaseModule } from "../../infra/database/database.module";
import { ObjectStoreModule } from "../../infra/object-store/object-store.module";
import { RedisModule } from "../../infra/redis/redis.module";

@Module({
  imports: [DatabaseModule, RedisModule, ObjectStoreModule],
})
export class PacketModule {}
