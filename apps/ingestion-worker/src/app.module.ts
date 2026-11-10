import { Module } from "@nestjs/common";
import { ClockModule } from "./app/clock/clock.module";
import { PacketModule } from "./app/packet/packet.module";
import { StreamModule } from "./app/stream/stream.module";
import { WeatherModule } from "./app/weather/weather.module";
import { DatabaseModule } from "./infra/database/database.module";
import { HttpModule } from "./infra/http/http.module";
import { LoggingModule } from "./infra/logging/logging.module";
import { MqttModule } from "./infra/mqtt/mqtt.module";
import { ObjectStoreModule } from "./infra/object-store/object-store.module";
import { RedisModule } from "./infra/redis/redis.module";
import { WorkerRuntime } from "./worker.runtime";

@Module({
  imports: [
    LoggingModule,
    DatabaseModule,
    RedisModule,
    ObjectStoreModule,
    ClockModule,
    PacketModule,
    HttpModule,
    StreamModule,
    MqttModule,
    WeatherModule,
  ],
  providers: [WorkerRuntime],
})
export class AppModule {}
