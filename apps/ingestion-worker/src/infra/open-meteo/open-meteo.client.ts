import { Injectable } from "@nestjs/common";
import { readingsFromOpenMeteo, type CityReading } from "./open-meteo";

@Injectable()
export class OpenMeteoClient {
  public async fetchCity(input: {
    latitude: number;
    longitude: number;
    from: Date;
    to: Date;
  }): Promise<CityReading[]> {
    const base = process.env.OPEN_METEO_ARCHIVE_URL ?? "https://archive-api.open-meteo.com/v1/archive";
    const url = new URL(base);
    url.searchParams.set("latitude", String(input.latitude));
    url.searchParams.set("longitude", String(input.longitude));
    url.searchParams.set("start_date", input.from.toISOString().slice(0, 10));
    url.searchParams.set("end_date", input.to.toISOString().slice(0, 10));
    url.searchParams.set("hourly", "temperature_2m");
    url.searchParams.set("timezone", "UTC");
    const response = await fetch(url, { signal: AbortSignal.timeout(20_000) });

    if (!response.ok) {
      throw new Error(`open-meteo ${response.status}`);
    }

    const readings = readingsFromOpenMeteo(await response.json());

    if (!readings) {
      throw new Error("open-meteo payload");
    }

    return readings;
  }
}
