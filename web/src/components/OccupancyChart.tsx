import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import type { OccupancyRecord } from "../api";

interface Props {
  data: OccupancyRecord[];
  loading: boolean;
}

function formatTime(recorded_at: string): string {
  const d = new Date(recorded_at.replace(" ", "T"));
  return `${d.getHours()}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function formatDate(recorded_at: string): string {
  const d = new Date(recorded_at.replace(" ", "T"));
  return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export function OccupancyChart({ data, loading }: Props) {
  if (loading) {
    return <div style={styles.loading}>読み込み中...</div>;
  }

  if (data.length === 0) {
    return <div style={styles.empty}>データがありません</div>;
  }

  const avg =
    data.reduce((sum, d) => sum + d.count, 0) / data.length;
  const isMultiDay =
    data.length > 0 &&
    new Date(data[0]!.recorded_at.replace(" ", "T")).getDate() !==
      new Date(data[data.length - 1]!.recorded_at.replace(" ", "T")).getDate();

  const chartData = data.map((d) => ({
    time: isMultiDay ? formatDate(d.recorded_at) : formatTime(d.recorded_at),
    count: d.count,
  }));

  return (
    <div style={styles.container}>
      <ResponsiveContainer width="100%" height={320}>
        <LineChart data={chartData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis
            dataKey="time"
            tick={{ fontSize: 11, fill: "#64748b" }}
            interval="preserveStartEnd"
          />
          <YAxis
            tick={{ fontSize: 11, fill: "#64748b" }}
            label={{
              value: "人数",
              angle: -90,
              position: "insideLeft",
              style: { fontSize: 12, fill: "#64748b" },
            }}
          />
          <Tooltip
            contentStyle={{
              borderRadius: 8,
              border: "1px solid #e2e8f0",
              fontSize: 13,
            }}
            formatter={(value) => [`${value}人`, "来館者数"]}
          />
          <ReferenceLine
            y={Math.round(avg)}
            stroke="#94a3b8"
            strokeDasharray="4 4"
            label={{
              value: `平均 ${Math.round(avg)}人`,
              position: "right",
              style: { fontSize: 11, fill: "#94a3b8" },
            }}
          />
          <Line
            type="monotone"
            dataKey="count"
            stroke="#6366f1"
            strokeWidth={2}
            dot={data.length < 120}
            activeDot={{ r: 5, fill: "#6366f1" }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    width: "100%",
  },
  loading: {
    padding: 40,
    textAlign: "center",
    color: "#94a3b8",
  },
  empty: {
    padding: 40,
    textAlign: "center",
    color: "#94a3b8",
  },
};
