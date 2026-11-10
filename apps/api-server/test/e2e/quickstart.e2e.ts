import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import mqtt from "mqtt";
import { createClient } from "redis";
import { Client } from "minio";
import { Pool } from "pg";
import { restoreDatasetClock } from "./restore-dataset-clock";

const base = process.env.API_BASE_URL;
const live = base ? describe : describe.skip;

live("quickstart", () => {
  jest.setTimeout(40_000);
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const password = "change-me";

  afterAll(async () => {
    await restoreDatasetClock(pool);
    await pool.end();
  });

  async function login(email: string, secret = password) {
    const response = await fetch(`${base}/api/v1/auth/login`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email, password: secret }),
    });
    return { status: response.status, body: await response.json() as Record<string, string> };
  }

  async function authed(token: string, path: string, init?: RequestInit) {
    return fetch(`${base}${path}`, {
      ...init,
      headers: { ...(init?.headers ?? {}), authorization: `Bearer ${token}` },
    });
  }

  function publish(payload: object): Promise<boolean> {
    const client = mqtt.connect(process.env.MQTT_URL ?? "");
    return new Promise((resolve) => {
      const timer = setTimeout(() => {
        client.end(true);
        resolve(false);
      }, 4000);

      client.once("error", () => {
        clearTimeout(timer);
        client.end(true);
        resolve(false);
      });

      client.once("connect", () => {
        client.publish("diel/telemetry", JSON.stringify(payload), { qos: 1 }, (error) => {
          clearTimeout(timer);
          client.end(true);
          resolve(!error);
        });
      });
    });
  }

  async function waitRow(sql: string, values: unknown[]) {
    for (let attempt = 0; attempt < 40; attempt += 1) {
      const result = await pool.query(sql, values);

      if (result.rowCount) {
        return result.rows[0] as Record<string, unknown>;
      }

      await new Promise((resolve) => setTimeout(resolve, 250));
    }

    return null;
  }

  it("covers access, ingest, series and the portuguese screens", async () => {
    for (let attempt = 0; attempt < 30; attempt += 1) {
      try {
        const probe = await fetch(`${base}/api/v1/stores`);

        if (probe.status > 0) {
          break;
        }

      } catch {
        await new Promise((resolveWait) => setTimeout(resolveWait, 500));
      }
    }

    const copy = readFileSync(resolve(__dirname, "../../../web/src/shared/messages/pt-BR.ts"), "utf8");
    expect(copy).toContain("E-mail ou senha inválidos.");
    expect(copy).toContain("Visão da rede");
    expect(copy).toContain("Detalhe do ambiente");

    const invalid = await login("carlos.mendes@modacarioca.example", "wrong");
    expect(invalid.status).toBe(401);
    expect(invalid.body).toEqual({ code: "INVALID_CREDENTIALS" });

    const manager = await login("carlos.mendes@modacarioca.example");
    const stores = await authed(manager.body.accessToken, "/api/v1/stores");
    const listed = await stores.json() as { items: Array<{ id: string }> };
    expect(listed.items.map((item) => item.id)).toEqual(expect.arrayContaining(["LOJA-RJ-001", "LOJA-SP-001"]));
    expect(listed.items.map((item) => item.id)).not.toEqual(expect.arrayContaining(["LOJA-MG-001"]));

    const clerk = await login("juliana.prado@modacarioca.example");
    const ownStores = await authed(clerk.body.accessToken, "/api/v1/stores");
    const own = await ownStores.json() as { items: Array<{ id: string }> };
    expect(own.items.map((item) => item.id)).toEqual(["LOJA-SP-001"]);

    if (process.env.REDIS_URL) {
      const clock = createClient({ url: process.env.REDIS_URL });

      await clock.connect();
      await clock.del("operator:focus:USR-001");
      await clock.quit();
    }

    const operator = await login("ana.ribeiro@diel.example");
    const unfocused = await authed(operator.body.accessToken, "/api/v1/stores");
    expect(await unfocused.json()).toMatchObject({ items: [], code: "CLIENT_FOCUS_REQUIRED" });
    const focus = await authed(operator.body.accessToken, "/api/v1/auth/focus-client", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ clientId: "CLI-001" }),
    });
    expect(focus.status).toBe(201);
    const focused = await authed(operator.body.accessToken, "/api/v1/stores");
    const focusedBody = await focused.json() as { items: Array<{ id: string }> };
    expect(focusedBody.items.map((item) => item.id)).not.toContain("LOJA-MG-001");
    const forbiddenFocus = await authed(manager.body.accessToken, "/api/v1/auth/focus-client", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ clientId: "CLI-002" }),
    });
    expect(forbiddenFocus.status).toBe(403);

    const worker = process.env.WORKER_BASE_URL ?? "http://ingestion-worker:3002";
    const heldLine = JSON.stringify({
      deviceId: "IOT001",
      timestamp: "2026-04-01T12:00:00.000Z",
      intervalSeconds: 60,
      readings: [22],
      savedData: false,
    });

    await fetch(`${worker}/test/object-store`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ fail: true }),
    });
    const held = await fetch(`${worker}/test/consume`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ line: heldLine }),
    });
    expect(await held.json()).toEqual({ acked: false });
    await fetch(`${worker}/test/object-store`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ fail: false }),
    });
    const recovered = await fetch(`${worker}/test/consume`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ line: heldLine }),
    });
    expect(await recovered.json()).toEqual({ acked: true });

    const stamp = "2026-04-02T15:00:00.000Z";
    expect(await publish({
      deviceId: "IOT001",
      timestamp: stamp,
      intervalSeconds: 60,
      readings: [22],
      savedData: false,
    })).toBe(true);
    expect(await waitRow(
      "SELECT temperature FROM telemetry_samples WHERE dev_id = $1 AND sample_time = $2",
      ["IOT001", stamp],
    )).toMatchObject({ temperature: 22 });
    expect(await publish({
      deviceId: "IOT001",
      timestamp: stamp,
      intervalSeconds: 60,
      readings: [22],
      savedData: false,
    })).toBe(true);
    const count = await pool.query(
      "SELECT COUNT(*)::int AS total FROM telemetry_samples WHERE dev_id = $1 AND sample_time = $2",
      ["IOT001", stamp],
    );
    expect(count.rows[0].total).toBe(1);

    const extreme = "2026-04-03T15:00:00.000Z";
    expect(await publish({
      deviceId: "IOT001",
      timestamp: extreme,
      intervalSeconds: 60,
      readings: [80, 60],
      savedData: true,
    })).toBe(true);
    const accepted = await waitRow(
      "SELECT is_delayed_packet FROM telemetry_samples WHERE dev_id = $1 AND sample_time = $2",
      ["IOT001", extreme],
    );
    expect(accepted).toMatchObject({ is_delayed_packet: true });
    const rejected = await waitRow(
      "SELECT reason FROM telemetry_anomalies WHERE dev_id = $1 AND raw_value = 80 AND detected_at = $2",
      ["IOT001", "2026-04-03T14:59:00.000Z"],
    );
    expect(rejected).toMatchObject({ reason: "OUT_OF_RANGE" });

    const series = await authed(
      manager.body.accessToken,
      "/api/v1/environments/AMB-001/timeseries?from=2026-04-02T14:00:00.000Z&to=2026-04-02T16:00:00.000Z&bucket=1h",
    );
    const seriesBody = await series.json() as { points: Array<{ avgTemp: number | null }>; external: unknown[]; comfortMin: number };
    expect(series.status).toBe(200);
    expect(seriesBody.points.some((point) => point.avgTemp === null)).toBe(true);
    expect(Array.isArray(seriesBody.external)).toBe(true);
    expect(seriesBody.comfortMin).toBe(21);
    const invalidBucket = await authed(manager.body.accessToken, "/api/v1/environments/AMB-001/timeseries?bucket=2h");
    expect(invalidBucket.status).toBe(400);
    const otherClient = await authed(manager.body.accessToken, "/api/v1/environments/AMB-019/summary");
    expect(otherClient.status).toBe(404);

    const batches = await authed(manager.body.accessToken, "/api/v1/storage/raw-batches?date=2026-04-02");
    const batchBody = await batches.json() as { items: unknown[] };
    expect(batchBody.items.length).toBeGreaterThan(0);
    const denied = await authed(clerk.body.accessToken, "/api/v1/storage/raw-batches?date=2026-04-02");
    expect(denied.status).toBe(403);

    const url = new URL(process.env.MINIO_ENDPOINT ?? "http://minio:9000");
    const store = new Client({
      endPoint: url.hostname,
      port: Number(url.port || 9000),
      useSSL: url.protocol === "https:",
      accessKey: process.env.MINIO_ROOT_USER ?? "change-me",
      secretKey: process.env.MINIO_ROOT_PASSWORD ?? "change-me",
    });
    const objects: string[] = [];

    await new Promise<void>((resolve, reject) => {
      const stream = store.listObjectsV2(process.env.MINIO_BUCKET ?? "diel-raw-telemetry", "dt=2026-04-02/", true);
      stream.on("data", (item: { name: string }) => objects.push(item.name));
      stream.on("end", () => resolve());
      stream.on("error", reject);
    });

    expect(objects.some((name) => name.endsWith(".jsonl.gz"))).toBe(true);

    const started = Date.now();

    await pool.query("SELECT id FROM stores WHERE client_id = $1", ["CLI-001"]);
    expect(Date.now() - started).toBeLessThan(30);
    const open = await authed(manager.body.accessToken, "/api/v1/stores");
    expect(open.status).toBe(200);
  });
});
