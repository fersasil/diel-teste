import { Module } from "@nestjs/common";
import { ClockModule } from "./app/clock/clock.module";
import { PacketModule } from "./app/packet/packet.module";
import { RawBatchModule } from "./app/raw-batch/raw-batch.module";
import { StreamModule } from "./app/stream/stream.module";
import { WeatherModule } from "./app/weather/weather.module";
import { DatabaseModule } from "./infra/database/database.module";
import { MetricsServer } from "./infra/http/metrics.server";
import { MqttModule } from "./infra/mqtt/mqtt.module";
import { ObjectStoreModule } from "./infra/object-store/object-store.module";
import { RedisModule } from "./infra/redis/redis.module";
import { WorkerRuntime } from "./worker.runtime";

@Module({
  imports: [
    DatabaseModule,
    RedisModule,
    ObjectStoreModule,
    MqttModule,
    PacketModule,
    ClockModule,
    RawBatchModule,
    StreamModule,
    WeatherModule,
  ],
  providers: [MetricsServer, WorkerRuntime],
})
export class AppModule {}
