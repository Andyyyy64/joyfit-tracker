import { useState, useRef, useEffect, useMemo } from "react";
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
  onPrefectureSelect: (pref: string) => void;
}

export function SearchBar({ stores, onStoreSelect, onPrefectureSelect }: Props) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return stores
      .filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.prefecture.toLowerCase().includes(q)
      )
      .slice(0, 12);
  }, [query, stores]);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  function handleSelect(store: Store) {
    setQuery("");
    setOpen(false);
    onStoreSelect(store.id);
  }

  function handlePrefSelect(pref: string) {
    setQuery("");
    setOpen(false);
    onPrefectureSelect(pref);
  }

  const uniquePrefs = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    const seen = new Set<string>();
    const result: string[] = [];
    for (const s of stores) {
      if (s.prefecture && s.prefecture.toLowerCase().includes(q) && !seen.has(s.prefecture)) {
        seen.add(s.prefecture);
        result.push(s.prefecture);
      }
    }
    return result.slice(0, 3);
  }, [query, stores]);

  return (
    <div ref={containerRef} style={containerStyle}>
      <div style={inputWrapStyle}>
        <span style={iconStyle}>🔍</span>
        <input
          style={inputStyle}
          placeholder="店舗名・都道府県で検索..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => query && setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              setOpen(false);
              setQuery("");
            }
          }}
        />
        {query && (
          <button
            style={clearStyle}
            onClick={() => { setQuery(""); setOpen(false); }}
          >
            ✕
          </button>
        )}
      </div>

      {open && (results.length > 0 || uniquePrefs.length > 0) && (
        <div style={dropdownStyle}>
          {uniquePrefs.length > 0 && (
            <>
              <div style={sectionLabelStyle}>都道府県</div>
              {uniquePrefs.map((pref) => {
                const prefStores = stores.filter((s) => s.prefecture === pref);
                const withCount = prefStores.filter((s) => s.count !== undefined);
                const avg = withCount.length > 0
                  ? Math.round(withCount.reduce((a, b) => a + (b.count ?? 0), 0) / withCount.length)
                  : undefined;
                return (
                  <button key={pref} style={dropItemStyle} onClick={() => handlePrefSelect(pref)}>
                    <span style={dropPrefIconStyle}>📍</span>
                    <div style={dropNameWrapStyle}>
                      <span style={dropNameStyle}>{pref}</span>
                      <span style={dropMetaStyle}>{prefStores.length}店舗</span>
                    </div>
                    {avg !== undefined && (
                      <span style={{ ...dropCountStyle, color: getCrowdColor(avg) }}>
                        平均{avg}人
                      </span>
                    )}
                  </button>
                );
              })}
            </>
          )}

          {results.length > 0 && (
            <>
              <div style={sectionLabelStyle}>店舗</div>
              {results.map((store) => (
                <button key={store.id} style={dropItemStyle} onClick={() => handleSelect(store)}>
                  <span style={dropPrefIconStyle}>🏋</span>
                  <div style={dropNameWrapStyle}>
                    <span style={dropNameStyle}>{store.name}</span>
                    <span style={dropMetaStyle}>{store.prefecture}</span>
                  </div>
                  {store.count !== undefined && (
                    <span style={{ ...dropCountStyle, color: getCrowdColor(store.count) }}>
                      {store.count}人
                    </span>
                  )}
                </button>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}

const containerStyle: React.CSSProperties = {
  position: "relative",
  width: "100%",
};

const inputWrapStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  background: "#1e293b",
  border: "1px solid #334155",
  borderRadius: 10,
  padding: "0 12px",
  gap: 8,
};

const iconStyle: React.CSSProperties = {
  fontSize: 14,
  flexShrink: 0,
  opacity: 0.6,
};

const inputStyle: React.CSSProperties = {
  flex: 1,
  background: "transparent",
  border: "none",
  outline: "none",
  color: "#f1f5f9",
  fontSize: 13,
  padding: "11px 0",
  fontFamily: "inherit",
};

const clearStyle: React.CSSProperties = {
  background: "transparent",
  border: "none",
  color: "#475569",
  fontSize: 12,
  cursor: "pointer",
  padding: 4,
  flexShrink: 0,
};

const dropdownStyle: React.CSSProperties = {
  position: "absolute",
  top: "calc(100% + 6px)",
  left: 0,
  right: 0,
  background: "#1e293b",
  border: "1px solid #334155",
  borderRadius: 10,
  zIndex: 200,
  overflow: "hidden",
  boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
  maxHeight: 400,
  overflowY: "auto",
};

const sectionLabelStyle: React.CSSProperties = {
  fontSize: 10,
  fontWeight: 700,
  color: "#475569",
  textTransform: "uppercase",
  letterSpacing: "0.08em",
  padding: "10px 14px 4px",
};

const dropItemStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  width: "100%",
  padding: "9px 14px",
  background: "transparent",
  border: "none",
  borderTop: "1px solid #0f172a",
  cursor: "pointer",
  textAlign: "left",
  color: "inherit",
};

const dropPrefIconStyle: React.CSSProperties = {
  fontSize: 14,
  flexShrink: 0,
};

const dropNameWrapStyle: React.CSSProperties = {
  flex: 1,
  minWidth: 0,
};

const dropNameStyle: React.CSSProperties = {
  display: "block",
  fontSize: 13,
  fontWeight: 500,
  color: "#e2e8f0",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};

const dropMetaStyle: React.CSSProperties = {
  display: "block",
  fontSize: 11,
  color: "#475569",
};

const dropCountStyle: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 700,
  flexShrink: 0,
};
