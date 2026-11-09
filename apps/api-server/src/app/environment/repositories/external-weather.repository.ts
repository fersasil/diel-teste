import { getPool } from "../../../infra/database/pg-pool";
import type { ExternalPoint } from "../services/attach-external-weather/attach-external-weather.service";

export class ExternalWeatherRepository {
  async series(storeId: string, from: Date, to: Date): Promise<ExternalPoint[]> {
    const result = await getPool().query<{ bucket_start: Date; avg_temp: number | null }>(
      `SELECT time_bucket('1 hour', reading_time) AS bucket_start,
              AVG(external_temp) AS avg_temp
       FROM external_weather
       WHERE store_id = $1
         AND reading_time >= $2::timestamptz
         AND reading_time <= $3::timestamptz
       GROUP BY bucket_start
       ORDER BY bucket_start ASC`,
      [storeId, from, to],
    );
    return result.rows.map((row) => ({
      bucketStart: row.bucket_start.toISOString(),
      avgTemp: row.avg_temp,
    }));
  }
}
