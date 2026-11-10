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
