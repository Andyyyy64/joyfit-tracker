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
  onToggleFavorite: (id: string) => void;
}

export function FavoriteBar({ stores, onStoreSelect, onToggleFavorite }: Props) {
  if (stores.length === 0) return null;

  return (
    <div style={containerStyle}>
      <div style={labelStyle}>お気に入り</div>
      <div style={scrollStyle}>
        {stores.map((store) => (
          <div key={store.id} style={cardStyle}>
            <button
              onClick={() => onStoreSelect(store.id)}
              style={cardInnerStyle}
              title={store.name}
            >
              <div style={{ ...countStyle, color: getCrowdColor(store.count) }}>
                {store.count !== undefined ? store.count : "—"}
              </div>
              <div style={countLabelStyle}>人</div>
              <div style={nameStyle}>{store.name.replace(/^JOYFIT24?\s*/, "")}</div>
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onToggleFavorite(store.id); }}
              style={starBtnStyle}
              title="お気に入り解除"
            >
              ★
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

const containerStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 12,
  padding: "12px 20px",
  background: "#0f172a",
  borderBottom: "1px solid #1e293b",
};

const labelStyle: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 600,
  color: "#64748b",
  textTransform: "uppercase" as const,
  letterSpacing: "0.08em",
  whiteSpace: "nowrap" as const,
  flexShrink: 0,
};

const scrollStyle: React.CSSProperties = {
  display: "flex",
  gap: 8,
  overflowX: "auto" as const,
  paddingBottom: 2,
  scrollbarWidth: "none" as const,
};

const cardStyle: React.CSSProperties = {
  position: "relative" as const,
  flexShrink: 0,
  background: "#1e293b",
  border: "1px solid #334155",
  borderRadius: 10,
  overflow: "hidden",
};

const cardInnerStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column" as const,
  alignItems: "center",
  padding: "10px 16px 8px",
  background: "transparent",
  border: "none",
  cursor: "pointer",
  minWidth: 80,
};

const countStyle: React.CSSProperties = {
  fontSize: 22,
  fontWeight: 700,
  lineHeight: 1,
};

const countLabelStyle: React.CSSProperties = {
  fontSize: 10,
  color: "#64748b",
  marginTop: 1,
};

const nameStyle: React.CSSProperties = {
  fontSize: 10,
  color: "#94a3b8",
  marginTop: 4,
  maxWidth: 80,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap" as const,
};

const starBtnStyle: React.CSSProperties = {
  position: "absolute" as const,
  top: 4,
  right: 4,
  background: "transparent",
  border: "none",
  color: "#f59e0b",
  fontSize: 11,
  cursor: "pointer",
  padding: 2,
  lineHeight: 1,
};
