export type WeekHours = Partial<Record<"mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun", string[][]>>;

const WEEK = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;
const DAY_NAMES = ["segunda", "terça", "quarta", "quinta", "sexta", "sábado", "domingo"];

function slotsLabel(slots: string[][] | undefined): string {
  return (slots ?? [])
    .filter((slot) => slot.length >= 2 && slot[0] && slot[1])
    .map((slot) => `${slot[0]}–${slot[1]}`)
    .join(" e ");
}

export function formatOperatingHours(hours: WeekHours | null | undefined): string {
  if (!hours) {
    return "";
  }
  const labels = WEEK.map((day) => slotsLabel(hours[day]));
  const groups: Array<{ from: number; to: number; label: string }> = [];
  for (let index = 0; index < labels.length; index += 1) {
    const previous = groups.at(-1);
    if (previous && previous.label === labels[index] && previous.to === index - 1) {
      previous.to = index;
      continue;
    }
    groups.push({ from: index, to: index, label: labels[index] });
  }
  const open = groups.filter((group) => group.label.length > 0);
  if (open.length === 0) {
    return "fechado";
  }
  if (open.length === 1 && open[0].from === 0 && open[0].to === WEEK.length - 1) {
    return `todos os dias, ${open[0].label}`;
  }
  return open.map((group) => {
    const days = group.from === group.to ? DAY_NAMES[group.from] : `${DAY_NAMES[group.from]} a ${DAY_NAMES[group.to]}`;
    return `${days}, ${group.label}`;
  }).join(" · ");
}

export function formatPercent(value: number | null): string {
  if (value === null || Number.isNaN(value)) {
    return "—";
  }
  return `${Math.round(value * 100)}%`;
}

export type DataUnit = "mb" | "gb";

export function formatDataVolume(bytes: number, unit: DataUnit, digits: number): string {
  const scale = unit === "gb" ? 1_000_000_000 : 1_000_000;
  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(bytes / scale);
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
