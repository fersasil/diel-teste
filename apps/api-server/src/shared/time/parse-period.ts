export const PERIODS = ["1d", "7d", "30d"] as const;
export type Period = (typeof PERIODS)[number];

const PERIOD_MS: Record<Period, number> = {
  "1d": 24 * 60 * 60 * 1000,
  "7d": 7 * 24 * 60 * 60 * 1000,
  "30d": 30 * 24 * 60 * 60 * 1000,
};

export function parsePeriod(value?: string): Period {
  return PERIODS.find((item) => item === value) ?? "1d";
}

export function periodRange(period: Period, virtualNow: Date): { from: Date; to: Date } {
  return {
    from: new Date(virtualNow.getTime() - PERIOD_MS[period]),
    to: virtualNow,
  };
}
