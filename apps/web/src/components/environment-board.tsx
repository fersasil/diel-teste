"use client";

import { useEffect, useRef, useState } from "react";
import { browserApiBase } from "../shared/api-base";
import { detailHref } from "../network/detail-href";
import { kindFromStatus, type LoadKind } from "../shared/load-state";
import { messages } from "../shared/messages/pt-BR";
import type { NetworkPeriod } from "../network/network-query";
import { ChartDate } from "./chart-date";
import { useLivePatches } from "./live-refresh";
import { EnvironmentFacts } from "./environment-facts";
import { PeriodNav } from "./period-nav";
import { TemperatureChart } from "./temperature-chart";

interface ChartPoint {
  at: string;
  avgTemp: number | null;
  minTemp: number | null;
  maxTemp: number | null;
  isOperatingHours: boolean | null;
}

interface SeriesBody {
  comfortMin: number;
  comfortMax: number;
  points: Array<{
    bucketStart: string;
    avgTemp: number | null;
    minTemp: number | null;
    maxTemp: number | null;
    isOperatingHours: boolean | null;
  }>;
  external?: Array<{ avgTemp: number | null }>;
}

interface SummaryBody {
  comfortPercent?: number | null;
}

const buckets = [
  ["30m", "30 minutos"],
  ["1h", "1 hora"],
  ["1d", "1 dia"],
  ["1w", "1 semana"],
  ["1mo", "1 mês"],
] as const;

