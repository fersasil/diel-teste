import { DeviceStatus } from "./device-status";
import { formatPercent, formatReadingAt, formatTemperature } from "../shared/format";
import { messages } from "../shared/messages/pt-BR";

export function EnvironmentFacts({
  comfortPercent,
  comfortMin,
  comfortMax,
  lastTemp,
  latestAt,
  timezone,
  deviceStatus,
}: {
  comfortPercent: number | null;
  comfortMin: number;
  comfortMax: number;
  lastTemp: number | null;
  latestAt: string | null;
  timezone: string;
  deviceStatus: "ONLINE" | "OFFLINE" | "NO_DATA";
}) {
  const width = comfortPercent === null ? 0 : Math.max(0, Math.min(100, Math.round(comfortPercent * 100)));
  return (
    <section className="grid gap-3 sm:grid-cols-3">
      <article className="rounded-xl bg-card px-4 py-3 ring-1 ring-foreground/10">
        <p className="text-xs font-medium text-muted-foreground">{messages.comfortPeriod}</p>
        <p className="mt-1 text-2xl font-semibold tabular-nums tracking-tight">{formatPercent(comfortPercent)}</p>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted" aria-hidden="true">
          <div className="h-full rounded-full bg-[#39B719]" style={{ width: `${width}%` }} />
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          {messages.comfortBand} {formatTemperature(comfortMin)}–{formatTemperature(comfortMax)}
        </p>
      </article>
      <article className="rounded-xl bg-card px-4 py-3 ring-1 ring-foreground/10">
        <p className="text-xs font-medium text-muted-foreground">{messages.lastReading}</p>
        <p className="mt-1 text-2xl font-semibold tabular-nums tracking-tight">{formatTemperature(lastTemp) ?? "—"}</p>
        <p className="mt-2 text-xs text-muted-foreground">
          {latestAt ? formatReadingAt(latestAt, timezone) : "—"}
        </p>
      </article>
      <article className="rounded-xl bg-card px-4 py-3 ring-1 ring-foreground/10">
        <p className="text-xs font-medium text-muted-foreground">{messages.deviceColumn}</p>
        <div className="mt-3">
          <DeviceStatus status={deviceStatus} />
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          {latestAt ? `${messages.lastSeen} ${formatReadingAt(latestAt, timezone)}` : "—"}
        </p>
      </article>
    </section>
  );
}
