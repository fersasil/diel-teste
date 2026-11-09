import pino from "pino";
import { fetchCityWeather } from "../../../../infra/open-meteo/open-meteo";
import { listWeatherStores, sampleSpan, saveCityHours } from "../../repositories/weather.repository";
import { syncCityWeather } from "../sync-city-weather/sync-city-weather.service";

const log = pino();

export function startCityWeatherSync(): { stop: () => void } {
  let stopped = false;
  const run = () => {
    if (stopped) {
      return;
    }
    void syncCityWeather({
      stores: listWeatherStores,
      span: sampleSpan,
      fetchCity: (store, from, to) => fetchCityWeather({
        latitude: store.latitude,
        longitude: store.longitude,
        from,
        to,
      }),
      save: saveCityHours,
    }).then((result) => {
      log.info(result, "city weather synced");
    }).catch((error: unknown) => {
      log.error({ err: error }, "city weather sync failed");
    });
  };
  run();
  const timer = setInterval(run, 15 * 60 * 1000);
  return {
    stop: () => {
      stopped = true;
      clearInterval(timer);
    },
  };
}
