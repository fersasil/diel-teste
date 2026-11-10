import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { serverApiBase } from "../../../shared/api-base";
import { EnvironmentBoard } from "../../../components/environment-board";
import { detailHref } from "../../../network/detail-href";
import { localDay, type WeekHours } from "../../../shared/format";
import { kindFromStatus, type LoadKind } from "../../../shared/load-state";
import { messages } from "../../../shared/messages/pt-BR";
import { parseNetworkPeriod } from "../../../network/network-query";

interface Point {
  bucketStart: string;
  avgTemp: number | null;
  minTemp: number | null;
  maxTemp: number | null;
  operatingAvgTemp: number | null;
  operatingMinTemp: number | null;
  operatingMaxTemp: number | null;
  isOperatingHours: boolean | null;
}

interface SeriesBody {
  comfortMin: number;
  comfortMax: number;
  bucket: string;
  points: Point[];
  external: Array<{ bucketStart: string; avgTemp: number | null }>;
}

interface SummaryBody {
  name: string;
  storeName: string;
  timezone: string;
  comfortMin: number;
  comfortMax: number;
  operatingHours?: WeekHours;
  deviceStatus?: "ONLINE" | "OFFLINE" | "NO_DATA";
  comfortPercent?: number | null;
  lastTemp?: number | null;
  latestAt?: string | null;
  asOf?: string | null;
  windowFrom?: string;
  windowTo?: string;
}

export default async function EnvironmentPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ bucket?: string; period?: string; date?: string; from?: string; to?: string; hours?: string }>;
}) {
  const token = (await cookies()).get("accessToken")?.value ?? "";
  if (!token) {
    redirect("/entrar?aviso=sessao");
  }
  const { id } = await params;
  const query = await searchParams;
  const requested = query.bucket ?? "";
  const knownBuckets = ["30m", "1h", "1d", "1w", "1mo"];
  const bucket = requested === "" || knownBuckets.includes(requested) ? requested || "30m" : requested;
  const period = parseNetworkPeriod(query.period);
  const date = dayParam(query.date);
  const from = dayParam(query.from);
  const to = dayParam(query.to);
  const ranged = Boolean(from && to);
  const onlyOperating = query.hours === "expediente";
  const summary = await loadJson<SummaryBody>(token, `/api/v1/environments/${id}/summary?${seriesQuery({ period, date, from, to })}`);
  if (summary === "session") {
    redirect("/entrar?aviso=sessao");
  }
  if (summary === "missing") {
    return (
      <main className="mx-auto flex max-w-lg flex-col gap-3 p-6">
        <p>{messages.notFound}</p>
        <a className="text-sm text-primary" href="/rede">{messages.back}</a>
      </main>
    );
  }
  if (summary === "failure" || summary === "focus" || !isBody(summary)) {
    return (
      <main className="p-6">
        <p><a className="text-sm text-primary" href={detailHref(id, period, bucket, ranged ? { from, to } : { date })}>{messages.loadFailed}</a></p>
      </main>
    );
  }
  const series = await loadJson<SeriesBody>(
    token,
    `/api/v1/environments/${id}/timeseries?bucket=${bucket}&${seriesQuery({ period, date, from, to })}`,
  );
  return (
    <main aria-label={messages.detailTitle} className="mx-auto flex w-full max-w-6xl flex-col gap-4 p-4 md:p-6">
      <p><a className="text-sm text-primary" href="/rede">{messages.back}</a></p>
      <div className="min-w-0">
        <h1 className="environment-name text-balance break-words text-2xl font-semibold tracking-tight">{summary.name}</h1>
        <p className="text-sm text-muted-foreground">{summary.storeName}</p>
      </div>
      <EnvironmentBoard
        key={`${bucket}|${period}|${from}|${to}|${ranged}`}
        id={id}
        token={token}
        period={period}
        bucket={bucket}
        from={ranged ? from : summary.windowFrom ? localDay(summary.windowFrom, summary.timezone) : ""}
        to={ranged ? to : summary.windowTo ? localDay(summary.windowTo, summary.timezone) : ""}
        ranged={ranged}
        max={summary.asOf ? localDay(summary.asOf, summary.timezone) : ""}
        timezone={summary.timezone}
        comfortMin={summary.comfortMin}
        comfortMax={summary.comfortMax}
        operatingHours={summary.operatingHours ?? {}}
        comfortPercent={summary.comfortPercent ?? null}
        lastTemp={summary.lastTemp ?? null}
        latestAt={summary.latestAt ?? null}
        deviceStatus={summary.deviceStatus ?? "NO_DATA"}
        external={isBody(series) ? series.external ?? [] : []}
        failed={!isBody(series)}
        onlyOperating={onlyOperating}
        points={isBody(series) ? series.points.map((point) => ({
          at: point.bucketStart,
          avgTemp: point.avgTemp,
          minTemp: point.minTemp,
          maxTemp: point.maxTemp,
          operatingAvgTemp: point.operatingAvgTemp ?? null,
          operatingMinTemp: point.operatingMinTemp ?? null,
          operatingMaxTemp: point.operatingMaxTemp ?? null,
          isOperatingHours: point.isOperatingHours,
        })) : []}
      />
    </main>
  );
}

function dayParam(value?: string): string {
  return /^\d{4}-\d{2}-\d{2}$/.test(value ?? "") ? value ?? "" : "";
}

function seriesQuery(input: { period: string; date: string; from: string; to: string }): string {
  if (input.from && input.to) {
    return new URLSearchParams({ from: input.from, to: input.to }).toString();
  }
  const params = new URLSearchParams({ period: input.period });
  if (input.date) {
    params.set("date", input.date);
  }
  return params.toString();
}

function isBody<T>(value: T | LoadKind): value is T {
  return typeof value === "object" && value !== null;
}

async function loadJson<T>(token: string, path: string): Promise<T | LoadKind> {
  try {
    const response = await fetch(`${serverApiBase()}${path}`, {
      headers: { authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    const body = (await response.json().catch(() => ({}))) as T & { code?: string };
    const kind = kindFromStatus(response.status, body.code);
    if (kind !== "ok") {
      return kind;
    }
    return body;
  } catch {
    return "failure";
  }
}