export function EnvironmentBoard({
  id,
  token,
  period,
  bucket,
  from,
  to,
  ranged,
  max,
  timezone,
  comfortMin,
  comfortMax,
  comfortPercent,
  lastTemp,
  latestAt,
  deviceStatus,
  points,
  external,
  failed,
}: {
  id: string;
  token: string;
  period: NetworkPeriod;
  bucket: string;
  from: string;
  to: string;
  ranged: boolean;
  max: string;
  timezone: string;
  comfortMin: number;
  comfortMax: number;
  comfortPercent: number | null;
  lastTemp: number | null;
  latestAt: string | null;
  deviceStatus: "ONLINE" | "OFFLINE" | "NO_DATA";
  points: ChartPoint[];
  external: Array<{ avgTemp: number | null }>;
  failed: boolean;
}) {
  const [fromDay, setFromDay] = useState(from);
  const [toDay, setToDay] = useState(to);
  const [custom, setCustom] = useState(ranged);
  const [percent, setPercent] = useState(comfortPercent);
  const [band, setBand] = useState({ min: comfortMin, max: comfortMax });
  const [seriesPoints, setSeriesPoints] = useState(points);
  const [seriesExternal, setSeriesExternal] = useState(external);
  const [seriesFailed, setSeriesFailed] = useState(failed);
  const [reading, setReading] = useState({ temp: lastTemp, at: latestAt, status: deviceStatus });
  const [loading, setLoading] = useState(false);
  const patches = useLivePatches(token);
  useEffect(() => {
    const patch = patches.get(id);
    if (!patch) {
      return;
    }
    setReading((current) => {
      if (current.at && patch.latestAt < current.at) {
        return current;
      }
      if (current.at === patch.latestAt && current.status === patch.deviceStatus && current.temp === patch.lastTemp) {
        return current;
      }
      return { temp: patch.lastTemp, at: patch.latestAt, status: patch.deviceStatus };
    });
  }, [patches, id]);
  const ticket = useRef(0);

  async function selectRange(start: string, end: string, force = false) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(start) || !/^\d{4}-\d{2}-\d{2}$/.test(end)) {
      return;
    }
    const [nextFrom, nextTo] = start <= end ? [start, end] : [end, start];
    setFromDay(nextFrom);
    setToDay(nextTo);
    if (!force && custom && nextFrom === fromDay && nextTo === toDay && !seriesFailed) {
      return;
    }
    const current = ticket.current + 1;
    ticket.current = current;
    setCustom(true);
    setLoading(true);
    const query = new URLSearchParams({ from: nextFrom, to: nextTo });
    const [summary, series] = await Promise.all([
      readJson<SummaryBody>(`/api/v1/environments/${id}/summary?${query}`),
      readJson<SeriesBody>(`/api/v1/environments/${id}/timeseries?bucket=${bucket}&${query}`),
    ]);
    if (current !== ticket.current) {
      return;
    }
    setLoading(false);
    if (summary.kind === "session" || series.kind === "session") {
      window.location.assign("/entrar?aviso=sessao");
      return;
    }
    if (summary.kind === "ok" && summary.body) {
      setPercent(summary.body.comfortPercent ?? null);
    }
    if (series.kind === "ok" && series.body) {
      setBand({ min: series.body.comfortMin, max: series.body.comfortMax });
      setSeriesExternal(series.body.external ?? []);
      setSeriesPoints(series.body.points.map((point) => ({
        at: point.bucketStart,
        avgTemp: point.avgTemp,
        minTemp: point.minTemp,
        maxTemp: point.maxTemp,
        isOperatingHours: point.isOperatingHours,
      })));
      setSeriesFailed(false);
    } else {
      setSeriesFailed(true);
    }
    const address = new URLSearchParams(window.location.search);
    address.set("bucket", bucket);
    address.delete("period");
    address.delete("date");
    address.set("from", nextFrom);
    address.set("to", nextTo);
    window.history.replaceState(null, "", `/ambientes/${id}?${address}`);
  }

  return (
    <>
      <EnvironmentFacts
        comfortPercent={percent}
        comfortMin={comfortMin}
        comfortMax={comfortMax}
        lastTemp={reading.temp}
        latestAt={reading.at}
        timezone={timezone}
        deviceStatus={reading.status}
      />
      <section aria-busy={loading} className="rounded-xl bg-card p-4 ring-1 ring-foreground/10">
        <div className="mb-4 flex flex-wrap items-end gap-x-6 gap-y-3">
          <div>
            <p className="mb-1 text-xs font-medium text-muted-foreground">{messages.periodLabel}</p>
            <PeriodNav current={custom ? null : period} hrefFor={(next) => detailHref(id, next, bucket)} />
          </div>
          <ChartDate from={fromDay} to={toDay} max={max} onChange={(start, end) => void selectRange(start, end)} />
          <div>
            <p className="mb-1 text-xs font-medium text-muted-foreground">{messages.bucket}</p>
            <nav className="buckets flex flex-wrap gap-2">
              {buckets.map(([value, label]) => (
                <a
                  key={value}
                  href={detailHref(id, period, value, custom ? { from: fromDay, to: toDay } : undefined)}
                  aria-current={bucket === value ? "page" : undefined}
                  className={bucket === value
                    ? "inline-flex h-8 items-center rounded-lg bg-primary px-3 text-sm text-primary-foreground"
                    : "inline-flex h-8 items-center rounded-lg bg-background px-3 text-sm ring-1 ring-foreground/10"}
                >
                  {label}
                </a>
              ))}
            </nav>
          </div>
        </div>
        {seriesFailed ? (
          <p>
            <button type="button" className="text-sm text-primary" onClick={() => void selectRange(fromDay, toDay, true)}>
              {messages.loadFailed}
            </button>
          </p>
        ) : (
          <div className={loading ? "opacity-60" : undefined}>
            <TemperatureChart
              comfortMin={band.min}
              comfortMax={band.max}
              timezone={timezone}
              showTime={bucket === "30m" || bucket === "1h"}
              external={seriesExternal}
              points={seriesPoints}
            />
          </div>
        )}
      </section>
    </>
  );
}

async function readJson<T>(path: string): Promise<{ kind: LoadKind; body: T | null }> {
  const token = document.cookie.split("; ").find((item) => item.startsWith("accessToken="))?.slice("accessToken=".length) ?? "";
  try {
    const response = await fetch(`${browserApiBase()}${path}`, {
      headers: { authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    const body = (await response.json().catch(() => null)) as (T & { code?: string }) | null;
    const kind = kindFromStatus(response.status, body?.code);
    return { kind, body: kind === "ok" ? body : null };
  } catch {
    return { kind: "failure", body: null };
  }
}
