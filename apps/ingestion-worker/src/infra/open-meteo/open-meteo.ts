import type { CityReading } from "./open-meteo.interface";

export type { CityReading } from "./open-meteo.interface";

interface HourlyBody {
  hourly?: {
    time?: unknown;
    temperature_2m?: unknown;
  };
}

export function readingsFromOpenMeteo(body: unknown): CityReading[] | null {
  if (!body || typeof body !== "object") {
    return null;
  }
  const hourly = (body as HourlyBody).hourly;
  if (!hourly || !Array.isArray(hourly.time) || !Array.isArray(hourly.temperature_2m)) {
    return null;
  }
  const count = Math.min(hourly.time.length, hourly.temperature_2m.length);
  const seen = new Set<number>();
  const readings: CityReading[] = [];
  for (let index = 0; index < count; index += 1) {
    const stamp = hourly.time[index];
    const temperature = hourly.temperature_2m[index];
    if (typeof stamp !== "string" || typeof temperature !== "number" || Number.isNaN(temperature)) {
      continue;
    }
    const readingTime = new Date(stamp.endsWith("Z") ? stamp : `${stamp}Z`);
    const millis = readingTime.getTime();
    if (Number.isNaN(millis) || seen.has(millis)) {
      continue;
    }
    seen.add(millis);
    readings.push({ readingTime, temperature });
  }
  return readings;
}

export function weatherCovers(
  span: { from: Date; to: Date },
  covered: { from: Date | null; to: Date | null } | null,
): boolean {
  if (!covered?.from || !covered?.to) {
    return false;
  }
  return day(covered.from) <= day(span.from) && day(covered.to) >= day(span.to);
}

function day(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export async function fetchCityWeather(input: {
  latitude: number;
  longitude: number;
  from: Date;
  to: Date;
  fetchImpl?: typeof fetch;
}): Promise<CityReading[]> {
  const base = process.env.OPEN_METEO_ARCHIVE_URL ?? "https://archive-api.open-meteo.com/v1/archive";
  const url = new URL(base);
  url.searchParams.set("latitude", String(input.latitude));
  url.searchParams.set("longitude", String(input.longitude));
  url.searchParams.set("start_date", input.from.toISOString().slice(0, 10));
  url.searchParams.set("end_date", input.to.toISOString().slice(0, 10));
  url.searchParams.set("hourly", "temperature_2m");
  url.searchParams.set("timezone", "UTC");
  const response = await (input.fetchImpl ?? fetch)(url, { signal: AbortSignal.timeout(20_000) });
  if (!response.ok) {
    throw new Error(`open-meteo ${response.status}`);
  }
  const readings = readingsFromOpenMeteo(await response.json());
  if (!readings) {
    throw new Error("open-meteo payload");
  }
  return readings;
}
