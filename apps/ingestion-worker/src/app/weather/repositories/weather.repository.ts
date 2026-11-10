import { Injectable } from "@nestjs/common";
import { PgPool } from "../../../infra/database/pg-pool";
import type { CityReading } from "../../../infra/open-meteo/open-meteo";
import type { WeatherStore } from "../services/sync-city-weather/sync-city-weather.service";

const BATCH = 400;

@Injectable()
export class WeatherRepository {
  public constructor(private readonly database: PgPool) {}

  public async listStores(): Promise<WeatherStore[]> {
    const result = await this.database.get().query<{
      id: string;
      city: string;
      latitude: number;
      longitude: number;
      covered_from: Date | null;
      covered_to: Date | null;
    }>(
      `SELECT s.id, s.city, s.latitude, s.longitude,
              MIN(w.reading_time) AS covered_from,
              MAX(w.reading_time) AS covered_to
       FROM stores s
       LEFT JOIN external_weather w ON w.store_id = s.id
       GROUP BY s.id, s.city, s.latitude, s.longitude
       ORDER BY s.id`,
    );
    return result.rows.map((row) => ({
      id: row.id,
      city: row.city,
      latitude: Number(row.latitude),
      longitude: Number(row.longitude),
      coveredFrom: row.covered_from,
      coveredTo: row.covered_to,
    }));
  }

  public async sampleSpan(): Promise<{ from: Date; to: Date } | null> {
    const result = await this.database.get().query<{ from_time: Date | null; to_time: Date | null }>(
      "SELECT MIN(sample_time) AS from_time, MAX(sample_time) AS to_time FROM telemetry_samples",
    );
    const row = result.rows[0];

    if (!row?.from_time || !row?.to_time) {
      return null;
    }

    return { from: row.from_time, to: row.to_time };
  }

  public async saveHours(storeId: string, city: string, readings: CityReading[]): Promise<number> {
    const pool = this.database.get();
    let written = 0;
    for (let index = 0; index < readings.length; index += BATCH) {
      const slice = readings.slice(index, index + BATCH);
      const values: unknown[] = [];
      const tuples = slice.map((reading) => {
        const base = values.length;
        values.push(reading.readingTime, storeId, city, reading.temperature);
        return `($${base + 1},$${base + 2},$${base + 3},$${base + 4})`;
      });

      const result = await pool.query(
        `INSERT INTO external_weather (reading_time, store_id, city, external_temp)
         VALUES ${tuples.join(",")}
         ON CONFLICT (store_id, reading_time) DO UPDATE
         SET external_temp = EXCLUDED.external_temp, city = EXCLUDED.city`,
        values,
      );
      written += result.rowCount ?? 0;
    }

    return written;
  }
}
