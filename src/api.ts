const BASE_URL = "https://wf-member-app-prod.neopa.jp";
const APP_VERSION = "joyfit-android-1.47";

export interface StoreStatus {
  store_id: string;
  status: string;
}

export interface StoreStatusResponse {
  data: StoreStatus[];
}

export async function fetchStoreStatus(
  storeId: string,
  jwtToken: string
): Promise<StoreStatus> {
  const url = `${BASE_URL}/member/store-status?store_id=${storeId}`;

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${jwtToken}`,
      "x-wfapp-version": APP_VERSION,
    },
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(
      `API error: ${res.status} ${res.statusText} - ${body}`
    );
  }

  const json = (await res.json()) as StoreStatusResponse;

  if (!json.data || json.data.length === 0) {
    throw new Error("API returned empty data");
  }

  return json.data[0]!;
}

/**
 * "77人来館中" → 77
 */
export function parseCount(status: string): number {
  const match = status.match(/(\d+)/);
  if (!match) {
    throw new Error(`ステータスから人数を抽出できません: "${status}"`);
  }
  return parseInt(match[1]!, 10);
}
