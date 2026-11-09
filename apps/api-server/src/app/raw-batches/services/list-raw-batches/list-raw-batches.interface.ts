import type { RawBatchRow } from "../../repositories/raw-batch.repository";

export type RawBatchDecision = "OK" | "FORBIDDEN" | "CLIENT_FOCUS_REQUIRED";

export type RawBatchList =
  | { code: "FORBIDDEN" | "CLIENT_FOCUS_REQUIRED"; items: [] }
  | { items: RawBatchRow[] };
