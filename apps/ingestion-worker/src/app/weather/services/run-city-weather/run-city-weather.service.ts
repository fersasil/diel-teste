import { Injectable } from "@nestjs/common";
import { PinoLogger } from "nestjs-pino";
import { OpenMeteoClient } from "../../../../infra/open-meteo/open-meteo.client";
import { WeatherRepository } from "../../repositories/weather.repository";
import { syncCityWeather } from "../sync-city-weather/sync-city-weather.service";

const EVERY_MS = 15 * 60 * 1000;

@Injectable()
export class RunCityWeatherService {
  private timer: ReturnType<typeof setInterval> | undefined;
  private stopped = false;

  public constructor(
    private readonly weather: WeatherRepository,
    private readonly meteo: OpenMeteoClient,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(RunCityWeatherService.name);
  }

  public execute(): { stop: () => void } {
    this.stopped = false;
    void this.syncAllCities();
    this.timer = setInterval(() => void this.syncAllCities(), EVERY_MS);
    return { stop: () => this.clearSyncTimer() };
  }

  private clearSyncTimer(): void {
    this.stopped = true;

    if (!this.timer) {
      return;
    }

    clearInterval(this.timer);
    this.timer = undefined;
  }

  private async syncAllCities(): Promise<void> {
    if (this.stopped) {
      return;
    }

    try {
      const result = await syncCityWeather({
        stores: () => this.weather.listStores(),
        span: () => this.weather.sampleSpan(),
        fetchCity: (store, from, to) => this.meteo.fetchCity({
          latitude: store.latitude,
          longitude: store.longitude,
          from,
          to,
        }),
        save: (storeId, city, readings) => this.weather.saveHours(storeId, city, readings),
      });

      this.logger.info(result, "city weather synced");
    } catch (error) {
      this.logger.error({ err: error }, "city weather sync failed");
    }
  }
}
