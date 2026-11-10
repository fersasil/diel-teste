import { BUCKETS, type Bucket } from "./timeseries-bucket.interface";

export type { Bucket } from "./timeseries-bucket.interface";

export function resolveBucket(value?: string): Bucket | "INVALID_BUCKET" {
  if (value === undefined || value === "") {
    return "30m";
  }

  const bucket = BUCKETS.find((item) => item === value);
  return bucket ?? "INVALID_BUCKET";
}

export function validateRange(from: Date, to: Date): "OK" | "INVALID_RANGE" {
  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime()) || to < from) {
    return "INVALID_RANGE";
  }

  return "OK";
}

export function bucketInterval(bucket: Bucket): string {
  if (bucket === "1h") {
    return "1 hour";
  }

  if (bucket === "1d") {
    return "1 day";
  }

  if (bucket === "1w") {
    return "1 week";
  }

  if (bucket === "1mo") {
    return "1 month";
  }

  return "30 minutes";
}
