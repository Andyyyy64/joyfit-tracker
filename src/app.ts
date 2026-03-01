import { Hono } from "hono";
import { cors } from "hono/cors";
import {
  getOccupancyByRange,
  getHourlyStats,
  getDayOfWeekStats,
  getOverallStats,
  getLatestOccupancy,
  insertOccupancy,
  initDb,
} from "./db.js";
import { fetchStoreStatus, parseCount } from "./api.js";

const STORE_ID = process.env.STORE_ID || "223";

export const app = new Hono();

app.use("/api/*", cors());

// 最新の混雑状況
app.get("/api/current", async (c) => {
  const latest = await getLatestOccupancy(STORE_ID);
  return c.json({ data: latest });
});

// 時系列データ
app.get("/api/occupancy", async (c) => {
  const range = (c.req.query("range") || "today") as
    | "today"
    | "week"
    | "month"
    | "all";
  const data = await getOccupancyByRange(STORE_ID, range);
  return c.json({ data });
});

// 統計データ
app.get("/api/stats", async (c) => {
  const range = (c.req.query("range") || "week") as
    | "today"
    | "week"
    | "month"
    | "all";
  const [overall, hourly, dayOfWeek] = await Promise.all([
    getOverallStats(STORE_ID, range),
    getHourlyStats(STORE_ID, range),
    getDayOfWeekStats(
      STORE_ID,
      range === "today" || range === "week" ? "month" : range
    ),
  ]);
  return c.json({ overall, hourly, dayOfWeek });
});

// Vercel Cron / 手動データ収集エンドポイント
app.get("/api/collect", async (c) => {
  const authHeader = c.req.header("authorization");
  const cronSecret = process.env.CRON_SECRET;

  // Vercel Cron は CRON_SECRET で認証
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const jwtToken = process.env.JWT_TOKEN;
  if (!jwtToken) {
    return c.json({ error: "JWT_TOKEN not configured" }, 500);
  }

  try {
    await initDb();
    const status = await fetchStoreStatus(STORE_ID, jwtToken);
    const count = parseCount(status.status);
    await insertOccupancy(STORE_ID, count, status.status);
    return c.json({ ok: true, count, status: status.status });
  } catch (err) {
    return c.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      500
    );
  }
});
