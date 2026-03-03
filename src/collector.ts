import { fetchStoreStatus, parseCount } from "./api.js";
import { insertOccupancy, initDb, getStores } from "./db.js";

const JWT_TOKEN = process.env.JWT_TOKEN;
const INTERVAL_MS = 3 * 60 * 1000; // 3分

if (!JWT_TOKEN) {
  console.error("JWT_TOKEN が設定されていません (.env を確認してください)");
  process.exit(1);
}

await initDb();

// 収集対象の店舗IDを決定
// STORE_IDS (カンマ区切り) → STORE_ID → DB の全店舗
async function getTargetStoreIds(): Promise<string[]> {
  if (process.env.STORE_IDS) {
    return process.env.STORE_IDS.split(",").map((s) => s.trim());
  }
  const stores = await getStores();
  if (stores.length > 0) return stores.map((s) => s.id);
  return [process.env.STORE_ID || "223"];
}

const storeIds = await getTargetStoreIds();

console.log(`Joyfit Tracker - データ収集開始`);
console.log(`   対象店舗: ${storeIds.join(", ")} (${storeIds.length}店舗)`);
console.log(`   間隔: ${INTERVAL_MS / 1000 / 60}分`);
console.log(`   開始時刻: ${new Date().toLocaleString("ja-JP")}`);
console.log("---");

let consecutiveErrors = 0;
const MAX_CONSECUTIVE_ERRORS = 10;

async function collectOne(storeId: string): Promise<void> {
  const status = await fetchStoreStatus(storeId, JWT_TOKEN!);
  const count = parseCount(status.status);
  await insertOccupancy(storeId, count, status.status);
  const now = new Date().toLocaleString("ja-JP");
  console.log(`[${now}] 店舗${storeId}: ${status.status}`);
}

async function collect() {
  try {
    await Promise.all(storeIds.map((id) => collectOne(id)));
    consecutiveErrors = 0;
  } catch (err) {
    consecutiveErrors++;
    const now = new Date().toLocaleString("ja-JP");
    console.error(
      `[${now}] エラー (${consecutiveErrors}/${MAX_CONSECUTIVE_ERRORS}):`,
      err instanceof Error ? err.message : err
    );

    if (consecutiveErrors >= MAX_CONSECUTIVE_ERRORS) {
      console.error(
        `${MAX_CONSECUTIVE_ERRORS}回連続エラー。JWTの有効期限切れの可能性があります。`
      );
      process.exit(1);
    }
  }
}

// 初回即実行
await collect();

// 1分間隔で繰り返し
setInterval(collect, INTERVAL_MS);
