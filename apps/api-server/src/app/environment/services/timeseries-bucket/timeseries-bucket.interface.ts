export const BUCKETS = ["15m", "30m", "1h", "1d", "1w", "1mo"] as const;
export type Bucket = (typeof BUCKETS)[number];
