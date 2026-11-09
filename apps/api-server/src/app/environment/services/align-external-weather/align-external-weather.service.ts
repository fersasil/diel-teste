import type { ExternalPoint } from "./align-external-weather.interface";

const HOUR = 3_600_000;

export function alignExternalWeather(
  points: Array<{ bucketStart: string }>,
  hourly: ExternalPoint[],
  bucket?: string,
): ExternalPoint[] {
  const hours = sortedHours(hourly);
  if (hours.length === 0 || points.length === 0) {
    return [];
  }
  if (bucket === "1d" || bucket === "1w" || bucket === "1mo") {
    return averageWalk(points, hours, bucket);
  }
  return hourWalk(points, hours);
}

function sortedHours(hourly: ExternalPoint[]): Array<[number, number]> {
  const hours: Array<[number, number]> = [];
  for (const row of hourly) {
    const hour = hourStart(row.bucketStart);
    if (hour === null || row.avgTemp === null || Number.isNaN(row.avgTemp)) {
      continue;
    }
    hours.push([hour, row.avgTemp]);
  }
  hours.sort((left, right) => left[0] - right[0]);
  return hours;
}

function hourWalk(points: Array<{ bucketStart: string }>, hours: Array<[number, number]>): ExternalPoint[] {
  let index = 0;
  return points.map((point) => {
    const hour = hourStart(point.bucketStart);
    if (hour === null) {
      return { bucketStart: point.bucketStart, avgTemp: null };
    }
    while (index < hours.length && hours[index][0] < hour) {
      index += 1;
    }
    const temp = index < hours.length && hours[index][0] === hour ? hours[index][1] : null;
    return { bucketStart: point.bucketStart, avgTemp: temp };
  });
}

function averageWalk(
  points: Array<{ bucketStart: string }>,
  hours: Array<[number, number]>,
  bucket: string,
): ExternalPoint[] {
  let index = 0;
  return points.map((point, pointIndex) => {
    const start = Date.parse(point.bucketStart);
    const next = points[pointIndex + 1]?.bucketStart;
    const end = next ? Date.parse(next) : nextBucket(start, bucket);
    if (Number.isNaN(start) || Number.isNaN(end)) {
      return { bucketStart: point.bucketStart, avgTemp: null };
    }
    while (index < hours.length && hours[index][0] < start) {
      index += 1;
    }
    let cursor = index;
    let sum = 0;
    let count = 0;
    while (cursor < hours.length && hours[cursor][0] < end) {
      sum += hours[cursor][1];
      count += 1;
      cursor += 1;
    }
    index = cursor;
    const avg = count === 0 ? null : Math.round((sum / count) * 10) / 10;
    return { bucketStart: point.bucketStart, avgTemp: avg };
  });
}

function nextBucket(start: number, bucket: string): number {
  const date = new Date(start);
  if (bucket === "1mo") {
    date.setUTCMonth(date.getUTCMonth() + 1);
    return date.getTime();
  }
  date.setUTCDate(date.getUTCDate() + (bucket === "1w" ? 7 : 1));
  return date.getTime();
}

function hourStart(iso: string): number | null {
  const time = Date.parse(iso);
  if (Number.isNaN(time)) {
    return null;
  }
  return Math.floor(time / HOUR) * HOUR;
}
