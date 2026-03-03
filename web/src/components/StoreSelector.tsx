import { useState, useRef, useEffect } from "react";
import type { Store } from "../api";

interface Props {
  stores: Store[];
  selectedId: string | null;
  onChange: (id: string | null) => void;
}

export function StoreSelector({ stores, selectedId, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const selected = stores.find((s) => s.id === selectedId) ?? null;

  const filtered = query.trim()
    ? stores.filter(
        (s) =>
          s.name.includes(query) ||
          s.id.includes(query)
      )
    : stores;

  // 外クリックで閉じる
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery("");
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function handleOpen() {
    setOpen(true);
    setQuery("");
    setTimeout(() => inputRef.current?.focus(), 0);
  }

  function handleSelect(id: string | null) {
    onChange(id);
    setOpen(false);
    setQuery("");
  }

  return (
    <div ref={containerRef} style={styles.wrapper}>
      {/* トリガーボタン */}
      <button onClick={handleOpen} style={styles.trigger}>
        <span style={styles.triggerLabel}>
          {selected ? selected.name : "全店舗一覧"}
        </span>
        {selected?.count !== undefined && (
          <span style={{ ...styles.badge, color: crowdColor(selected.count) }}>
            {selected.count}人
          </span>
        )}
        <span style={styles.arrow}>{open ? "▲" : "▼"}</span>
      </button>

      {/* ドロップダウン */}
      {open && (
        <div style={styles.dropdown}>
          {/* 検索 */}
          <div style={styles.searchBox}>
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="店舗名・IDで検索..."
              style={styles.searchInput}
            />
          </div>

          {/* 全店舗一覧 */}
          <div style={styles.list}>
            <div
              onClick={() => handleSelect(null)}
              style={{
                ...styles.item,
                ...(selectedId === null ? styles.itemActive : {}),
              }}
            >
              <span style={styles.itemName}>全店舗一覧</span>
              <span style={styles.itemCount}>{stores.length}店舗</span>
            </div>

            <div style={styles.divider} />

            {filtered.length === 0 ? (
              <div style={styles.empty}>「{query}」は見つかりません</div>
            ) : (
              filtered.map((store) => (
                <div
                  key={store.id}
                  onClick={() => handleSelect(store.id)}
                  style={{
                    ...styles.item,
                    ...(selectedId === store.id ? styles.itemActive : {}),
                  }}
                >
                  <span style={styles.itemName}>{store.name}</span>
                  <span
                    style={{
                      ...styles.itemCount,
                      color: store.count !== undefined
                        ? crowdColor(store.count)
                        : "#94a3b8",
                    }}
                  >
                    {store.count !== undefined ? `${store.count}人` : "—"}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function crowdColor(count: number): string {
  if (count < 20) return "#22c55e";
  if (count < 40) return "#f59e0b";
  return "#ef4444";
}

const styles: Record<string, React.CSSProperties> = {
  wrapper: {
    position: "relative",
    width: "100%",
    maxWidth: 360,
  },
  trigger: {
    width: "100%",
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "10px 14px",
    background: "white",
    border: "1px solid #e2e8f0",
    borderRadius: 10,
    cursor: "pointer",
    fontSize: 14,
    fontWeight: 500,
    color: "#1e293b",
    textAlign: "left" as const,
  },
  triggerLabel: {
    flex: 1,
  },
  badge: {
    fontSize: 12,
    fontWeight: 700,
  },
  arrow: {
    fontSize: 10,
    color: "#94a3b8",
  },
  dropdown: {
    position: "absolute" as const,
    top: "calc(100% + 6px)",
    left: 0,
    right: 0,
    background: "white",
    border: "1px solid #e2e8f0",
    borderRadius: 10,
    boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
    zIndex: 100,
    overflow: "hidden",
  },
  searchBox: {
    padding: "10px 12px",
    borderBottom: "1px solid #f1f5f9",
  },
  searchInput: {
    width: "100%",
    padding: "8px 10px",
    border: "1px solid #e2e8f0",
    borderRadius: 6,
    fontSize: 13,
    outline: "none",
    color: "#1e293b",
  },
  list: {
    maxHeight: 320,
    overflowY: "auto" as const,
  },
  item: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "9px 14px",
    cursor: "pointer",
    fontSize: 13,
    color: "#334155",
    transition: "background 0.1s",
  },
  itemActive: {
    background: "#eef2ff",
    color: "#6366f1",
    fontWeight: 600,
  },
  itemName: {
    flex: 1,
  },
  itemCount: {
    fontSize: 12,
    fontWeight: 600,
    marginLeft: 8,
    color: "#94a3b8",
  },
  divider: {
    height: 1,
    background: "#f1f5f9",
    margin: "4px 0",
  },
  empty: {
    padding: "20px 14px",
    textAlign: "center" as const,
    color: "#94a3b8",
    fontSize: 13,
  },
};
