import { useState } from "react";
import type { Range, Store } from "./api";
import { useOccupancy, useCurrent, useStats, useStores } from "./hooks";
import { OccupancyChart } from "./components/OccupancyChart";
import { StatsPanel } from "./components/StatsPanel";
import { JapanMap } from "./components/JapanMap";
import { FavoriteBar } from "./components/FavoriteBar";
import { PrefecturePanel } from "./components/PrefecturePanel";
import { StoreRanking } from "./components/StoreRanking";
import { PrefectureRanking } from "./components/PrefectureRanking";
import { SearchBar } from "./components/SearchBar";
import { useFavorites } from "./hooks/useFavorites";

const RANGES: { value: Range; label: string }[] = [
  { value: "today", label: "今日" },
  { value: "week", label: "1週間" },
  { value: "month", label: "1ヶ月" },
  { value: "all", label: "全期間" },
];

function getCrowdColor(count: number | undefined): string {
  if (count === undefined) return "#475569";
  if (count < 20) return "#22c55e";
  if (count < 40) return "#f59e0b";
  return "#ef4444";
}

function StoreDetailView({
  storeId,
  stores,
  onBack,
  range,
  onRangeChange,
  isFavorite,
  onToggleFavorite,
}: {
  storeId: string;
  stores: Store[];
  onBack: () => void;
  range: Range;
  onRangeChange: (r: Range) => void;
  isFavorite: (id: string) => boolean;
  onToggleFavorite: (id: string) => void;
}) {
  const store = stores.find((s) => s.id === storeId);
  const current = useCurrent(storeId);
  const { data: occupancy, loading: occLoading } = useOccupancy(range, storeId);
  const { data: stats, loading: statsLoading } = useStats(range, storeId);

  return (
    <div style={detailStyles.root}>
      <div style={detailStyles.header}>
        <button onClick={onBack} style={detailStyles.backBtn}>
          ← 地図に戻る
        </button>
        <div style={detailStyles.storeTitle}>
          {store?.name ?? `店舗 #${storeId}`}
        </div>
        <button
          onClick={() => onToggleFavorite(storeId)}
          style={{
            ...detailStyles.favBtn,
            color: isFavorite(storeId) ? "#f59e0b" : "#475569",
          }}
          title={isFavorite(storeId) ? "お気に入り解除" : "お気に入り追加"}
        >
          {isFavorite(storeId) ? "★" : "☆"}
        </button>
      </div>

      <div style={detailStyles.body}>
        {current && (
          <div
            style={{
              ...detailStyles.currentBox,
              borderColor: getCrowdColor(current.count) + "44",
            }}
          >
            <div style={{ ...detailStyles.currentCount, color: getCrowdColor(current.count) }}>
              {current.count}
            </div>
            <div style={detailStyles.currentLabel}>人来館中</div>
            <div style={detailStyles.currentTime}>
              {new Date(current.recorded_at.replace(" ", "T")).toLocaleTimeString("ja-JP", {
                hour: "2-digit",
                minute: "2-digit",
              })}
              時点
            </div>
          </div>
        )}

        <div style={detailStyles.rangeBar}>
          {RANGES.map((r) => (
            <button
              key={r.value}
              onClick={() => onRangeChange(r.value)}
              style={{
                ...detailStyles.rangeBtn,
                ...(range === r.value ? detailStyles.rangeActive : {}),
              }}
            >
              {r.label}
            </button>
          ))}
        </div>

        <div style={detailStyles.card}>
          <h2 style={detailStyles.cardTitle}>来館者数推移</h2>
          <OccupancyChart data={occupancy} loading={occLoading} />
        </div>

        <div style={detailStyles.card}>
          <h2 style={detailStyles.cardTitle}>統計データ</h2>
          <StatsPanel data={stats} loading={statsLoading} />
        </div>
      </div>
    </div>
  );
}

