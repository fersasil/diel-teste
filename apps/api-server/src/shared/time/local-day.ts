const DAY = /^\d{4}-\d{2}-\d{2}$/;

export function parseDay(value?: string): string | null {
  return value && DAY.test(value) ? value : null;
}

export function localDay(instant: Date, timeZone: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(instant);
}

export function startOfLocalDay(day: string, timeZone: string): Date {
  const [year, month, date] = day.split("-").map(Number);
  return zonedInstant(year, month, date, timeZone);
}

export function daySpan(fromDay: string, toDay: string, timeZone: string): { from: Date; to: Date } | null {
  const from = startOfLocalDay(fromDay, timeZone);
  const to = endOfLocalDay(toDay, timeZone);
  if (to < from) {
    return null;
  }
  return { from, to };
}

export function endOfLocalDay(day: string, timeZone: string): Date {
  const [year, month, date] = day.split("-").map(Number);
  const nextMidnight = zonedInstant(year, month, date + 1, timeZone);
  return new Date(nextMidnight.getTime() - 1);
}

export function rangeEnd(input: {
  day: string | null;
  timeZone: string;
  virtualNow: Date;
}): Date {
  if (input.day) {
    return endOfLocalDay(input.day, input.timeZone);
  }
  return input.virtualNow;
}

function zonedInstant(year: number, month: number, date: number, timeZone: string): Date {
  const guess = new Date(Date.UTC(year, month - 1, date));
  const offset = zoneOffsetMs(guess, timeZone);
  const instant = new Date(guess.getTime() - offset);
  const corrected = zoneOffsetMs(instant, timeZone);
  return corrected === offset ? instant : new Date(guess.getTime() - corrected);
}

function zoneOffsetMs(instant: Date, timeZone: string): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(instant);
  const read = (type: string) => Number(parts.find((part) => part.type === type)?.value);
  const wall = Date.UTC(read("year"), read("month") - 1, read("day"), read("hour"), read("minute"), read("second"));
  return wall - instant.getTime();
}
