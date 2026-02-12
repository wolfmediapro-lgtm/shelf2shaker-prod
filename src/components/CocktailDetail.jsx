import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";

export default function CocktailDetail() {
  const { id } = useParams();
  const [cocktail, setCocktail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;

    async function load() {
      try {
        setLoading(true);
        setError("");

        const ref = doc(db, "cocktails", id);
        const snap = await getDoc(ref);

        if (!alive) return;

        if (!snap.exists()) {
          setError("Cocktail not found.");
          setCocktail(null);
        } else {
          setCocktail({ id: snap.id, ...snap.data() });
        }
      } catch (e) {
        console.error("Failed to load cocktail:", e);
        if (!alive) return;
        setError(e?.message || "Failed to load cocktail.");
      } finally {
        if (!alive) return;
        setLoading(false);
      }
    }

    if (id) load();

    return () => {
      alive = false;
    };
  }, [id]);  

  if (loading) {
    return (
      <div style={{ padding: 24 }}>
        <h2>Loading cocktail…</h2>
        <p style={{ opacity: 0.7 }}>Stirring up the details.</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: 24 }}>
        <h2>Oops</h2>
        <p style={{ opacity: 0.7, marginBottom: 16 }}>{error}</p>
        <Link to="/" className="btn" style={{ textDecoration: "none" }}>
          ← Back to cocktails
        </Link>
      </div>
    );
  }

  if (!cocktail) return null;

  const ingredients = Array.isArray(cocktail.ingredients) ? cocktail.ingredients : [];
  const tags = Array.isArray(cocktail.tags) ? cocktail.tags : [];

  return (
    <div style={{ paddingTop: 8 }}>
      <Link
        to="/"
        style={{
          display: "inline-block",
          marginBottom: 14,
          color: "var(--muted)",
          textDecoration: "none",
          fontWeight: 700,
        }}
      >
        ← Back
      </Link>

      <div className="form" style={{ maxWidth: 860 }}>
        <h1 style={{ marginTop: 0, marginBottom: 8 }}>{cocktail.name || "Untitled cocktail"}</h1>
        {cocktail.description && (
          <p style={{ marginTop: 0, color: "var(--muted)", lineHeight: 1.5 }}>
            {cocktail.description}
          </p>
        )}

      <div style={{ marginTop: 18 }}>
        <h3 style={{ marginBottom: 10 }}>Ingredients</h3>

        {ingredients.length ? (
          <ul style={{ paddingLeft: 18 }}>
            {ingredients.map((ing, idx) => {
              // If old docs store ingredients as strings
              if (typeof ing === "string") {
                return <li key={idx}>{ing}</li>;
              }

              // If seed docs store ingredients as objects: { amount, unit, name }
              const amount = ing?.amount != null ? String(ing.amount) : "";
              const unit = ing?.unit ? String(ing.unit) : "";
              const name = ing?.name ? String(ing.name) : "";
              const text = [amount, unit, name].filter(Boolean).join(" ");

              return <li key={idx}>{text}</li>;
            })}
          </ul>
        ) : (
          <p style={{ color: "var(--muted)" }}>No ingredients listed yet.</p>
        )}
      </div>
        <div style={{ marginTop: 18 }}>
          <h3 style={{ marginBottom: 10 }}>Tags</h3>
          {tags.length ? (
            <div className="meta">
              {tags.map((t) => (
                <span key={t} className="tag">
                  {t}
                </span>
              ))}
            </div>
          ) : (
            <p style={{ color: "var(--muted)" }}>No tags yet.</p>
          )}
        </div>

        <div style={{ marginTop: 22, display: "flex", gap: 10, flexWrap: "wrap" }}>
          <Link to="/" className="btn" style={{ textDecoration: "none" }}>
            Back to list
          </Link>

          {/* We'll wire Edit/Delete later */}
          <button className="btn" disabled title="Next step">
            Edit (soon)
          </button>
          <button className="btn" disabled title="Next step">
            Delete (soon)
          </button>
        </div>
      </div>
    </div>
  );
}

