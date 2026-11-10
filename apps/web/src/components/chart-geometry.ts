export interface PlotPoint {
  index: number;
  value: number;
}

export interface PlotFrame {
  width: number;
  height: number;
  left: number;
  right: number;
  top: number;
  bottom: number;
}

export function segments(values: Array<number | null>): PlotPoint[][] {
  const groups: PlotPoint[][] = [];
  let current: PlotPoint[] = [];
  values.forEach((value, index) => {
    if (value === null) {
      if (current.length > 0) {
        groups.push(current);
      }
      current = [];
      return;
    }
    current.push({ index, value });
  });
  if (current.length > 0) {
    groups.push(current);
  }
  return groups;
}

export function bounds(values: number[], comfortMin: number, comfortMax: number): { min: number; max: number } {
  const samples = values.length > 0 ? values : [comfortMin];
  let min = Math.min(...samples, comfortMin, comfortMax);
  let max = Math.max(...samples, comfortMin, comfortMax);
  if (min === max) {
    min -= 1;
    max += 1;
  }
  const pad = Math.max(1.5, (max - min) * 0.12);
  return { min: min - pad, max: max + pad };
}

export function ribbon(
  low: Array<number | null>,
  high: Array<number | null>,
  count: number,
  span: { min: number; max: number },
  frame: PlotFrame,
): string[] {
  const groups: string[] = [];
  let current: number[] = [];
  const flush = () => {
    if (current.length >= 2) {
      const forward = current.map((index) => pointAt(index, high[index] as number, count, span, frame));
      const back = [...current].reverse().map((index) => pointAt(index, low[index] as number, count, span, frame));
      groups.push([...forward, ...back].join(" "));
    }
    current = [];
  };
  low.forEach((value, index) => {
    if (value === null || high[index] === null || high[index] === undefined) {
      flush();
      return;
    }
    current.push(index);
  });
  flush();
  return groups;
}

function pointAt(
  index: number,
  value: number,
  count: number,
  span: { min: number; max: number },
  frame: PlotFrame,
): string {
  return `${xAt(index, count, frame)},${yAt(value, span, frame)}`;
}

export function axisTicks(span: { min: number; max: number }): number[] {
  const spanSize = span.max - span.min;
  if (spanSize <= 0) {
    return [span.min];
  }
  const rough = spanSize / 5;
  const magnitude = 10 ** Math.floor(Math.log10(rough));
  const residual = rough / magnitude;
  const step = (residual >= 5 ? 10 : residual >= 2.5 ? 5 : residual >= 1.5 ? 2 : 1) * magnitude;
  const start = Math.ceil((span.min - step * 1e-6) / step) * step;
  const ticks: number[] = [];
  for (let value = start; value <= span.max + step * 1e-6; value += step) {
    ticks.push(Math.round(value * 1000) / 1000);
  }
  return ticks.length > 0 ? ticks : [span.min, span.max];
}

export function xAt(index: number, count: number, frame: PlotFrame): number {
  const inner = frame.width - frame.left - frame.right;
  return frame.left + (count <= 1 ? inner / 2 : (index / (count - 1)) * inner);
}

export function yAt(value: number, span: { min: number; max: number }, frame: PlotFrame): number {
  const inner = frame.height - frame.top - frame.bottom;
  return frame.top + ((span.max - value) / (span.max - span.min)) * inner;
}

export function polyline(
  points: PlotPoint[],
  count: number,
  span: { min: number; max: number },
  frame: PlotFrame,
): string {
  return points.map((point) => `${xAt(point.index, count, frame)},${yAt(point.value, span, frame)}`).join(" ");
}

export function labelIndexes(count: number, maxLabels = 8): number[] {
  if (count <= 0) {
    return [];
  }
  if (count === 1) {
    return [0];
  }
  const ticks = Math.min(maxLabels, count);
  const indexes = Array.from({ length: ticks }, (_, index) => Math.round((index * (count - 1)) / (ticks - 1)));
  return [...new Set(indexes)];
}
