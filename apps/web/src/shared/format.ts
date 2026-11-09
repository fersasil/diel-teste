export function formatPercent(value: number | null): string {
  if (value === null || Number.isNaN(value)) {
    return "—";
  }
  return `${Math.round(value * 100)}%`;
}

export function formatTemperature(value: number | null): string | null {
  if (value === null || Number.isNaN(value)) {
    return null;
  }
  return `${value.toFixed(1)} °C`;
}

const instantParts = {
  timeZone: "",
  day: "2-digit",
  month: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
} as const;

export function localDay(isoUtc: string, timeZone: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(isoUtc));
}

export function formatInstant(isoUtc: string, timeZone: string): string {
  return new Intl.DateTimeFormat("pt-BR", { ...instantParts, timeZone }).format(new Date(isoUtc));
}

export function formatReadingAt(isoUtc: string, timeZone: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(isoUtc));
}

export function formatChartTick(isoUtc: string, timeZone: string): { day: string; time: string } {
  const parts = new Intl.DateTimeFormat("pt-BR", { ...instantParts, timeZone }).formatToParts(new Date(isoUtc));
  const read = (type: string) => parts.find((part) => part.type === type)?.value ?? "";
  return { day: `${read("day")}/${read("month")}`, time: `${read("hour")}:${read("minute")}` };
}
