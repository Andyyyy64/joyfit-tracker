import { Hono } from "hono";
import { cors } from "hono/cors";
import {
  getOccupancyByRange,
  getHourlyStats,
  getDayOfWeekStats,
  getOverallStats,
  getLatestOccupancy,
  getAllLatestOccupancy,
  getStores,
  upsertStore,
  insertOccupancy,
  initDb,
} from "./db.js";
import { fetchStoreStatus, parseCount } from "./api.js";

const DEFAULT_STORE_ID = process.env.STORE_ID || "223";
const BASE_URL = "https://wf-member-app-prod.neopa.jp";
const APP_VERSION = "joyfit-android-1.47";

// 全店舗をJOYFIT APIから取得してDBに登録
async function syncStoresFromApi(): Promise<string[]> {
  const res = await fetch(`${BASE_URL}/member/stores?appType=joyfit`, {
    headers: { "x-wfapp-version": APP_VERSION },
  });
  if (!res.ok) throw new Error(`stores API error: ${res.status}`);

  const json = (await res.json()) as { data: unknown[] };

  function flatten(nodes: unknown[]): { id: string; name: string }[] {
    const result: { id: string; name: string }[] = [];
    for (const node of nodes as Record<string, unknown>[]) {
      if (node.store_id) {
        result.push({
          id: node.store_id as string,
          name: `${node.brand} ${node.store_name}`,
        });
      } else if (node.contents) {
        result.push(...flatten(node.contents as unknown[]));
      }
    }
    return result;
  }

  const stores = flatten(json.data);
  await Promise.all(stores.map((s) => upsertStore(s.id, s.name)));
  return stores.map((s) => s.id);
}

// バッチ処理: 配列をN個ずつに分割して順次実行
async function collectInBatches(
  storeIds: string[],
  jwtToken: string,
  batchSize: number
): Promise<{ successes: number; errors: string[] }> {
  let successes = 0;
  const errors: string[] = [];

  for (let i = 0; i < storeIds.length; i += batchSize) {
    const batch = storeIds.slice(i, i + batchSize);
    const results = await Promise.allSettled(
      batch.map(async (storeId) => {
        const status = await fetchStoreStatus(storeId, jwtToken);
        const count = parseCount(status.status);
        await insertOccupancy(storeId, count, status.status);
        return storeId;
      })
    );
    successes += results.filter((r) => r.status === "fulfilled").length;
    errors.push(
      ...results
        .filter((r) => r.status === "rejected")
        .map((r) => (r as PromiseRejectedResult).reason?.message)
    );
  }

  return { successes, errors };
}

export const app = new Hono();

app.use("/api/*", cors());

// 全店舗一覧（最新混雑状況付き）
app.get("/api/stores", async (c) => {
  const [stores, latest] = await Promise.all([
    getStores(),
    getAllLatestOccupancy(),
  ]);
  const latestMap = new Map(latest.map((r) => [r.store_id, r]));
  const data = stores.map((s) => {
    const rec = latestMap.get(s.id);
    return {
      ...s,
      count: rec?.count,
      status_text: rec?.status_text,
      recorded_at: rec?.recorded_at,
    };
  });
  return c.json({ data });
});

// 最新の混雑状況
app.get("/api/current", async (c) => {
  const storeId = c.req.query("store_id") || DEFAULT_STORE_ID;
  const latest = await getLatestOccupancy(storeId);
  return c.json({ data: latest });
});

// 時系列データ
app.get("/api/occupancy", async (c) => {
  const storeId = c.req.query("store_id") || DEFAULT_STORE_ID;
  const range = (c.req.query("range") || "today") as
    | "today"
    | "week"
    | "month"
    | "all";
  const data = await getOccupancyByRange(storeId, range);
  return c.json({ data });
});

// 統計データ
app.get("/api/stats", async (c) => {
  const storeId = c.req.query("store_id") || DEFAULT_STORE_ID;
  const range = (c.req.query("range") || "week") as
    | "today"
    | "week"
    | "month"
    | "all";
  const [overall, hourly, dayOfWeek] = await Promise.all([
    getOverallStats(storeId, range),
    getHourlyStats(storeId, range),
    getDayOfWeekStats(
      storeId,
      range === "today" || range === "week" ? "month" : range
    ),
  ]);
  return c.json({ overall, hourly, dayOfWeek });
});

// Vercel Cron / 手動データ収集エンドポイント
app.get("/api/collect", async (c) => {
  const authHeader = c.req.header("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const jwtToken = process.env.JWT_TOKEN;
  if (!jwtToken) {
    return c.json({ error: "JWT_TOKEN not configured" }, 500);
  }

  await initDb();

  // storesテーブルが空なら自動でJOYFIT APIから全店舗取得
  let storeIds: string[];
  const existingStores = await getStores();
  if (existingStores.length === 0) {
    storeIds = await syncStoresFromApi();
  } else {
    storeIds = existingStores.map((s) => s.id);
  }

  // 50件ずつバッチ処理（Vercel 10秒タイムアウト対策）
  const BATCH_SIZE = 50;
  const { successes, errors } = await collectInBatches(storeIds, jwtToken, BATCH_SIZE);

  return c.json({
    ok: true,
    total: storeIds.length,
    collected: successes,
    errors: errors.length > 0 ? errors : undefined,
  });
});
