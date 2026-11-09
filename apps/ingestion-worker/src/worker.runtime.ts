import { Injectable, OnApplicationShutdown, OnModuleInit } from "@nestjs/common";
import pino from "pino";
import { PgPool } from "./infra/database/pg-pool";
import { MetricsServer } from "./infra/http/metrics.server";
import { MqttIngestion } from "./infra/mqtt/mqtt.ingestion";
import { RedisStore } from "./infra/redis/redis";
import { CityWeatherSync } from "./app/weather/services/run-city-weather/city-weather.sync";
import { StreamConsumer } from "./app/stream/services/consume/stream.consumer";

@Injectable()
export class WorkerRuntime implements OnModuleInit, OnApplicationShutdown {
  private readonly log = pino();

  constructor(
    private readonly metrics: MetricsServer,
    private readonly weather: CityWeatherSync,
    private readonly mqtt: MqttIngestion,
    private readonly stream: StreamConsumer,
    private readonly redis: RedisStore,
    private readonly database: PgPool,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.metrics.listen();
    try {
      this.weather.start();
      await this.mqtt.start();
      this.stream.start();
    } catch (error) {
      this.log.error({ err: error }, "ingestion stopped");
    }
  }

  async onApplicationShutdown(): Promise<void> {
    this.weather.stop();
    await this.mqtt.stop();
    await this.stream.stop();
    await this.redis.close();
    await this.database.close();
    await this.metrics.close();
  }
}