export function App() {
  const [selectedPrefecture, setSelectedPrefecture] = useState<string | null>(null);
  const [selectedStoreId, setSelectedStoreId] = useState<string | null>(null);
  const [range, setRange] = useState<Range>("today");
  const { data: stores, loading: storesLoading } = useStores();
  const { favorites, toggleFavorite, isFavorite } = useFavorites();

  const favoriteStores = favorites
    .map((id) => stores.find((s) => s.id === id))
    .filter((s): s is Store => s !== undefined);

  const prefectureStores = selectedPrefecture
    ? stores.filter((s) => s.prefecture === selectedPrefecture)
    : [];

  const totalActive = stores.filter((s) => s.count !== undefined).length;

  function handleStoreSelect(id: string) {
    setSelectedStoreId(id);
    setSelectedPrefecture(null);
  }

  function handlePrefSelect(pref: string) {
    setSelectedPrefecture(pref);
  }

  function handleBack() {
    setSelectedStoreId(null);
  }

  if (selectedStoreId) {
    return (
      <div style={appStyles.root}>
        <style>{globalCSS}</style>
        <StoreDetailView
          storeId={selectedStoreId}
          stores={stores}
          onBack={handleBack}
          range={range}
          onRangeChange={setRange}
          isFavorite={isFavorite}
          onToggleFavorite={toggleFavorite}
        />
      </div>
    );
  }

  return (
    <div style={appStyles.root}>
      <style>{globalCSS}</style>

      {/* Header */}
      <header style={appStyles.header}>
        <div style={appStyles.headerInner}>
          <div style={appStyles.headerLeft}>
            <h1 style={appStyles.title}>JOYFIT24</h1>
            <p style={appStyles.subtitle}>混雑トラッカー</p>
          </div>
          <div style={appStyles.headerRight}>
            <div style={appStyles.liveDot} />
            <span style={appStyles.liveText}>
              {storesLoading
                ? "読み込み中..."
                : `${totalActive} / ${stores.length} 店舗 データあり`}
            </span>
          </div>
        </div>
      </header>

      {/* Favorites Bar */}
      <FavoriteBar
        stores={favoriteStores}
        onStoreSelect={handleStoreSelect}
        onToggleFavorite={toggleFavorite}
      />

      {/* 3-column layout */}
      <main style={appStyles.main}>
        {/* Left: Store Ranking */}
        <div className="sidebar sidebar-left" style={appStyles.sidebar}>
          <StoreRanking
            stores={stores}
            onStoreSelect={handleStoreSelect}
            isFavorite={isFavorite}
            onToggleFavorite={toggleFavorite}
          />
        </div>

        {/* Center: Search + Map */}
        <div style={appStyles.center}>
          <SearchBar
            stores={stores}
            onStoreSelect={handleStoreSelect}
            onPrefectureSelect={handlePrefSelect}
          />
          <div style={appStyles.mapWrapper}>
            <JapanMap
              stores={stores}
              selectedPrefecture={selectedPrefecture}
              onPrefectureSelect={setSelectedPrefecture}
            />
            {stores.length === 0 && !storesLoading && (
              <div style={appStyles.mapOverlay}>
                <p style={{ color: "#64748b", fontSize: 14 }}>店舗データがありません</p>
              </div>
            )}
          </div>
          <p style={appStyles.hint}>都道府県をクリックすると店舗一覧を表示します</p>
        </div>

        {/* Right: Prefecture Ranking */}
        <div className="sidebar sidebar-right" style={appStyles.sidebar}>
          <PrefectureRanking
            stores={stores}
            selectedPrefecture={selectedPrefecture}
            onPrefectureSelect={handlePrefSelect}
          />
        </div>
      </main>

      {/* Prefecture Panel */}
      {selectedPrefecture && (
        <PrefecturePanel
          prefecture={selectedPrefecture}
          stores={prefectureStores}
          onStoreSelect={handleStoreSelect}
          onClose={() => setSelectedPrefecture(null)}
          isFavorite={isFavorite}
          onToggleFavorite={toggleFavorite}
        />
      )}
    </div>
  );
}

const globalCSS = `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: #0f172a; color: #f1f5f9; }
  ::-webkit-scrollbar { width: 4px; height: 4px; }
  ::-webkit-scrollbar-track { background: #0f172a; }
  ::-webkit-scrollbar-thumb { background: #334155; border-radius: 2px; }

  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }

  .main-grid {
    display: grid;
    grid-template-columns: 260px 1fr 260px;
    gap: 16px;
  }

  @media (max-width: 1100px) {
    .main-grid {
      grid-template-columns: 1fr 1fr;
    }
    .sidebar-left { order: 2; }
    .sidebar-right { order: 3; }
    .map-center { order: 1; grid-column: 1 / -1; }
  }

  @media (max-width: 700px) {
    .main-grid {
      grid-template-columns: 1fr;
    }
    .sidebar-left, .sidebar-right { order: unset; }
    .map-center { grid-column: auto; }
  }

  .sidebar {
    position: sticky;
    top: 16px;
    max-height: calc(100vh - 100px);
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }

  @media (max-width: 1100px) {
    .sidebar {
      position: static;
      max-height: 400px;
    }
  }
`;

