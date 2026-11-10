import { getPool } from "../../../infra/database/pg-pool";
import { bucketInterval, type Bucket } from "../services/timeseries-bucket/timeseries-bucket.service";

export interface SeriesPoint {
  bucketStart: string;
  avgTemp: number | null;
  minTemp: number | null;
  maxTemp: number | null;
  operatingAvgTemp: number | null;
  operatingMinTemp: number | null;
  operatingMaxTemp: number | null;
  isOperatingHours: boolean | null;
}

export class TimeseriesRepository {
  async series(input: {
    environmentId: string;
    from: Date;
    to: Date;
    bucket: Bucket;
    timezone: string;
  }): Promise<SeriesPoint[]> {
    const interval = bucketInterval(input.bucket);

    if (input.bucket !== "30m") {
      return this.fromAggregate(input, interval);
    }

    const result = await getPool().query<{
      bucket_start: Date;
      avg_temp: number | null;
      min_temp: number | null;
      max_temp: number | null;
      operating_avg_temp: number | null;
      operating_min_temp: number | null;
      operating_max_temp: number | null;
      is_operating: boolean | null;
    }>(
      `SELECT
         time_bucket_gapfill($4::interval, sample_time, $2::timestamptz, $3::timestamptz) AS bucket_start,
         AVG(temperature) AS avg_temp,
         MIN(temperature) AS min_temp,
         MAX(temperature) AS max_temp,
         AVG(temperature) FILTER (WHERE is_operating_hours) AS operating_avg_temp,
         MIN(temperature) FILTER (WHERE is_operating_hours) AS operating_min_temp,
         MAX(temperature) FILTER (WHERE is_operating_hours) AS operating_max_temp,
         BOOL_OR(is_operating_hours) AS is_operating
       FROM telemetry_samples
       WHERE environment_id = $1
         AND sample_time >= $2::timestamptz
         AND sample_time <= $3::timestamptz
       GROUP BY bucket_start
       ORDER BY bucket_start ASC`,
      [input.environmentId, input.from, input.to, interval],
    );
    return result.rows.map(toPoint);
  }

  private async fromAggregate(
    input: { environmentId: string; from: Date; to: Date; timezone: string; bucket: Bucket },
    interval: string,
  ): Promise<SeriesPoint[]> {
    const zone = input.bucket === "1h" ? "UTC" : input.timezone;
    const result = await getPool().query<{
      bucket_start: Date;
      avg_temp: number | null;
      min_temp: number | null;
      max_temp: number | null;
      operating_avg_temp: number | null;
      operating_min_temp: number | null;
      operating_max_temp: number | null;
      is_operating: boolean | null;
    }>(
      `SELECT
         series.bucket_start,
         CASE WHEN SUM(c.total_samples) > 0
           THEN SUM(c.avg_temp * c.total_samples) / SUM(c.total_samples)
           ELSE NULL END AS avg_temp,
         MIN(c.min_temp) AS min_temp,
         MAX(c.max_temp) AS max_temp,
         CASE WHEN SUM(c.operating_samples) > 0
           THEN SUM(c.operating_avg_temp * c.operating_samples) / SUM(c.operating_samples)
           ELSE NULL END AS operating_avg_temp,
         MIN(c.operating_min_temp) AS operating_min_temp,
         MAX(c.operating_max_temp) AS operating_max_temp,
         CASE WHEN COUNT(c.bucket_hour) = 0 THEN NULL
              WHEN SUM(c.operating_samples) > 0 THEN TRUE
              ELSE FALSE END AS is_operating
       FROM generate_series(
         time_bucket($4::interval, $2::timestamptz, $5::text),
         time_bucket($4::interval, $3::timestamptz, $5::text),
         $4::interval
       ) AS series(bucket_start)
       LEFT JOIN cagg_environment_hourly c
         ON c.environment_id = $1
        AND c.bucket_hour >= series.bucket_start
        AND c.bucket_hour < series.bucket_start + $4::interval
        AND c.bucket_hour >= $2::timestamptz
        AND c.bucket_hour <= $3::timestamptz
       GROUP BY series.bucket_start
       ORDER BY series.bucket_start ASC`,
      [input.environmentId, input.from, input.to, interval, zone],
    );
    return result.rows.map(toPoint);
  }
}

function toPoint(row: {
  bucket_start: Date;
  avg_temp: number | null;
  min_temp: number | null;
  max_temp: number | null;
  operating_avg_temp: number | null;
  operating_min_temp: number | null;
  operating_max_temp: number | null;
  is_operating: boolean | null;
}): SeriesPoint {
  return {
    bucketStart: row.bucket_start.toISOString(),
    avgTemp: numberOrNull(row.avg_temp),
    minTemp: numberOrNull(row.min_temp),
    maxTemp: numberOrNull(row.max_temp),
    operatingAvgTemp: numberOrNull(row.operating_avg_temp),
    operatingMinTemp: numberOrNull(row.operating_min_temp),
    operatingMaxTemp: numberOrNull(row.operating_max_temp),
    isOperatingHours: row.is_operating,
  };
}

function numberOrNull(value: number | string | null): number | null {
  if (value === null || value === undefined) {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}
