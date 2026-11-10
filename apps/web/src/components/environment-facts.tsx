"use client";

import { useState } from "react";
import { marks } from "../brand/tokens";
import { DeviceStatus } from "./device-status";
import { formatOperatingHours, formatPercent, formatReadingAt, formatTemperature, type WeekHours } from "../shared/format";
import { messages } from "../shared/messages/pt-BR";

export function EnvironmentFacts({
  comfortPercent,
  comfortMin,
  comfortMax,
  operatingHours,
  lastTemp,
  latestAt,
  timezone,
  deviceStatus,
}: {
  comfortPercent: number | null;
  comfortMin: number;
  comfortMax: number;
  operatingHours: WeekHours;
  lastTemp: number | null;
  latestAt: string | null;
  timezone: string;
  deviceStatus: "ONLINE" | "OFFLINE" | "NO_DATA";
}) {
  const width = comfortPercent === null ? 0 : Math.max(0, Math.min(100, Math.round(comfortPercent * 100)));
  const schedule = formatOperatingHours(operatingHours);
  const [helpOpen, setHelpOpen] = useState(false);
  return (
    <section className="grid gap-3 sm:grid-cols-3">
      <article className="rounded-xl bg-card px-4 py-3 ring-1 ring-foreground/10">
        <div className="flex items-center gap-1.5">
          <p className="text-xs font-medium text-muted-foreground">{messages.comfortPeriod}</p>
          <button
            type="button"
            aria-expanded={helpOpen}
            aria-label={messages.comfortPeriodAbout}
            onClick={() => setHelpOpen((open) => !open)}
            className="inline-flex size-4 items-center justify-center rounded-full text-[11px] font-semibold leading-none text-muted-foreground ring-1 ring-foreground/20"
          >
            ?
          </button>
        </div>
        {helpOpen ? (
          <p className="mt-2 text-xs leading-5 text-muted-foreground">{messages.comfortPeriodHelp}</p>
        ) : null}
        <p className="mt-1 text-2xl font-semibold tabular-nums tracking-tight">{formatPercent(comfortPercent)}</p>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted" aria-hidden="true">
          <div className="h-full rounded-full" style={{ width: `${width}%`, backgroundColor: marks.inRange }} />
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          {messages.comfortBand} {formatTemperature(comfortMin)}–{formatTemperature(comfortMax)}
        </p>
        {schedule ? (
          <p className="mt-1 text-xs text-muted-foreground">{messages.operatingHours} {schedule}</p>
        ) : null}
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
