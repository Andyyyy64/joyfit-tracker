import { useState, useMemo } from "react";
import { ComposableMap, Geographies, Geography } from "react-simple-maps";
import type { Store } from "../api";

const GEO_URL =
  "https://raw.githubusercontent.com/dataofjapan/land/master/japan.topojson";

const PREF_CODE_MAP: Record<number, string> = {
  1: "北海道", 2: "青森", 3: "岩手", 4: "宮城", 5: "秋田",
  6: "山形", 7: "福島", 8: "茨城", 9: "栃木", 10: "群馬",
  11: "埼玉", 12: "千葉", 13: "東京", 14: "神奈川", 15: "新潟",
  16: "富山", 17: "石川", 18: "福井", 19: "山梨", 20: "長野",
  21: "岐阜", 22: "静岡", 23: "愛知", 24: "三重", 25: "滋賀",
  26: "京都", 27: "大阪", 28: "兵庫", 29: "奈良", 30: "和歌山",
  31: "鳥取", 32: "島根", 33: "岡山", 34: "広島", 35: "山口",
  36: "徳島", 37: "香川", 38: "愛媛", 39: "高知", 40: "福岡",
  41: "佐賀", 42: "長崎", 43: "熊本", 44: "大分", 45: "宮崎",
  46: "鹿児島", 47: "沖縄",
};

function normalizePrefName(namJa: string): string {
  if (namJa === "北海道") return "北海道";
  return namJa.replace(/[都府県]$/, "");
}

function getPrefNameFromGeo(geo: { properties?: Record<string, unknown> }): string {
  const namJa = geo.properties?.nam_ja as string | undefined;
  if (namJa) return normalizePrefName(namJa);
  const code = geo.properties?.id as number | undefined;
  if (code && PREF_CODE_MAP[code]) return PREF_CODE_MAP[code]!;
  return "";
}

function getAvgCount(stores: Store[]): number | null {
  const withCount = stores.filter((s) => s.count !== undefined);
  if (withCount.length === 0) return null;
  return withCount.reduce((sum, s) => sum + (s.count ?? 0), 0) / withCount.length;
}

function getPrefFill(avg: number | null, isSelected: boolean, isHovered: boolean): string {
  if (isSelected) return "#6366f1";
  if (isHovered) return "#4f46e5";
  if (avg === null) return "#1e293b";
  if (avg < 20) return "#166534";
  if (avg < 40) return "#92400e";
  return "#7f1d1d";
}

interface Props {
  stores: Store[];
  selectedPrefecture: string | null;
  onPrefectureSelect: (name: string) => void;
}

export function JapanMap({ stores, selectedPrefecture, onPrefectureSelect }: Props) {
  const [hoveredPref, setHoveredPref] = useState<string | null>(null);

  const prefStoreMap = useMemo(() => {
    const map = new Map<string, Store[]>();
    for (const store of stores) {
      if (!store.prefecture) continue;
      const arr = map.get(store.prefecture) ?? [];
      arr.push(store);
      map.set(store.prefecture, arr);
    }
    return map;
  }, [stores]);

  return (
    <div style={{ width: "100%", height: "100%", background: "#0f172a", borderRadius: 16, overflow: "hidden", position: "relative" }}>
      <ComposableMap
        projection="geoMercator"
        projectionConfig={{ scale: 1400, center: [137, 37] }}
        style={{ width: "100%", height: "100%" }}
        viewBox="0 0 800 600"
        preserveAspectRatio="xMidYMid meet"
      >
        <Geographies geography={GEO_URL}>
          {({ geographies }) =>
            geographies.map((geo) => {
              const prefName = getPrefNameFromGeo(geo as { properties?: Record<string, unknown> });
              const prefStores = prefStoreMap.get(prefName) ?? [];
              const avg = getAvgCount(prefStores);
              const isSelected = selectedPrefecture === prefName;
              const isHovered = hoveredPref === prefName;
              const fill = getPrefFill(avg, isSelected, isHovered);
              const hasStores = prefStores.length > 0;

              return (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  fill={fill}
                  stroke="#0f172a"
                  strokeWidth={0.5}
                  style={{
                    default: { outline: "none" },
                    hover: { outline: "none" },
                    pressed: { outline: "none" },
                  }}
                  onClick={() => {
                    if (prefName && hasStores) onPrefectureSelect(prefName);
                  }}
                  onMouseEnter={() => prefName && setHoveredPref(prefName)}
                  onMouseLeave={() => setHoveredPref(null)}
                  cursor={hasStores ? "pointer" : "default"}
                />
              );
            })
          }
        </Geographies>
      </ComposableMap>

      {/* Legend */}
      <div style={legendStyle}>
        <div style={legendItem}>
          <div style={{ ...legendDot, background: "#166534" }} />
          <span>空いている</span>
        </div>
        <div style={legendItem}>
          <div style={{ ...legendDot, background: "#92400e" }} />
          <span>普通</span>
        </div>
        <div style={legendItem}>
          <div style={{ ...legendDot, background: "#7f1d1d" }} />
          <span>混んでいる</span>
        </div>
        <div style={legendItem}>
          <div style={{ ...legendDot, background: "#1e293b", border: "1px solid #334155" }} />
          <span>データなし</span>
        </div>
      </div>

      {/* Hover tooltip */}
      {hoveredPref && (
        <div style={tooltipStyle}>
          <span style={{ fontWeight: 600 }}>{hoveredPref}</span>
          {(() => {
            const st = prefStoreMap.get(hoveredPref);
            if (!st || st.length === 0) return <span style={{ color: "#94a3b8", marginLeft: 6 }}>店舗なし</span>;
            const avg = getAvgCount(st);
            return (
              <span style={{ color: "#94a3b8", marginLeft: 6 }}>
                {st.length}店舗{avg !== null ? ` · 平均${Math.round(avg)}人` : ""}
              </span>
            );
          })()}
        </div>
      )}
    </div>
  );
}

const legendStyle: React.CSSProperties = {
  position: "absolute",
  bottom: 16,
  left: 16,
  display: "flex",
  flexDirection: "column",
  gap: 6,
  background: "rgba(15,23,42,0.85)",
  backdropFilter: "blur(8px)",
  border: "1px solid #1e293b",
  borderRadius: 10,
  padding: "10px 14px",
};

const legendItem: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  fontSize: 11,
  color: "#94a3b8",
};

const legendDot: React.CSSProperties = {
  width: 12,
  height: 12,
  borderRadius: 3,
  flexShrink: 0,
};

const tooltipStyle: React.CSSProperties = {
  position: "absolute",
  top: 16,
  right: 16,
  background: "rgba(15,23,42,0.9)",
  backdropFilter: "blur(8px)",
  border: "1px solid #334155",
  borderRadius: 8,
  padding: "8px 14px",
  fontSize: 13,
  color: "#f1f5f9",
  pointerEvents: "none",
};
