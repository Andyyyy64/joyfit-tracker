import type { Client, Row } from "@libsql/client";

let client: Client;

export async function getDb(): Promise<Client> {
  if (!client) {
    const url = process.env.TURSO_DATABASE_URL;
    if (url) {
      // Turso (リモート) — web client でnative依存なし
      const { createClient } = await import("@libsql/client/web");
      client = createClient({
        url,
        authToken: process.env.TURSO_AUTH_TOKEN,
      });
    } else {
      // ローカルSQLiteファイル — node client
      const { join } = await import("path");
      const { createClient } = await import("@libsql/client");
      const dbPath = join(
        process.env.PROJECT_ROOT || process.cwd(),
        "data",
        "joyfit.db"
      );
      client = createClient({ url: `file:${dbPath}` });
    }
  }
  return client;
}

export async function initDb(): Promise<void> {
  const db = await getDb();
  await db.executeMultiple(`
    CREATE TABLE IF NOT EXISTS occupancy (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      store_id TEXT NOT NULL,
      count INTEGER NOT NULL,
      status_text TEXT NOT NULL,
      recorded_at TEXT NOT NULL DEFAULT (datetime('now', '+9 hours'))
    );

    CREATE INDEX IF NOT EXISTS idx_occupancy_store_recorded
      ON occupancy(store_id, recorded_at);

    CREATE TABLE IF NOT EXISTS stores (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      prefecture TEXT NOT NULL DEFAULT ''
    );

    CREATE TABLE IF NOT EXISTS analysis_cache (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      store_id TEXT NOT NULL,
      analysis_text TEXT NOT NULL,
      data_range TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now', '+9 hours'))
    );
  `);

  // Migration: add prefecture column if not exists (for existing DBs)
  try {
    await db.execute({ sql: "ALTER TABLE stores ADD COLUMN prefecture TEXT NOT NULL DEFAULT ''", args: [] });
  } catch {
    // Column already exists, ignore
  }

}

export interface OccupancyRecord {
  id: number;
  store_id: string;
  count: number;
  status_text: string;
  recorded_at: string;
}

export interface HourlyStats {
  hour: number;
  avg: number;
  max: number;
  min: number;
  count: number;
}

export interface DayOfWeekStats {
  day_of_week: number;
  avg: number;
  max: number;
  min: number;
}

function rangeWhere(range: "today" | "week" | "month" | "all"): string {
  switch (range) {
    case "today":
      return "AND recorded_at >= date('now', '+9 hours')";
    case "week":
      return "AND recorded_at >= date('now', '+9 hours', '-7 days')";
    case "month":
      return "AND recorded_at >= date('now', '+9 hours', '-30 days')";
    case "all":
      return "";
  }
}

function rowTo<T>(row: Row): T {
  return row as unknown as T;
}

export async function insertOccupancy(
  storeId: string,
  count: number,
  statusText: string
): Promise<void> {
  const db = await getDb();
  await db.execute({
    sql: "INSERT INTO occupancy (store_id, count, status_text) VALUES (?, ?, ?)",
    args: [storeId, count, statusText],
  });
}

export async function getOccupancyByRange(
  storeId: string,
  range: "today" | "week" | "month" | "all"
): Promise<OccupancyRecord[]> {
  const db = await getDb();
  const where = rangeWhere(range);
  const result = await db.execute({
    sql: `SELECT * FROM occupancy WHERE store_id = ? ${where} ORDER BY recorded_at ASC`,
    args: [storeId],
  });
  return result.rows.map((r) => rowTo<OccupancyRecord>(r));
}

export async function getHourlyStats(
  storeId: string,
  range: "today" | "week" | "month" | "all"
): Promise<HourlyStats[]> {
  const db = await getDb();
  const where = rangeWhere(range);
  const result = await db.execute({
    sql: `SELECT
      CAST(strftime('%H', recorded_at) AS INTEGER) as hour,
      ROUND(AVG(count), 1) as avg,
      MAX(count) as max,
      MIN(count) as min,
      COUNT(*) as count
    FROM occupancy
    WHERE store_id = ? ${where}
    GROUP BY hour
    ORDER BY hour`,
    args: [storeId],
  });
  return result.rows.map((r) => rowTo<HourlyStats>(r));
}

