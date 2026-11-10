import { Pool } from "pg";
import { attachExternalWeather } from "../../src/app/environment/services/attach-external-weather/attach-external-weather.service";

describe("external weather", () => {
  it("does not fail or change the indoor range when the external series is empty", () => {
    const body = attachExternalWeather({ comfortMin: 20, comfortMax: 24 }, []);
    expect(body.comfortMin).toBe(20);
    expect(body.comfortMax).toBe(24);
    expect(body.external).toEqual([]);
  });

  const base = process.env.API_BASE_URL ?? "";
  const live = base && process.env.DATABASE_URL ? it : it.skip;

  live("shows the stored city hour on the matching indoor bucket", async () => {
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    const stamp = "2026-04-02T15:00:00.000Z";
    const previous = await pool.query<{ external_temp: number }>(
      "SELECT external_temp FROM external_weather WHERE store_id = $1 AND reading_time = $2",
      ["LOJA-RJ-001", stamp],
    );

    await pool.query(
      `INSERT INTO external_weather (reading_time, store_id, city, external_temp)
       VALUES ($1, 'LOJA-RJ-001', 'Rio de Janeiro', 31.5)
       ON CONFLICT (store_id, reading_time) DO UPDATE SET external_temp = EXCLUDED.external_temp`,
      [stamp],
    );
    try {
      const token = await login();
      const response = await fetch(
        `${base}/api/v1/environments/AMB-001/timeseries?from=2026-04-02T14:00:00.000Z&to=2026-04-02T16:00:00.000Z&bucket=1h`,
        { headers: { authorization: `Bearer ${token}` } },
      );
      const body = await response.json() as {
        comfortMin: number;
        points: Array<{ bucketStart: string }>;
        external: Array<{ avgTemp: number | null }>;
      };
      expect(response.status).toBe(200);
      expect(body.comfortMin).toBe(21);
      const index = body.points.findIndex((point) => point.bucketStart.startsWith("2026-04-02T15:00"));
      expect(index).toBeGreaterThanOrEqual(0);
      expect(body.external[index]?.avgTemp).toBeCloseTo(31.5);
    } finally {

      if (previous.rowCount === 0) {
        await pool.query("DELETE FROM external_weather WHERE store_id = $1 AND reading_time = $2", ["LOJA-RJ-001", stamp]);
      } else {
        await pool.query(
          "UPDATE external_weather SET external_temp = $3 WHERE store_id = $1 AND reading_time = $2",
          ["LOJA-RJ-001", stamp, previous.rows[0].external_temp],
        );
      }

      await pool.end();
    }
  });

  live("uses the local days of a chosen interval", async () => {
    const token = await login();
    const response = await fetch(
      `${base}/api/v1/environments/AMB-001/timeseries?from=2026-02-10&to=2026-02-10&bucket=1h`,
      { headers: { authorization: `Bearer ${token}` } },
    );
    const body = await response.json() as { points: Array<{ bucketStart: string; avgTemp: number | null }> };
    const first = body.points[0]?.bucketStart ?? "";
    const last = body.points.at(-1)?.bucketStart ?? "";
    expect(response.status).toBe(200);
    expect(first >= "2026-02-10T03:00:00.000Z" && first.length > 0).toBe(true);
    expect(last <= "2026-02-11T02:59:59.999Z" && last.length > 0).toBe(true);
    expect(body.points.some((point) => point.avgTemp !== null)).toBe(true);
    const longer = await fetch(
      `${base}/api/v1/environments/AMB-001/summary?from=2026-02-01&to=2026-03-15`,
      { headers: { authorization: `Bearer ${token}` } },
    );
    expect(longer.status).toBe(200);
  });

  live("groups the series by local day, week and month", async () => {
    const token = await login();
    const headers = { authorization: `Bearer ${token}` };
    const day = await fetch(`${base}/api/v1/environments/AMB-001/timeseries?from=2026-02-10&to=2026-02-10&bucket=1d`, { headers });
    const dayBody = await day.json() as { points: Array<{ bucketStart: string; avgTemp: number | null }> };
    expect(day.status).toBe(200);
    expect(dayBody.points.map((point) => point.bucketStart)).toEqual(["2026-02-10T03:00:00.000Z"]);
    expect(dayBody.points[0]?.avgTemp).not.toBeNull();
    const week = await fetch(`${base}/api/v1/environments/AMB-001/timeseries?from=2026-02-10&to=2026-02-10&bucket=1w`, { headers });
    const weekBody = await week.json() as { points: Array<{ bucketStart: string }> };
    expect(weekBody.points[0]?.bucketStart).toBe("2026-02-09T03:00:00.000Z");
    const month = await fetch(`${base}/api/v1/environments/AMB-001/timeseries?from=2026-02-01&to=2026-03-15&bucket=1mo`, { headers });
    const monthBody = await month.json() as { points: Array<{ bucketStart: string; avgTemp: number | null }> };
    expect(monthBody.points.map((point) => point.bucketStart)).toEqual([
      "2026-02-01T03:00:00.000Z",
      "2026-03-01T03:00:00.000Z",
    ]);
    expect(monthBody.points[0]?.avgTemp).not.toBeNull();
    expect(monthBody.points[1]?.avgTemp).toBeNull();
  });
});

async function login(): Promise<string> {
  const response = await fetch(`${process.env.API_BASE_URL}/api/v1/auth/login`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email: "carlos.mendes@modacarioca.example", password: "change-me" }),
  });
  const body = (await response.json()) as { accessToken: string };
  return body.accessToken;
}
