import { useState, useMemo } from "react";
import type { Store } from "../api";

function getCrowdColor(count: number | undefined): string {
  if (count === undefined) return "#475569";
  if (count < 20) return "#22c55e";
  if (count < 40) return "#f59e0b";
  return "#ef4444";
}

interface Props {
  stores: Store[];
  onStoreSelect: (id: string) => void;
  isFavorite: (id: string) => boolean;
  onToggleFavorite: (id: string) => void;
}

export function StoreRanking({ stores, onStoreSelect, isFavorite, onToggleFavorite }: Props) {
  const [mode, setMode] = useState<"crowded" | "empty">("crowded");

  const ranked = useMemo(() => {
    const withCount = stores.filter((s) => s.count !== undefined);
    if (mode === "crowded") {
      return [...withCount].sort((a, b) => (b.count ?? 0) - (a.count ?? 0)).slice(0, 20);
    }
    return [...withCount].sort((a, b) => (a.count ?? 0) - (b.count ?? 0)).slice(0, 20);
  }, [stores, mode]);

  const shortName = (name: string) =>
    name.replace(/^JOYFIT24?\s*/i, "").replace(/^ジョイフィット24?\s*/i, "");

  return (
    <div style={panelStyle}>
      <div style={headerStyle}>
        <span style={titleStyle}>店舗ランキング</span>
        <div style={tabsStyle}>
          <button
            style={{ ...tabStyle, ...(mode === "crowded" ? tabActiveStyle : {}) }}
            onClick={() => setMode("crowded")}
          >
            混雑
          </button>
          <button
            style={{ ...tabStyle, ...(mode === "empty" ? tabActiveStyle : {}) }}
            onClick={() => setMode("empty")}
          >
            空き
          </button>
        </div>
      </div>

      <div style={listStyle}>
        {ranked.length === 0 ? (
          <div style={emptyStyle}>データなし</div>
        ) : (
          ranked.map((store, i) => (
            <div key={store.id} style={rowStyle}>
              <div style={{ ...rankStyle, color: i < 3 ? rankColors[i] : "#475569" }}>
                {i < 3 ? rankIcons[i] : `${i + 1}`}
              </div>
              <button onClick={() => onStoreSelect(store.id)} style={nameBtnStyle} title={store.name}>
                <div style={nameStyle}>{shortName(store.name)}</div>
                <div style={prefStyle}>{store.prefecture}</div>
              </button>
              <div style={{ ...countStyle, color: getCrowdColor(store.count) }}>
                {store.count}
                <span style={unitStyle}>人</span>
              </div>
              <button
                onClick={() => onToggleFavorite(store.id)}
                style={{ ...starStyle, color: isFavorite(store.id) ? "#f59e0b" : "#334155" }}
              >
                ★
              </button>
            </div>
          ))
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

const tabsStyle: React.CSSProperties = {
  display: "flex",
  background: "#0f172a",
  borderRadius: 6,
  padding: 2,
  gap: 2,
};

const tabStyle: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 600,
  color: "#64748b",
  background: "transparent",
  border: "none",
  borderRadius: 4,
  padding: "4px 10px",
  cursor: "pointer",
};

const tabActiveStyle: React.CSSProperties = {
  background: "#6366f1",
  color: "white",
};

const listStyle: React.CSSProperties = {
  overflowY: "auto",
  flex: 1,
};

const rowStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 6,
  padding: "7px 14px",
  borderBottom: "1px solid #0f172a",
  transition: "background 0.1s",
};

const rankStyle: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 700,
  width: 24,
  textAlign: "center",
  flexShrink: 0,
};

const nameBtnStyle: React.CSSProperties = {
  flex: 1,
  background: "transparent",
  border: "none",
  textAlign: "left",
  cursor: "pointer",
  padding: 0,
  minWidth: 0,
};

const nameStyle: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 500,
  color: "#e2e8f0",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};

const prefStyle: React.CSSProperties = {
  fontSize: 10,
  color: "#475569",
  marginTop: 1,
};

const countStyle: React.CSSProperties = {
  fontSize: 15,
  fontWeight: 700,
  flexShrink: 0,
  lineHeight: 1,
};

const unitStyle: React.CSSProperties = {
  fontSize: 9,
  fontWeight: 400,
  marginLeft: 1,
};

const starStyle: React.CSSProperties = {
  background: "transparent",
  border: "none",
  fontSize: 13,
  cursor: "pointer",
  padding: 2,
  flexShrink: 0,
};

const emptyStyle: React.CSSProperties = {
  padding: 24,
  textAlign: "center",
  color: "#475569",
  fontSize: 13,
};
