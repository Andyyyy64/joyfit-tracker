import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import type { StatsResponse } from "../api";

interface Props {
  data: StatsResponse | null;
  loading: boolean;
}

const DAY_NAMES = ["日", "月", "火", "水", "木", "金", "土"];
const DAY_COLORS = [
  "#ef4444", // 日 (赤)
  "#64748b",
  "#64748b",
  "#64748b",
  "#64748b",
  "#64748b",
  "#3b82f6", // 土 (青)
];

export function StatsPanel({ data, loading }: Props) {
  if (loading || !data) {
    return <div style={styles.loading}>読み込み中...</div>;
  }

  const { overall, hourly, dayOfWeek } = data;

  return (
    <div style={styles.container}>
      {/* 概要統計 */}
      {overall && (
        <div className="stat-grid" style={styles.overallGrid}>
          <StatCard label="平均" value={`${overall.avg}人`} color="#6366f1" />
          <StatCard label="最大" value={`${overall.max}人`} color="#ef4444" />
          <StatCard label="最小" value={`${overall.min}人`} color="#22c55e" />
          <StatCard label="データ件数" value={`${overall.total_records}`} color="#64748b" />
        </div>
      )}

      {/* 時間帯別 */}
      {hourly.length > 0 && (
        <div style={styles.chartSection}>
          <h3 style={styles.chartTitle}>時間帯別平均</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={hourly} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis
                dataKey="hour"
                tick={{ fontSize: 11, fill: "#64748b" }}
                tickFormatter={(h: number) => `${h}時`}
              />
              <YAxis tick={{ fontSize: 11, fill: "#64748b" }} />
              <Tooltip
                formatter={(value) => [`${value}人`, "平均"]}
                contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 13 }}
              />
              <Bar dataKey="avg" radius={[4, 4, 0, 0]}>
                {hourly.map((entry) => (
                  <Cell
                    key={entry.hour}
                    fill={entry.avg > (overall?.avg ?? 0) ? "#f97316" : "#6366f1"}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* 曜日別 */}
      {dayOfWeek.length > 0 && (
        <div style={styles.chartSection}>
          <h3 style={styles.chartTitle}>曜日別平均</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart
              data={dayOfWeek.map((d) => ({
                ...d,
                name: DAY_NAMES[d.day_of_week],
              }))}
              margin={{ top: 8, right: 16, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#64748b" }} />
              <YAxis tick={{ fontSize: 11, fill: "#64748b" }} />
              <Tooltip
                formatter={(value) => [`${value}人`, "平均"]}
                contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 13 }}
              />
              <Bar dataKey="avg" radius={[4, 4, 0, 0]}>
                {dayOfWeek.map((d) => (
                  <Cell key={d.day_of_week} fill={DAY_COLORS[d.day_of_week]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div style={styles.statCard}>
      <div style={{ ...styles.statValue, color }}>{value}</div>
      <div style={styles.statLabel}>{label}</div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: "flex",
    flexDirection: "column",
    gap: 24,
  },
  loading: {
    padding: 40,
    textAlign: "center",
    color: "#94a3b8",
  },
  overallGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: 12,
  },
  statCard: {
    background: "#f8fafc",
    borderRadius: 10,
    padding: "16px 12px",
    textAlign: "center",
  },
  statValue: {
    fontSize: 24,
    fontWeight: 700,
    lineHeight: 1.2,
  },
  statLabel: {
    fontSize: 12,
    color: "#94a3b8",
    marginTop: 4,
  },
  chartSection: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },
  chartTitle: {
    fontSize: 14,
    fontWeight: 600,
    color: "#334155",
    margin: 0,
  },
};