const appStyles: Record<string, React.CSSProperties> = {
  root: {
    minHeight: "100vh",
    background: "#0f172a",
    fontFamily: "'Inter', 'Noto Sans JP', system-ui, sans-serif",
    color: "#f1f5f9",
  },
  header: {
    background: "linear-gradient(135deg, #1e1b4b 0%, #0f172a 100%)",
    borderBottom: "1px solid #1e293b",
    padding: "16px 0",
  },
  headerInner: {
    maxWidth: 1600,
    margin: "0 auto",
    padding: "0 24px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerLeft: {
    display: "flex",
    alignItems: "baseline",
    gap: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 800,
    color: "#f1f5f9",
    letterSpacing: "-0.5px",
  },
  subtitle: {
    fontSize: 14,
    color: "#6366f1",
    fontWeight: 600,
  },
  headerRight: {
    display: "flex",
    alignItems: "center",
    gap: 8,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: "50%",
    background: "#22c55e",
    boxShadow: "0 0 6px #22c55e",
    animation: "pulse 2s infinite",
  },
  liveText: {
    fontSize: 12,
    color: "#64748b",
  },
  main: {
    maxWidth: 1600,
    margin: "0 auto",
    padding: "20px 24px 40px",
    display: "grid",
    gridTemplateColumns: "260px 1fr 260px",
    gap: 16,
    alignItems: "start",
  },
  sidebar: {
    position: "sticky" as const,
    top: 16,
    maxHeight: "calc(100vh - 100px)",
    overflow: "hidden",
    display: "flex",
    flexDirection: "column" as const,
  },
  center: {
    display: "flex",
    flexDirection: "column" as const,
    gap: 12,
    minWidth: 0,
  },
  mapWrapper: {
    position: "relative" as const,
    borderRadius: 16,
    overflow: "hidden",
    border: "1px solid #1e293b",
    minHeight: 480,
  },
  mapOverlay: {
    position: "absolute" as const,
    inset: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  hint: {
    textAlign: "center" as const,
    fontSize: 12,
    color: "#334155",
  },
};

const detailStyles: Record<string, React.CSSProperties> = {
  root: {
    minHeight: "100vh",
    background: "#0f172a",
    display: "flex",
    flexDirection: "column" as const,
  },
  header: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "16px 20px",
    background: "linear-gradient(135deg, #1e1b4b 0%, #0f172a 100%)",
    borderBottom: "1px solid #1e293b",
    position: "sticky" as const,
    top: 0,
    zIndex: 10,
  },
  backBtn: {
    background: "#1e293b",
    border: "1px solid #334155",
    color: "#94a3b8",
    fontSize: 13,
    fontWeight: 500,
    cursor: "pointer",
    borderRadius: 8,
    padding: "8px 14px",
    flexShrink: 0,
  },
  storeTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: 700,
    color: "#f1f5f9",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap" as const,
  },
  favBtn: {
    background: "transparent",
    border: "none",
    fontSize: 22,
    cursor: "pointer",
    padding: 4,
    flexShrink: 0,
  },
  body: {
    maxWidth: 960,
    width: "100%",
    margin: "0 auto",
    padding: "20px 20px 60px",
    display: "flex",
    flexDirection: "column" as const,
    gap: 20,
  },
  currentBox: {
    background: "#1e293b",
    borderRadius: 14,
    padding: "24px 28px",
    border: "1px solid transparent",
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "flex-start",
    gap: 4,
  },
  currentCount: {
    fontSize: 56,
    fontWeight: 800,
    lineHeight: 1,
    letterSpacing: "-2px",
  },
  currentLabel: {
    fontSize: 14,
    color: "#94a3b8",
  },
  currentTime: {
    fontSize: 11,
    color: "#475569",
  },
  rangeBar: {
    display: "flex",
    gap: 8,
    flexWrap: "wrap" as const,
  },
  rangeBtn: {
    padding: "9px 18px",
    border: "1px solid #334155",
    borderRadius: 8,
    background: "#1e293b",
    color: "#64748b",
    fontSize: 13,
    fontWeight: 500,
    cursor: "pointer",
  },
  rangeActive: {
    background: "#6366f1",
    color: "white",
    borderColor: "#6366f1",
  },
  card: {
    background: "#1e293b",
    borderRadius: 14,
    padding: 24,
    border: "1px solid #334155",
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: 600,
    color: "#e2e8f0",
    marginBottom: 16,
  },
};
