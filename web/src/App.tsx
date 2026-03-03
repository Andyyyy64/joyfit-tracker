import { useState } from "react";
import type { Range, Store } from "./api";
import { useOccupancy, useCurrent, useStats, useStores } from "./hooks";
import { OccupancyChart } from "./components/OccupancyChart";
import { StatsPanel } from "./components/StatsPanel";
import { StoreSelector } from "./components/StoreSelector";

const RANGES: { value: Range; label: string }[] = [
  { value: "today", label: "今日" },
  { value: "week", label: "1週間" },
  { value: "month", label: "1ヶ月" },
  { value: "all", label: "全期間" },
];

// 混雑度に応じた色 (緑 → 黄 → 赤)
function getCrowdColor(count: number | undefined): string {
  if (count === undefined) return "#94a3b8";
  if (count < 20) return "#22c55e";
  if (count < 40) return "#f59e0b";
  return "#ef4444";
}

function AllStoresView({ stores }: { stores: Store[] }) {
  if (stores.length === 0) {
    return (
      <div style={styles.emptyState}>
        <p>店舗データがありません</p>
        <p style={{ fontSize: 13, color: "#94a3b8", marginTop: 8 }}>
          <code>bun run discover</code> を実行して店舗を登録してください
        </p>
      </div>
    );
  }

  return (
    <div className="stores-grid" style={styles.storesGrid}>
      {stores.map((store) => (
        <div key={store.id} style={styles.storeCard}>
          <div
            style={{
              ...styles.storeCount,
              color: getCrowdColor(store.count),
            }}
          >
            {store.count !== undefined ? store.count : "—"}
          </div>
          <div style={styles.storeCountLabel}>人来館中</div>
          <div style={styles.storeName}>{store.name}</div>
          {store.recorded_at && (
            <div style={styles.storeTime}>
              {new Date(store.recorded_at.replace(" ", "T")).toLocaleTimeString("ja-JP", {
                hour: "2-digit",
                minute: "2-digit",
              })}
              時点
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function StoreDetailView({
  storeId,
  storeName,
  range,
}: {
  storeId: string;
  storeName: string;
  range: Range;
}) {
  const current = useCurrent(storeId);
  const { data: occupancy, loading: occLoading } = useOccupancy(range, storeId);
  const { data: stats, loading: statsLoading } = useStats(range, storeId);

  return (
    <>
      {current && (
        <div className="current-box" style={styles.currentBox}>
          <div style={styles.currentCount}>{current.count}</div>
          <div style={styles.currentLabel}>人来館中</div>
          <div style={styles.currentTime}>
            {new Date(current.recorded_at.replace(" ", "T")).toLocaleTimeString("ja-JP", {
              hour: "2-digit",
              minute: "2-digit",
            })}
            時点
          </div>
        </div>
      )}

      <section className="card" style={styles.card}>
        <h2 style={styles.cardTitle}>来館者数推移 — {storeName}</h2>
        <OccupancyChart data={occupancy} loading={occLoading} />
      </section>

      <section className="card" style={styles.card}>
        <h2 style={styles.cardTitle}>統計データ — {storeName}</h2>
        <StatsPanel data={stats} loading={statsLoading} />
      </section>
    </>
  );
}

export function App() {
  const [range, setRange] = useState<Range>("today");
  const [selectedStoreId, setSelectedStoreId] = useState<string | null>(null);
  const { data: stores } = useStores();

  const selectedStore = stores.find((s) => s.id === selectedStoreId) ?? null;
  const isOverview = selectedStoreId === null;

  return (
    <div style={styles.root}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #f1f5f9; }
        @media (max-width: 600px) {
          .header-inner { flex-direction: column; gap: 12px; text-align: center; }
          .current-box { text-align: center !important; }
          .range-bar { flex-wrap: wrap; justify-content: center; }
          .range-btn { flex: 1; min-width: 70px; padding: 10px 8px !important; }
          .card { padding: 16px !important; }
          .stat-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .stores-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }
      `}</style>

      {/* Header */}
      <header style={styles.header}>
        <div className="header-inner" style={styles.headerInner}>
          <div>
            <h1 style={styles.title}>JOYFIT24 混雑トラッカー</h1>
            <p style={styles.subtitle}>
              {stores.length > 0 ? `${stores.length}店舗を追跡中` : "読み込み中..."}
            </p>
          </div>
          {selectedStore && (
            <div className="current-box" style={{ textAlign: "right" }}>
              <div style={{ fontSize: 13, opacity: 0.8, marginBottom: 4 }}>
                {selectedStore.name}
              </div>
            </div>
          )}
        </div>
      </header>

      <main style={styles.main}>
        {/* 店舗セレクター */}
        <StoreSelector
          stores={stores}
          selectedId={selectedStoreId}
          onChange={setSelectedStoreId}
        />

        {/* 全店舗一覧 or 個別店舗ビュー */}
        {isOverview ? (
          <section className="card" style={styles.card}>
            <h2 style={styles.cardTitle}>全店舗 現在の混雑状況</h2>
            <AllStoresView stores={stores} />
          </section>
        ) : (
          <>
            {/* レンジセレクター (個別店舗のみ) */}
            <div className="range-bar" style={styles.rangeBar}>
              {RANGES.map((r) => (
                <button
                  key={r.value}
                  onClick={() => setRange(r.value)}
                  className="range-btn"
                  style={{
                    ...styles.rangeButton,
                    ...(range === r.value ? styles.rangeActive : {}),
                  }}
                >
                  {r.label}
                </button>
              ))}
            </div>

            {selectedStoreId && (
              <StoreDetailView
                storeId={selectedStoreId}
                storeName={selectedStore?.name ?? `店舗 #${selectedStoreId}`}
                range={range}
              />
            )}
          </>
        )}
      </main>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  root: {
    fontFamily: "'Inter', 'Noto Sans JP', sans-serif",
    minHeight: "100vh",
  },
  header: {
    background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
    color: "white",
    padding: "24px 0",
  },
  headerInner: {
    maxWidth: 960,
    margin: "0 auto",
    padding: "0 20px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: {
    fontSize: 22,
    fontWeight: 700,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 13,
    opacity: 0.8,
    marginTop: 2,
  },
  currentBox: {
    textAlign: "right" as const,
  },
  currentCount: {
    fontSize: 40,
    fontWeight: 700,
    lineHeight: 1,
  },
  currentLabel: {
    fontSize: 13,
    opacity: 0.85,
  },
  currentTime: {
    fontSize: 11,
    opacity: 0.6,
    marginTop: 2,
  },
  main: {
    maxWidth: 960,
    margin: "0 auto",
    padding: "20px 20px 60px",
    display: "flex",
    flexDirection: "column" as const,
    gap: 20,
  },
  rangeBar: {
    display: "flex",
    gap: 8,
  },
  rangeButton: {
    padding: "8px 18px",
    border: "1px solid #e2e8f0",
    borderRadius: 8,
    background: "white",
    color: "#64748b",
    fontSize: 13,
    fontWeight: 500,
    cursor: "pointer",
    transition: "all 0.15s",
  },
  rangeActive: {
    background: "#6366f1",
    color: "white",
    borderColor: "#6366f1",
  },
  card: {
    background: "white",
    borderRadius: 14,
    padding: 24,
    boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)",
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 600,
    color: "#1e293b",
    marginBottom: 16,
  },
  storesGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: 12,
  },
  storeCard: {
    background: "#f8fafc",
    borderRadius: 10,
    padding: "16px 12px",
    textAlign: "center" as const,
  },
  storeCount: {
    fontSize: 32,
    fontWeight: 700,
    lineHeight: 1.1,
  },
  storeCountLabel: {
    fontSize: 11,
    color: "#94a3b8",
    marginTop: 2,
  },
  storeName: {
    fontSize: 12,
    color: "#475569",
    fontWeight: 500,
    marginTop: 8,
  },
  storeTime: {
    fontSize: 10,
    color: "#94a3b8",
    marginTop: 2,
  },
  emptyState: {
    padding: 40,
    textAlign: "center" as const,
    color: "#64748b",
  },
};
