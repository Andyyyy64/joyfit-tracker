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

export type Range = "today" | "week" | "month" | "all";

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json() as Promise<T>;
}

export const api = {
  getCurrent: () =>
    fetchJson<{ data: OccupancyRecord | null }>("/api/current"),

  getOccupancy: (range: Range) =>
    fetchJson<{ data: OccupancyRecord[] }>(`/api/occupancy?range=${range}`),

  getStats: (range: Range) =>
    fetchJson<StatsResponse>(`/api/stats?range=${range}`),
};
