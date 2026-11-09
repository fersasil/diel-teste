import type { SeriesPoint } from "../../repositories/timeseries.repository";
import type { Bucket } from "../timeseries-bucket/timeseries-bucket.interface";

export interface TimeseriesQuery {
  environmentId: string;
  from: string;
  to: string;
  bucket?: string;
  timezone: string;
}

export type TimeseriesResult =
  | { code: "INVALID_BUCKET" | "INVALID_RANGE" }
  | { bucket: Bucket; points: SeriesPoint[] };
