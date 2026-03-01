import { fetchStoreStatus, parseCount } from "./api.js";
import { insertOccupancy, initDb } from "./db.js";

const JWT_TOKEN = process.env.JWT_TOKEN;
const STORE_ID = process.env.STORE_ID || "223";
const INTERVAL_MS = 60 * 1000; // 1分

if (!JWT_TOKEN) {
  console.error("JWT_TOKEN が設定されていません (.env を確認してください)");
  process.exit(1);
}

await initDb();

console.log(`Joyfit Tracker - データ収集開始`);
console.log(`   店舗ID: ${STORE_ID}`);
console.log(`   間隔: ${INTERVAL_MS / 1000}秒`);
console.log(`   開始時刻: ${new Date().toLocaleString("ja-JP")}`);
console.log("---");

let consecutiveErrors = 0;
const MAX_CONSECUTIVE_ERRORS = 10;

async function collect() {
  try {
    const status = await fetchStoreStatus(STORE_ID, JWT_TOKEN!);
    const count = parseCount(status.status);

    await insertOccupancy(STORE_ID, count, status.status);

    const now = new Date().toLocaleString("ja-JP");
    console.log(`[${now}] ${status.status} (${count}人)`);
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
      console.error("   .env の JWT_TOKEN を更新してください。");
      process.exit(1);
    }
  }
}

// 初回即実行
await collect();

// 1分間隔で繰り返し
setInterval(collect, INTERVAL_MS);
