import React, { useEffect, useMemo, useState } from "react";
import { collection, query, where, limit, onSnapshot } from "firebase/firestore";
import { db } from "../firebase.js";

function pickThumb(c) {
  return (
    c.imageUrl_256 ||
    c.imageUrlThumb256Webp ||
    c.imageUrlThumb256 ||
    c.imageUrl_768 ||
    c.imageUrl768Webp ||
    c.imageUrl_1024 ||
    c.imageUrl ||
    c.image ||
    ""
  );
}

function oneLine(s, max = 95) {
  if (!s || typeof s !== "string") return "";
  const t = s.replace(/\s+/g, " ").trim();
  if (t.length <= max) return t;
  return t.slice(0, max - 1).trimEnd() + "…";
}

export default function UsedInCocktails({ garnishId, limitCount = 12, onOpenCocktail }) {
  const [items, setItems] = useState([]);
  const [err, setErr] = useState("");

  const gid = useMemo(() => (garnishId || "").trim().toLowerCase(), [garnishId]);

  useEffect(() => {
    if (!gid) return;

    setErr("");

    // No orderBy => no composite index required
    const q1 = query(
      collection(db, "cocktails"),
      where("garnishIds", "array-contains", gid),
      limit(limitCount)
    );

    const unsub = onSnapshot(
      q1,
      (snap) => {
        const rows = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setItems(rows);
      },
      (e) => setErr(e?.message || "Failed to load cocktails.")
    );

    return () => unsub();
  }, [gid, limitCount]);

  if (!gid) return null;

  return (
    <div style={{ marginTop: 12 }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
        <h3 style={{ margin: 0 }}>Used in cocktails</h3>
        <span style={{ fontSize: 12, opacity: 0.8 }}>{items.length ? `${items.length} shown` : ""}</span>
      </div>

      {err ? (
        <div style={{ marginTop: 10, fontSize: 12, color: "#ff6b6b" }}>{err}</div>
      ) : null}

      {!items.length && !err ? (
        <div style={{ marginTop: 10, fontSize: 13, opacity: 0.85 }}>No cocktails found yet.</div>
      ) : null}

      <div
        style={{
          marginTop: 12,
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
          gap: 12,
        }}
      >
        {items.map((c) => {
          const thumb = pickThumb(c);
          const methodSnippet = oneLine(c?.method, 95);

          return (
            <button
              key={c.id}
              onClick={() => onOpenCocktail?.(c.id)}
              style={{
                textAlign: "left",
                border: "1px solid rgba(255,255,255,0.18)",
                borderRadius: 14,
                padding: 12,
                background: "rgba(255,255,255,0.08)",
                cursor: "pointer",
                color: "inherit",
              }}
            >
              <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                <div
                  style={{
                    width: 60,
                    height: 60,
                    borderRadius: 14,
                    overflow: "hidden",
                    background: "rgba(0,0,0,0.18)",
                    flex: "0 0 auto",
                    border: "1px solid rgba(255,255,255,0.10)",
                  }}
                >
                  {thumb ? (
                    <img
                      src={thumb}
                      alt={c.name || c.id}
                      style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                      loading="lazy"
                    />
                  ) : null}
                </div>

                <div style={{ minWidth: 0, flex: 1 }}>
                  <div
                    style={{
                      fontWeight: 800,
                      fontSize: 14,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {c.name || c.id}
                  </div>

                  {methodSnippet ? (
                    <div style={{ fontSize: 12, opacity: 0.90, marginTop: 6 }}>
                      {methodSnippet}
                    </div>
                  ) : null}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
