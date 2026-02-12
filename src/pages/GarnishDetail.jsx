import React, { useEffect, useMemo, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { useNavigate, useParams } from "react-router-dom";
import { db } from "../firebase.js";
import UsedInCocktails from "../components/UsedInCocktails.jsx";

export default function GarnishDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const garnishId = useMemo(() => (id || "").trim().toLowerCase(), [id]);

  const [garnish, setGarnish] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!garnishId) return;
    (async () => {
      setLoading(true);
      const snap = await getDoc(doc(db, "garnishes", garnishId));
      setGarnish(snap.exists() ? snap.data() : null);
      setLoading(false);
    })();
  }, [garnishId]);

  if (!garnishId) return null;

  const title = garnish?.name || garnish?.label || garnishId;

  // Prefer new clean fields, then fall back to legacy
  const hero =
    garnish?.imageUrl_1024 ||
    garnish?.imageUrl_768 ||
    garnish?.imageUrl ||
    garnish?.imageUrl768Webp ||
    garnish?.imageUrlThumb256Webp ||
    "";

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

      <h2 style={{ margin: "4px 0 12px" }}>{title}</h2>

      {loading ? <div style={{ opacity: 0.8, marginBottom: 12 }}>Loading…</div> : null}

      {hero ? (
        <div
          style={{
            width: "100%",
            maxWidth: 560,
            borderRadius: 18,
            overflow: "hidden",
            marginBottom: 14,
            border: "1px solid rgba(255,255,255,0.14)",
            background: "rgba(255,255,255,0.04)",
          }}
        >
          <img
            src={hero}
            alt={title}
            style={{ width: "100%", height: "auto", display: "block" }}
            loading="lazy"
          />
        </div>
      ) : (
        <div style={{ marginBottom: 14, opacity: 0.75 }}>No image found for this garnish yet.</div>
      )}

      {garnish?.prepSummary ? <p style={{ opacity: 0.92 }}>{garnish.prepSummary}</p> : null}

      {Array.isArray(garnish?.tools) && garnish.tools.length ? (
        <>
          <h3 style={{ marginTop: 18 }}>Tools</h3>
          <ul>{garnish.tools.map((t, i) => <li key={i}>{t}</li>)}</ul>
        </>
      ) : null}

      {Array.isArray(garnish?.steps) && garnish.steps.length ? (
        <>
          <h3 style={{ marginTop: 18 }}>Steps</h3>
          <ol>{garnish.steps.map((s, i) => <li key={i}>{s}</li>)}</ol>
        </>
      ) : null}

      {Array.isArray(garnish?.tips) && garnish.tips.length ? (
        <>
          <h3 style={{ marginTop: 18 }}>Tips</h3>
          <ul>{garnish.tips.map((t, i) => <li key={i}>{t}</li>)}</ul>
        </>
      ) : null}

      <div style={{ marginTop: 22 }}>
        <UsedInCocktails
          garnishId={garnishId}
          onOpenCocktail={(cocktailId) => navigate(`/cocktail/${cocktailId}`)}
        />
      </div>

      <div style={{ marginTop: 14 }}>
        <button
          onClick={() => navigate(`/garnishes/${garnishId}/cocktails`)}
          style={{
            padding: "10px 14px",
            borderRadius: 12,
            border: "1px solid rgba(255,255,255,0.22)",
            background: "rgba(255,255,255,0.10)",
            color: "inherit",
            cursor: "pointer",
            fontWeight: 700,
          }}
        >
          View all cocktails using this garnish →
        </button>
      </div>
    </div>
  );
}
