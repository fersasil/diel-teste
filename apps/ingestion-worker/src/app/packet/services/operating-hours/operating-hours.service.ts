import type { WeekHours } from "./operating-hours.interface";

export type { WeekHours } from "./operating-hours.interface";

const WEEKDAYS: Record<string, string> = {
  Mon: "mon",
  Tue: "tue",
  Wed: "wed",
  Thu: "thu",
  Fri: "fri",
  Sat: "sat",
  Sun: "sun",
};

function minutes(value: string): number {
  const [hour, minute] = value.split(":").map(Number);
  return hour * 60 + minute;
}

export function isOperatingAt(instant: Date, timeZone: string, hours: WeekHours): boolean {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(instant);
  const read = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "";
  const day = WEEKDAYS[read("weekday")];
  const now = Number(read("hour")) * 60 + Number(read("minute"));
  return (hours[day] ?? []).some(([start, end]) => {
    const from = minutes(start);
    const to = minutes(end);

    if (to <= from) {
      return now >= from || now < to;
    }

    return now >= from && now < to;
  });
}
