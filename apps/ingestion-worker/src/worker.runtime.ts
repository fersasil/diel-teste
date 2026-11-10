import { Injectable, type OnApplicationShutdown, type OnModuleInit } from "@nestjs/common";
import { PinoLogger } from "nestjs-pino";
import { RunCityWeatherService } from "./app/weather/services/run-city-weather/run-city-weather.service";
import { MqttIngestion } from "./infra/mqtt/mqtt.ingestion";

@Injectable()
export class WorkerRuntime implements OnModuleInit, OnApplicationShutdown {
  private stopWeather: (() => void) | undefined;

  public constructor(
    private readonly weather: RunCityWeatherService,
    private readonly mqtt: MqttIngestion,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(WorkerRuntime.name);
  }

  public async onModuleInit(): Promise<void> {
    try {
      this.stopWeather = this.weather.execute().stop;
      await this.mqtt.start();
    } catch (error) {
      this.logger.error({ err: error }, "ingestion stopped");
    }
  }

  public async onApplicationShutdown(): Promise<void> {
    this.stopWeather?.();
    await this.mqtt.stop();
  }
}
