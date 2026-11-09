import type { ComfortStatus } from "../../../../shared/models/cadastro";

export interface CountedEnvironment {
  lastSeenAt: Date | null;
  lastComfortStatus: ComfortStatus | null;
}

export interface StoreCounts {
  inRangeCount: number;
  aboveCount: number;
  belowCount: number;
  noDataCount: number;
}
