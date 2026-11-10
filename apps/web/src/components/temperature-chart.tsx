import { formatChartTick } from "../shared/format";
import { messages } from "../shared/messages/pt-BR";
import { plottedTemperatures } from "./chart-hours";
import { axisTicks, bounds, labelIndexes, polyline, ribbon, segments, xAt, yAt, type PlotFrame } from "./chart-geometry";

interface Point {
  at: string;
  avgTemp: number | null;
  minTemp: number | null;
  maxTemp: number | null;
  operatingAvgTemp: number | null;
  operatingMinTemp: number | null;
  operatingMaxTemp: number | null;
  isOperatingHours: boolean | null;
}

interface ExternalPoint {
  avgTemp: number | null;
}

const frame: PlotFrame = { width: 720, height: 280, left: 48, right: 16, top: 12, bottom: 40 };

export function TemperatureChart({
  points,
  external,
  comfortMin,
  comfortMax,
  timezone,
  showTime = true,
  onlyOperating = false,
}: {
  points: Point[];
  external: ExternalPoint[];
  comfortMin: number;
  comfortMax: number;
  timezone: string;
  showTime?: boolean;
  onlyOperating?: boolean;
}) {
  const shown = points.map((point) => plottedTemperatures(point, onlyOperating));
  const numbers = shown.flatMap((point) => [point.avgTemp, point.minTemp, point.maxTemp]);
  const outside = external.map((point) => point.avgTemp);
  const finite = [...numbers, ...outside].filter((value): value is number => value !== null);
  const span = bounds(finite, comfortMin, comfortMax);
  const count = Math.max(points.length, 1);
  const bandTop = yAt(comfortMax, span, frame);
  const bandBottom = yAt(comfortMin, span, frame);
  const plotRight = frame.width - frame.right;
  const plotBottom = frame.height - frame.bottom;
  const avg = segments(shown.map((point) => point.avgTemp));
  const spread = ribbon(
    shown.map((point) => point.minTemp),
    shown.map((point) => point.maxTemp),
    count,
    span,
    frame,
  );
  const weather = segments(external.map((point) => point.avgTemp ?? null));
  const hasGap = points.length === 0 || points.some((point) => point.avgTemp === null);
  const operating = points.some((point) => point.isOperatingHours);
  const empty = finite.length === 0;
  const closedOnly = onlyOperating && empty && points.some((point) => point.avgTemp !== null);
  const ticks = axisTicks(span);

  return (
    <figure className="flex flex-col gap-3">
      <svg className="chart h-auto w-full" viewBox={`0 0 ${frame.width} ${frame.height}`} role="img" aria-label={messages.temperature}>
        {ticks.map((tick) => {
          const y = yAt(tick, span, frame);
          return (
            <g key={tick}>
              {y < plotBottom - 1 ? <line x1={frame.left} x2={plotRight} y1={y} y2={y} stroke="#e2e8f0" /> : null}
              <text x={frame.left - 8} y={y > plotBottom - 14 ? y - 4 : y + 3} textAnchor="end" fontSize={10} fill="#64748b">
                {Number.isInteger(tick) ? tick.toFixed(0) : tick.toFixed(1)}
              </text>
            </g>
          );
        })}
        <rect
          x={frame.left}
          y={bandTop}
          width={plotRight - frame.left}
          height={Math.max(bandBottom - bandTop, 1)}
          fill="#39B719"
          opacity={0.16}
        />
        <line x1={frame.left} x2={plotRight} y1={bandTop} y2={bandTop} stroke="#39B719" strokeDasharray="3 3" />
        <line x1={frame.left} x2={plotRight} y1={bandBottom} y2={bandBottom} stroke="#39B719" strokeDasharray="3 3" />
        <line x1={frame.left} x2={plotRight} y1={plotBottom} y2={plotBottom} stroke="#cbd5e1" />
        {spread.map((pointsOfBand, index) => (
          <polygon key={`spread-${index}`} points={pointsOfBand} fill="#94a3b8" opacity={0.28} />
        ))}
        {avg.map((group, index) => (
          <polyline key={`avg-${index}`} points={polyline(group, count, span, frame)} fill="none" stroke="#0f172a" strokeWidth={2} />
        ))}
        {weather.map((group, index) => (
          <polyline key={`ext-${index}`} points={polyline(group, count, span, frame)} fill="none" stroke="#00a3ff" strokeDasharray="4 3" />
        ))}
        {points.map((point, index) => point.isOperatingHours ? (
          <rect
            key={`op-${index}`}
            x={xAt(index, count, frame) - 1}
            y={plotBottom - 5}
            width={2}
            height={5}
            fill="#2547d0"
          />
        ) : null)}
        {labelIndexes(points.length).map((index) => {
          const tick = formatChartTick(points[index].at, timezone);
          const x = xAt(index, count, frame);
          const anchor = index === 0 ? "start" : index === points.length - 1 ? "end" : "middle";
          return (
            <text key={`tick-${index}`} x={x} y={plotBottom + 14} textAnchor={anchor} fontSize={11} fill="#475569">
              <tspan x={x} dy="0">{tick.day}</tspan>
              {showTime ? <tspan x={x} dy="12">{tick.time}</tspan> : null}
            </text>
          );
        })}
        {empty ? (
          <text x={frame.width / 2} y={frame.height / 2} textAnchor="middle" fontSize={14} fill="#64748b">
            {closedOnly ? messages.chartEmptyHours : messages.chartEmpty}
          </text>
        ) : null}
      </svg>
      <figcaption className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
        <span>{messages.comfortBand} {comfortMin.toFixed(1)}–{comfortMax.toFixed(1)} °C</span>
        <span className="inline-flex items-center gap-1.5"><i className="inline-block h-0.5 w-3 bg-[#0F172A]" /> {onlyOperating ? messages.averageOperating : messages.average}</span>
        <span className="inline-flex items-center gap-1.5"><i className="inline-block h-2 w-3 rounded-sm bg-slate-400/40" /> {onlyOperating ? messages.spreadOperating : messages.spread}</span>
        {external.length > 0 ? (
          <span className="inline-flex items-center gap-1.5"><i className="inline-block h-0.5 w-3 bg-[#00A3FF]" /> {messages.externalTemperature}</span>
        ) : null}
        {operating ? (
          <span className="inline-flex items-center gap-1.5"><i className="inline-block h-2 w-2 rounded-sm bg-[#2547d0]" /> {messages.operatingMark}</span>
        ) : null}
        {hasGap ? <span>{messages.gap}</span> : null}
        {onlyOperating ? <span>{messages.onlyOperatingNote}</span> : null}
        <span>{messages.storeClock}</span>
      </figcaption>
    </figure>
  );
}
