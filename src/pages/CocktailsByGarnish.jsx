import React, { useEffect, useMemo, useState } from "react";
import { collection, query, where, limit, onSnapshot } from "firebase/firestore";
import { useNavigate, useParams } from "react-router-dom";
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

export default function CocktailsByGarnish() {
  const { id } = useParams();
  const navigate = useNavigate();
  const garnishId = useMemo(() => (id || "").trim().toLowerCase(), [id]);

  const [items, setItems] = useState([]);
  const [err, setErr] = useState("");

  useEffect(() => {
    if (!garnishId) return;

    setErr("");

    const q1 = query(
      collection(db, "cocktails"),
      where("garnishIds", "array-contains", garnishId),
      limit(200)
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
  }, [garnishId]);

  return (
    <div style={{ padding: 16, maxWidth: 980, margin: "0 auto" }}>
      <button
        onClick={() => navigate(-1)}
        style={{
          marginBottom: 12,
          padding: "8px 12px",
          borderRadius: 10,
          border: "1px solid rgba(255,255,255,0.18)",
          background: "rgba(255,255,255,0.06)",
          color: "inherit",
          cursor: "pointer",
        }}
      >
        ← Back
      </button>

      <h2 style={{ margin: "4px 0 10px" }}>Cocktails using: {garnishId || "garnish"}</h2>

      {err ? <div style={{ marginTop: 10, fontSize: 12, color: "#ff6b6b" }}>{err}</div> : null}

      {!items.length && !err ? (
        <div style={{ marginTop: 10, fontSize: 13, opacity: 0.85 }}>No cocktails found.</div>
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
          return (
            <button
              key={c.id}
              onClick={() => navigate(`/cocktail/${c.id}`)}
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
                  {c.method ? (
                    <div style={{ fontSize: 12, opacity: 0.90, marginTop: 6 }}>
                      {c.method.length > 110 ? c.method.slice(0, 109) + "…" : c.method}
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
