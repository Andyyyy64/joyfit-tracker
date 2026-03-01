import { useState, useEffect, useCallback } from "react";
import { api, type Range, type OccupancyRecord, type StatsResponse } from "./api";

export function useOccupancy(range: Range) {
  const [data, setData] = useState<OccupancyRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    try {
      const res = await api.getOccupancy(range);
      setData(res.data);
    } catch (e) {
      console.error("Failed to fetch occupancy:", e);
    } finally {
      setLoading(false);
    }
  }, [range]);

  useEffect(() => {
    fetch();
    const interval = setInterval(fetch, 60_000);
    return () => clearInterval(interval);
  }, [fetch]);

  return { data, loading, refetch: fetch };
}

export function useCurrent() {
  const [data, setData] = useState<OccupancyRecord | null>(null);

  const fetch = useCallback(async () => {
    try {
      const res = await api.getCurrent();
      setData(res.data);
    } catch (e) {
      console.error("Failed to fetch current:", e);
    }
  }, []);

  useEffect(() => {
    fetch();
    const interval = setInterval(fetch, 60_000);
    return () => clearInterval(interval);
  }, [fetch]);

  return data;
}

export function useStats(range: Range) {
  const [data, setData] = useState<StatsResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.getStats(range).then(setData).catch(console.error).finally(() => setLoading(false));
  }, [range]);

  return { data, loading };
}

