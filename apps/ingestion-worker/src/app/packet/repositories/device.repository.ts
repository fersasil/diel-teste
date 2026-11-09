import { getPool } from "../../../infra/database/pg-pool";
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

const DEVICE_SQL = `SELECT d.dev_id, e.id, e.store_id, s.client_id, e.comfort_min, e.comfort_max,
            s.timezone, e.operating_hours
     FROM devices d
     JOIN environments e ON e.id = d.environment_id
     JOIN stores s ON s.id = e.store_id`;

let catalog: Map<string, DeviceRow> | null = null;

export class DeviceRepository {
  async findByDeviceId(deviceId: string): Promise<DeviceRow | null> {
    if (!catalog) {
      catalog = await loadAll();
    }
    const cached = catalog.get(deviceId);
    if (cached) {
      return cached;
    }
    const result = await getPool().query(`${DEVICE_SQL} WHERE d.dev_id = $1`, [deviceId]);
    const row = result.rows[0];
    if (!row) {
      return null;
    }
    const mapped = mapRow(row);
    catalog.set(deviceId, mapped);
    return mapped;
  }
}

async function loadAll(): Promise<Map<string, DeviceRow>> {
  const result = await getPool().query(DEVICE_SQL);
  const loaded = new Map<string, DeviceRow>();
  for (const row of result.rows) {
    loaded.set(row.dev_id, mapRow(row));
  }
  return loaded;
}

function mapRow(row: {
  id: string;
  store_id: string;
  client_id: string;
  comfort_min: number;
  comfort_max: number;
  timezone: string;
  operating_hours: WeekHours;
}): DeviceRow {
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
