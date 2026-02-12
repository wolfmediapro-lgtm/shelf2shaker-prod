import React, { useEffect, useState } from "react";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { Link, useOutletContext } from "react-router-dom";
import { db } from "../firebase";

function dedupeById(items) {
  const m2 = new Map();
  for (const x of items || []) {
    const k = x?.id || x?.docId || x?.slug || JSON.stringify(x);
    if (!m2.has(k)) m2.set(k, x);
  }
  return Array.from(m2.values());
}

export default function CocktailList() {
  const { q } = useOutletContext() || {};
  const [cocktails, setCocktails] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadCocktails() {
      try {
        const ref = collection(db, "cocktails");
        const qy = query(ref, orderBy("name"));
        const snap = await getDocs(qy);

        const items = snap.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setCocktails(dedupeById(items));
      } catch (err) {
        console.error("Failed to load cocktails:", err);
      } finally {
        setLoading(false);
      }
    }

    loadCocktails();
  }, []);

  const filtered = q
    ? cocktails.filter((c) => c.name?.toLowerCase().includes(q.toLowerCase()))
    : cocktails;

  if (loading) {
    return (
      <div style={{ padding: 24 }}>
        <h2>Loading cocktails… 🍸</h2>
        <p style={{ opacity: 0.7 }}>Shaking the shelves, just a moment.</p>
      </div>
    );
  }

  if (!loading && filtered.length === 0) {
    return (
      <div style={{ padding: 24 }}>
        <h2>No cocktails yet 🍸</h2>
        <p style={{ opacity: 0.7, marginBottom: 16 }}>
          Add your first cocktail to get started.
        </p>
        <Link to="/add" className="btn">
          Add a cocktail
        </Link>
      </div>
    );
  }

  return (
    <div className="grid">
      {filtered.map((c) => (
        <Link
          key={c.id}
          to={`/cocktail/${c.id}`}
          className="card"
          style={{ textDecoration: "none" }}
        >
          <div className="thumb" />
          <div className="card-body">
            <h3 className="title">{c.name}</h3>

            {c.description && <p className="desc">{c.description}</p>}

            <div className="meta">
              {c.tags?.slice(0, 5).map((tag) => (<span key={tag} className="tag">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