export async function getDayOfWeekStats(
  storeId: string,
  range: "month" | "all"
): Promise<DayOfWeekStats[]> {
  const db = await getDb();
  const where =
    range === "month"
      ? "AND recorded_at >= date('now', '+9 hours', '-30 days')"
      : "";
  const result = await db.execute({
    sql: `SELECT
      CAST(strftime('%w', recorded_at) AS INTEGER) as day_of_week,
      ROUND(AVG(count), 1) as avg,
      MAX(count) as max,
      MIN(count) as min
    FROM occupancy
    WHERE store_id = ? ${where}
    GROUP BY day_of_week
    ORDER BY day_of_week`,
    args: [storeId],
  });
  return result.rows.map((r) => rowTo<DayOfWeekStats>(r));
}

export async function getOverallStats(
  storeId: string,
  range: "today" | "week" | "month" | "all"
): Promise<{ avg: number; max: number; min: number; total_records: number } | null> {
  const db = await getDb();
  const where = rangeWhere(range);
  const result = await db.execute({
    sql: `SELECT
      ROUND(AVG(count), 1) as avg,
      MAX(count) as max,
      MIN(count) as min,
      COUNT(*) as total_records
    FROM occupancy
    WHERE store_id = ? ${where}`,
    args: [storeId],
  });
  if (result.rows.length === 0) return null;
  return rowTo<{ avg: number; max: number; min: number; total_records: number }>(
    result.rows[0]!
  );
}

export async function getLatestOccupancy(
  storeId: string
): Promise<OccupancyRecord | null> {
  const db = await getDb();
  const result = await db.execute({
    sql: "SELECT * FROM occupancy WHERE store_id = ? ORDER BY recorded_at DESC LIMIT 1",
    args: [storeId],
  });
  if (result.rows.length === 0) return null;
  return rowTo<OccupancyRecord>(result.rows[0]!);
}

export async function getStores(): Promise<{ id: string; name: string; prefecture: string }[]> {
  const db = await getDb();
  const result = await db.execute({
    sql: "SELECT id, name, prefecture FROM stores ORDER BY CAST(id AS INTEGER)",
    args: [],
  });
  return result.rows.map((r) => rowTo<{ id: string; name: string; prefecture: string }>(r));
}

export async function upsertStore(id: string, name: string, prefecture: string): Promise<void> {
  const db = await getDb();
  await db.execute({
    sql: "INSERT INTO stores (id, name, prefecture) VALUES (?, ?, ?) ON CONFLICT(id) DO UPDATE SET name=excluded.name, prefecture=excluded.prefecture",
    args: [id, name, prefecture],
  });
}

export async function getAllLatestOccupancy(): Promise<OccupancyRecord[]> {
  const db = await getDb();
  const result = await db.execute({
    sql: `SELECT o.* FROM occupancy o
      WHERE o.id IN (SELECT MAX(id) FROM occupancy GROUP BY store_id)
      ORDER BY o.count DESC`,
    args: [],
  });
  return result.rows.map((r) => rowTo<OccupancyRecord>(r));
}

export async function getCachedAnalysis(
  storeId: string
): Promise<{ analysis_text: string; created_at: string } | null> {
  const db = await getDb();
  const result = await db.execute({
    sql: `SELECT analysis_text, created_at FROM analysis_cache
     WHERE store_id = ? AND created_at >= date('now', '+9 hours')
     ORDER BY created_at DESC LIMIT 1`,
    args: [storeId],
  });
  if (result.rows.length === 0) return null;
  return rowTo<{ analysis_text: string; created_at: string }>(result.rows[0]!);
}

export async function saveAnalysisCache(
  storeId: string,
  analysisText: string,
  dataRange: string
): Promise<void> {
  const db = await getDb();
  await db.execute({
    sql: "INSERT INTO analysis_cache (store_id, analysis_text, data_range) VALUES (?, ?, ?)",
    args: [storeId, analysisText, dataRange],
  });
}
