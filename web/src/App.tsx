import { useState } from "react";
import type { Range } from "./api";
import { useOccupancy, useCurrent, useStats } from "./hooks";
import { OccupancyChart } from "./components/OccupancyChart";
import { StatsPanel } from "./components/StatsPanel";

const RANGES: { value: Range; label: string }[] = [
  { value: "today", label: "今日" },
  { value: "week", label: "1週間" },
  { value: "month", label: "1ヶ月" },
  { value: "all", label: "全期間" },
];

export function App() {
  const [range, setRange] = useState<Range>("today");
  const current = useCurrent();
  const { data: occupancy, loading: occLoading } = useOccupancy(range);
  const { data: stats, loading: statsLoading } = useStats(range);

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
        }
      `}</style>

      {/* Header */}
      <header style={styles.header}>
        <div className="header-inner" style={styles.headerInner}>
          <div>
            <h1 style={styles.title}>JOYFIT24 会津インター</h1>
            <p style={styles.subtitle}>混雑トラッカー</p>
          </div>
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
        </div>
      </header>

      <main style={styles.main}>
        {/* Range selector */}
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

        {/* Chart */}
        <section className="card" style={styles.card}>
          <h2 style={styles.cardTitle}>来館者数推移</h2>
          <OccupancyChart data={occupancy} loading={occLoading} />
        </section>

        {/* Stats */}
        <section className="card" style={styles.card}>
          <h2 style={styles.cardTitle}>統計データ</h2>
          <StatsPanel data={stats} loading={statsLoading} />
        </section>

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
};
