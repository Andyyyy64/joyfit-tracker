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

export interface OverallStats {
  avg: number;
  max: number;
  min: number;
  total_records: number;
}

export interface StatsResponse {
  overall: OverallStats | null;
  hourly: HourlyStats[];
  dayOfWeek: DayOfWeekStats[];
}

export interface Store {
  id: string;
  name: string;
  count?: number;
  status_text?: string;
  recorded_at?: string;
}

export type Range = "today" | "week" | "month" | "all";

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json() as Promise<T>;
}

function qs(params: Record<string, string | undefined>): string {
  const entries = Object.entries(params).filter(([, v]) => v !== undefined);
  if (entries.length === 0) return "";
  return "?" + entries.map(([k, v]) => `${k}=${encodeURIComponent(v!)}`).join("&");
}

export const api = {
  getStores: () =>
    fetchJson<{ data: Store[] }>("/api/stores"),

  getCurrent: (storeId?: string) =>
    fetchJson<{ data: OccupancyRecord | null }>(`/api/current${qs({ store_id: storeId })}`),

  getOccupancy: (range: Range, storeId?: string) =>
    fetchJson<{ data: OccupancyRecord[] }>(`/api/occupancy${qs({ range, store_id: storeId })}`),

  getStats: (range: Range, storeId?: string) =>
    fetchJson<StatsResponse>(`/api/stats${qs({ range, store_id: storeId })}`),
};
