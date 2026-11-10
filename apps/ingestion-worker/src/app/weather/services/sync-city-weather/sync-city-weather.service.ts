import type { CityReading } from "../../../../infra/open-meteo/open-meteo";
import { weatherCovers } from "../../../../infra/open-meteo/open-meteo";
import type { WeatherStore } from "./sync-city-weather.interface";

export type { WeatherStore } from "./sync-city-weather.interface";

export async function syncCityWeather(deps: {
  stores: () => Promise<WeatherStore[]>;
  span: () => Promise<{ from: Date; to: Date } | null>;
  fetchCity: (store: WeatherStore, from: Date, to: Date) => Promise<CityReading[]>;
  save: (storeId: string, city: string, readings: CityReading[]) => Promise<number>;
}): Promise<{ stores: number; hours: number; failed: number }> {
  const span = await deps.span();
  const stores = span ? await deps.stores() : [];

  if (!span || stores.length === 0) {
    return { stores: 0, hours: 0, failed: 0 };
  }

  const cached = new Map<string, CityReading[] | null>();
  let hours = 0;
  let failed = 0;
  for (const store of stores) {

    if (weatherCovers(span, { from: store.coveredFrom, to: store.coveredTo })) {
      continue;
    }

    const key = `${store.latitude.toFixed(4)},${store.longitude.toFixed(4)}`;

    if (!cached.has(key)) {
      try {
        cached.set(key, await deps.fetchCity(store, span.from, span.to));
      } catch {
        cached.set(key, null);
      }
    }

    const readings = cached.get(key);

    if (!readings) {
      failed += 1;
      continue;
    }

    hours += await deps.save(store.id, store.city, readings);
  }

  return { stores: stores.length, hours, failed };
}
