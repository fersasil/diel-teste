import { Injectable } from "@nestjs/common";
import { startCityWeatherSync } from "./run-city-weather.service";

@Injectable()
export class CityWeatherSync {
  private stopTask: (() => void) | undefined;

  start(): void {
    this.stopTask = startCityWeatherSync().stop;
  }

  stop(): void {
    this.stopTask?.();
  }
}
