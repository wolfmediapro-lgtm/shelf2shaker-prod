import React, { useMemo, useState } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";

function Layout() {
  const location = useLocation();
  const [q, setQ] = useState("");

  // We’ll wire search into CocktailList next (Step 2).
  const showSearch = useMemo(() => location.pathname === "/", [location.pathname]);

  return (
    <div>
      <header className="header">
        <div className="header-inner">
          <Link className="brand" to="/">
            <span className="pill">MVP</span>
            <span className="brand-title">🍸 Shelf2Shaker</span>
          </Link>

          <div className="nav">
            {showSearch && (
              <div className="searchbar" title="Search (wired next)">
                <span style={{ color: "rgba(166,176,195,.9)" }}>⌕</span>
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search cocktails…"
                />
              </div>
            )}

            <Link to="/">Cocktails</Link>
            <Link to="/add">Add Cocktail</Link>
          </div>
        </div>
      </header>

      <main className="container">
        <Outlet context={{ q }} />
        <div className="notice">Tip: Add cocktails in Firestore or via “Add Cocktail”.</div>
      </main>
    </div>
  );
}

export default Layout;
