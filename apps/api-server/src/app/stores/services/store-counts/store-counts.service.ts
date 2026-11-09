import type { CountedEnvironment, StoreCounts } from "./store-counts.interface";

export type { CountedEnvironment, StoreCounts } from "./store-counts.interface";

export function countEnvironments(environments: CountedEnvironment[]): StoreCounts {
  const counts: StoreCounts = {
    inRangeCount: 0,
    aboveCount: 0,
    belowCount: 0,
    noDataCount: 0,
  };
  for (const environment of environments) {
    if (environment.lastSeenAt === null) {
      counts.noDataCount += 1;
      continue;
    }
    if (environment.lastComfortStatus === "IN_RANGE") {
      counts.inRangeCount += 1;
    } else if (environment.lastComfortStatus === "ABOVE") {
      counts.aboveCount += 1;
    } else if (environment.lastComfortStatus === "BELOW") {
      counts.belowCount += 1;
    }
  }
  return counts;
}
