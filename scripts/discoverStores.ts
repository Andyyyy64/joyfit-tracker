#!/usr/bin/env bun
/**
 * JOYFIT24 全店舗取得スクリプト
 * 公式APIから全店舗リストを取得してDBに登録する
 *
 * 使い方:
 *   bun run discover
 */
import { initDb, upsertStore, getStores } from "../src/db.js";

const BASE_URL = "https://wf-member-app-prod.neopa.jp";
const APP_VERSION = "joyfit-android-1.47";

interface StoreItem {
  store_id: string;
  brand: string;
  store_name: string;
  href?: string;
}

interface RegionNode {
  label?: string;
  store_id?: string;
  brand?: string;
  store_name?: string;
  contents?: RegionNode[] | StoreItem[];
}

// ネストされた地域ツリーから店舗を再帰的にフラット化
function flattenStores(nodes: RegionNode[]): StoreItem[] {
  const result: StoreItem[] = [];
  for (const node of nodes) {
    if (node.store_id) {
      result.push(node as StoreItem);
    } else if (node.contents) {
      result.push(...flattenStores(node.contents as RegionNode[]));
    }
  }
  return result;
}

console.log("=== JOYFIT24 全店舗取得 ===");

await initDb();

const res = await fetch(`${BASE_URL}/member/stores?appType=joyfit`, {
  headers: { "x-wfapp-version": APP_VERSION },
});

if (!res.ok) {
  console.error(`APIエラー: ${res.status} ${res.statusText}`);
  process.exit(1);
}

const json = (await res.json()) as { data: RegionNode[] };
const stores = flattenStores(json.data);

console.log(`取得した店舗数: ${stores.length}店舗\n`);

for (const store of stores) {
  const name = `${store.brand} ${store.store_name}`;
  await upsertStore(store.store_id, name);
  console.log(`  ${store.store_id.padStart(4)}: ${name}`);
}

const registered = await getStores();
console.log(`\nDB登録完了: ${registered.length}店舗`);
