import { useMemo } from "react";
import type { Store } from "../api";

function getCrowdColor(avg: number): string {
  if (avg < 20) return "#22c55e";
  if (avg < 40) return "#f59e0b";
  return "#ef4444";
}

function getCrowdBar(avg: number): string {
  if (avg < 20) return "#166534";
  if (avg < 40) return "#92400e";
  return "#7f1d1d";
}

interface PrefStat {
  prefecture: string;
  avg: number;
  max: number;
  storeCount: number;
  dataCount: number;
}

interface Props {
  stores: Store[];
  selectedPrefecture: string | null;
  onPrefectureSelect: (pref: string) => void;
}

export function PrefectureRanking({ stores, selectedPrefecture, onPrefectureSelect }: Props) {
  const prefStats = useMemo((): PrefStat[] => {
    const map = new Map<string, number[]>();
    for (const s of stores) {
      if (!s.prefecture) continue;
      const arr = map.get(s.prefecture) ?? [];
      if (s.count !== undefined) arr.push(s.count);
      map.set(s.prefecture, arr);
    }

    const totalByPref = new Map<string, number>();
    for (const s of stores) {
      if (!s.prefecture) continue;
      totalByPref.set(s.prefecture, (totalByPref.get(s.prefecture) ?? 0) + 1);
    }

    return Array.from(map.entries())
      .filter(([, counts]) => counts.length > 0)
      .map(([pref, counts]) => ({
        prefecture: pref,
        avg: counts.reduce((a, b) => a + b, 0) / counts.length,
        max: Math.max(...counts),
        storeCount: totalByPref.get(pref) ?? counts.length,
        dataCount: counts.length,
      }))
      .sort((a, b) => b.avg - a.avg);
  }, [stores]);

  const maxAvg = prefStats.length > 0 ? prefStats[0]!.avg : 1;

  return (
    <div style={panelStyle}>
      <div style={headerStyle}>
        <span style={titleStyle}>県別ランキング</span>
        <span style={subtitleStyle}>混雑平均順</span>
      </div>

      <div style={listStyle}>
        {prefStats.length === 0 ? (
          <div style={emptyStyle}>データなし</div>
        ) : (
          prefStats.map((p, i) => {
            const isSelected = selectedPrefecture === p.prefecture;
            const barWidth = Math.round((p.avg / maxAvg) * 100);
            return (
              <button
                key={p.prefecture}
                style={{
                  ...rowStyle,
                  background: isSelected ? "#6366f120" : "transparent",
                  borderLeft: isSelected ? "2px solid #6366f1" : "2px solid transparent",
                }}
                onClick={() => onPrefectureSelect(p.prefecture)}
              >
                <div style={{ ...rankStyle, color: i < 3 ? rankColors[i] : "#475569" }}>
                  {i < 3 ? rankIcons[i] : `${i + 1}`}
                </div>
                <div style={contentStyle}>
                  <div style={nameRowStyle}>
                    <span style={prefNameStyle}>{p.prefecture}</span>
                    <span style={{ ...avgStyle, color: getCrowdColor(p.avg) }}>
                      {Math.round(p.avg)}人
                    </span>
                  </div>
                  <div style={barTrackStyle}>
                    <div
                      style={{
                        ...barFillStyle,
                        width: `${barWidth}%`,
                        background: getCrowdBar(p.avg),
                      }}
                    />
                  </div>
                  <div style={metaStyle}>
                    {p.dataCount}店舗データあり · 最大 {p.max}人
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}

const rankColors = ["#f59e0b", "#94a3b8", "#cd7c46"];
const rankIcons = ["🥇", "🥈", "🥉"];

const panelStyle: React.CSSProperties = {
  background: "#1e293b",
  border: "1px solid #334155",
  borderRadius: 14,
  display: "flex",
  flexDirection: "column",
  overflow: "hidden",
};

const headerStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "14px 16px 10px",
  borderBottom: "1px solid #334155",
  flexShrink: 0,
};

const titleStyle: React.CSSProperties = {
  fontSize: 13,
  fontWeight: 700,
  color: "#e2e8f0",
  letterSpacing: "0.02em",
};

const subtitleStyle: React.CSSProperties = {
  fontSize: 10,
  color: "#475569",
};

const listStyle: React.CSSProperties = {
  overflowY: "auto",
  flex: 1,
};

const rowStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "flex-start",
  gap: 8,
  padding: "9px 14px",
  width: "100%",
  border: "none",
  borderBottom: "1px solid #0f172a",
  cursor: "pointer",
  textAlign: "left",
  transition: "background 0.1s",
};

const rankStyle: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 700,
  width: 22,
  flexShrink: 0,
  paddingTop: 2,
};

const contentStyle: React.CSSProperties = {
  flex: 1,
  minWidth: 0,
};

const nameRowStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "baseline",
  marginBottom: 5,
};

const prefNameStyle: React.CSSProperties = {
  fontSize: 13,
  fontWeight: 600,
  color: "#e2e8f0",
};

const avgStyle: React.CSSProperties = {
  fontSize: 13,
  fontWeight: 700,
};

const barTrackStyle: React.CSSProperties = {
  height: 4,
  background: "#0f172a",
  borderRadius: 2,
  overflow: "hidden",
  marginBottom: 4,
};

const barFillStyle: React.CSSProperties = {
  height: "100%",
  borderRadius: 2,
  transition: "width 0.3s ease",
};

const metaStyle: React.CSSProperties = {
  fontSize: 10,
  color: "#475569",
};

const emptyStyle: React.CSSProperties = {
  padding: 24,
  textAlign: "center",
  color: "#475569",
  fontSize: 13,
};
