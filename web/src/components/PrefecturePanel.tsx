import { useEffect } from "react";
import type { Store } from "../api";

function getCrowdColor(count: number | undefined): string {
  if (count === undefined) return "#475569";
  if (count < 20) return "#22c55e";
  if (count < 40) return "#f59e0b";
  return "#ef4444";
}

interface Props {
  prefecture: string;
  stores: Store[];
  onStoreSelect: (id: string) => void;
  onClose: () => void;
  isFavorite: (id: string) => boolean;
  onToggleFavorite: (id: string) => void;
}

export function PrefecturePanel({
  prefecture,
  stores,
  onStoreSelect,
  onClose,
  isFavorite,
  onToggleFavorite,
}: Props) {
  // Close on Escape key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const sorted = [...stores].sort((a, b) => {
    const ac = a.count ?? -1;
    const bc = b.count ?? -1;
    return bc - ac;
  });

  return (
    <>
      {/* Backdrop */}
      <div style={backdropStyle} onClick={onClose} />

      {/* Panel */}
      <div style={panelStyle}>
        <div style={headerStyle}>
          <div>
            <div style={titleStyle}>{prefecture}</div>
            <div style={subtitleStyle}>{stores.length}店舗</div>
          </div>
          <button onClick={onClose} style={closeStyle} aria-label="閉じる">
            ✕
          </button>
        </div>

        <div style={listStyle}>
          {sorted.length === 0 ? (
            <div style={emptyStyle}>データがありません</div>
          ) : (
            sorted.map((store) => (
              <div key={store.id} style={rowStyle}>
                <button
                  onClick={() => onStoreSelect(store.id)}
                  style={rowBtnStyle}
                >
                  <div style={storeNameStyle}>
                    {store.name}
                  </div>
                  {store.recorded_at && (
                    <div style={timeStyle}>
                      {new Date(store.recorded_at.replace(" ", "T")).toLocaleTimeString("ja-JP", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                      時点
                    </div>
                  )}
                </button>
                <div
                  style={{
                    ...badgeStyle,
                    background: getCrowdColor(store.count) + "22",
                    color: getCrowdColor(store.count),
                    border: `1px solid ${getCrowdColor(store.count)}44`,
                  }}
                >
                  {store.count !== undefined ? `${store.count}人` : "—"}
                </div>
                <button
                  onClick={() => onToggleFavorite(store.id)}
                  style={{ ...starStyle, color: isFavorite(store.id) ? "#f59e0b" : "#334155" }}
                  title={isFavorite(store.id) ? "お気に入り解除" : "お気に入り追加"}
                >
                  ★
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}

const backdropStyle: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.4)",
  zIndex: 100,
};

const panelStyle: React.CSSProperties = {
  position: "fixed",
  top: 0,
  right: 0,
  bottom: 0,
  width: "min(380px, 100vw)",
  background: "#0f172a",
  borderLeft: "1px solid #1e293b",
  zIndex: 101,
  display: "flex",
  flexDirection: "column",
  overflow: "hidden",
};

const headerStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  padding: "24px 20px 16px",
  borderBottom: "1px solid #1e293b",
};

const titleStyle: React.CSSProperties = {
  fontSize: 22,
  fontWeight: 700,
  color: "#f1f5f9",
  letterSpacing: "-0.3px",
};

const subtitleStyle: React.CSSProperties = {
  fontSize: 12,
  color: "#64748b",
  marginTop: 2,
};

const closeStyle: React.CSSProperties = {
  background: "#1e293b",
  border: "none",
  color: "#94a3b8",
  fontSize: 14,
  cursor: "pointer",
  borderRadius: 8,
  width: 32,
  height: 32,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const listStyle: React.CSSProperties = {
  overflowY: "auto",
  flex: 1,
  padding: "8px 0",
};

const rowStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  padding: "10px 16px",
  borderBottom: "1px solid #1e293b",
};

const rowBtnStyle: React.CSSProperties = {
  flex: 1,
  background: "transparent",
  border: "none",
  textAlign: "left",
  cursor: "pointer",
  padding: 0,
};

const storeNameStyle: React.CSSProperties = {
  fontSize: 13,
  fontWeight: 500,
  color: "#e2e8f0",
};

const timeStyle: React.CSSProperties = {
  fontSize: 10,
  color: "#475569",
  marginTop: 2,
};

const badgeStyle: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 600,
  borderRadius: 6,
  padding: "3px 8px",
  flexShrink: 0,
  whiteSpace: "nowrap",
};

const starStyle: React.CSSProperties = {
  background: "transparent",
  border: "none",
  fontSize: 16,
  cursor: "pointer",
  padding: 4,
  flexShrink: 0,
};

const emptyStyle: React.CSSProperties = {
  padding: 32,
  textAlign: "center",
  color: "#475569",
  fontSize: 14,
};
