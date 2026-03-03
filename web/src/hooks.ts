import { useState, useEffect, useCallback } from "react";
import { api, type Range, type OccupancyRecord, type StatsResponse, type Store } from "./api";

export function useStores() {
  const [data, setData] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    try {
      const res = await api.getStores();
      setData(res.data);
    } catch (e) {
      console.error("Failed to fetch stores:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch();
    const interval = setInterval(fetch, 60_000);
    return () => clearInterval(interval);
  }, [fetch]);

  return { data, loading, refetch: fetch };
}

export function useOccupancy(range: Range, storeId?: string) {
  const [data, setData] = useState<OccupancyRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    try {
      const res = await api.getOccupancy(range, storeId);
      setData(res.data);
    } catch (e) {
      console.error("Failed to fetch occupancy:", e);
    } finally {
      setLoading(false);
    }
  }, [range, storeId]);

  useEffect(() => {
    fetch();
    const interval = setInterval(fetch, 60_000);
    return () => clearInterval(interval);
  }, [fetch]);

  return { data, loading, refetch: fetch };
}

export function useCurrent(storeId?: string) {
  const [data, setData] = useState<OccupancyRecord | null>(null);

  const fetch = useCallback(async () => {
    try {
      const res = await api.getCurrent(storeId);
      setData(res.data);
    } catch (e) {
      console.error("Failed to fetch current:", e);
    }
  }, [storeId]);

  useEffect(() => {
    fetch();
    const interval = setInterval(fetch, 60_000);
    return () => clearInterval(interval);
  }, [fetch]);

  return data;
}

export function useStats(range: Range, storeId?: string) {
  const [data, setData] = useState<StatsResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.getStats(range, storeId).then(setData).catch(console.error).finally(() => setLoading(false));
  }, [range, storeId]);

  return { data, loading };
}
