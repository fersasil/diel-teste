import { Injectable } from "@nestjs/common";
import { PgPool } from "../../../infra/database/pg-pool";
import type { WeekHours } from "../services/operating-hours/operating-hours.service";

export interface DeviceRow {
  environmentId: string;
  storeId: string;
  clientId: string;
  comfortMin: number;
  comfortMax: number;
  timezone: string;
  operatingHours: WeekHours;
}

interface DeviceSqlRow {
  dev_id: string;
  id: string;
  store_id: string;
  client_id: string;
  comfort_min: number;
  comfort_max: number;
  timezone: string;
  operating_hours: WeekHours;
}

const DEVICE_SQL = `SELECT d.dev_id, e.id, e.store_id, s.client_id, e.comfort_min, e.comfort_max,
            s.timezone, e.operating_hours
     FROM devices d
     JOIN environments e ON e.id = d.environment_id
     JOIN stores s ON s.id = e.store_id`;

@Injectable()
export class DeviceRepository {
  private catalog: Map<string, DeviceRow> | null = null;

  public constructor(private readonly database: PgPool) {}

  public async findByDeviceId(deviceId: string): Promise<DeviceRow | null> {
    const loaded = await this.catalogOrLoad();
    const cached = loaded.get(deviceId);

    if (cached) {
      return cached;
    }

    const result = await this.database.get().query<DeviceSqlRow>(
      `${DEVICE_SQL} WHERE d.dev_id = $1`,
      [deviceId],
    );
    const row = result.rows[0];

    if (!row) {
      return null;
    }

    const mapped = mapRow(row);
    loaded.set(deviceId, mapped);
    return mapped;
  }

  private async catalogOrLoad(): Promise<Map<string, DeviceRow>> {
    if (!this.catalog) {
      this.catalog = await this.loadAll();
    }

    return this.catalog;
  }

  private async loadAll(): Promise<Map<string, DeviceRow>> {
    const result = await this.database.get().query<DeviceSqlRow>(DEVICE_SQL);
    const loaded = new Map<string, DeviceRow>();
    for (const row of result.rows) {
      loaded.set(row.dev_id, mapRow(row));
    }

    return loaded;
  }
}

function mapRow(row: DeviceSqlRow): DeviceRow {
  return {
    environmentId: row.id,
    storeId: row.store_id,
    clientId: row.client_id,
    comfortMin: row.comfort_min,
    comfortMax: row.comfort_max,
    timezone: row.timezone,
    operatingHours: row.operating_hours,
  };
}
