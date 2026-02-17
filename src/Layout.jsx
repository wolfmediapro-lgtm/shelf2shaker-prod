import React, { useEffect, useMemo, useState } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { getEffectiveRegion, isRegionConfirmed, setRegion } from "./lib/region.js";
import RegionConfirmSheet from "./components/RegionConfirmSheet.jsx";

function Layout() {
  const location = useLocation();
  const [q, setQ] = useState("");
  const [region, setRegionState] = useState(getEffectiveRegion());
  const [regionSheetOpen, setRegionSheetOpen] = useState(false);

  useEffect(() => {
    const effective = getEffectiveRegion();
    setRegionState(effective);
    if (!isRegionConfirmed()) setRegionSheetOpen(true);
  }, []);

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
        <Outlet context={{ q, region }} />

        <div className="notice">Tip: Add cocktails in Firestore or via “Add Cocktail”.</div>

        {/* Footer */}
        <footer
          style={{
            marginTop: 22,
            paddingTop: 14,
            borderTop: "1px solid rgba(255,255,255,0.10)",
            display: "flex",
            flexWrap: "wrap",
            gap: 12,
            alignItems: "center",
            justifyContent: "space-between",
            opacity: 0.9,
            fontSize: 13,
          }}
        >
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
            <button
              onClick={() => setRegionSheetOpen(true)}
              style={{
                padding: "6px 10px",
                borderRadius: 999,
                border: "1px solid rgba(255,255,255,0.18)",
                background: "rgba(255,255,255,0.06)",
                color: "inherit",
                cursor: "pointer",
                fontWeight: 800,
              }}
              title="Change region"
            >
              Region: {region} · Change
            </button>

            <Link to="/faq" style={{ opacity: 0.85 }}>FAQ</Link>
            <Link to="/support" style={{ opacity: 0.85 }}>Customer Service</Link>
            <Link to="/about" style={{ opacity: 0.85 }}>About Us</Link>
          </div>

          <div style={{ opacity: 0.65 }}>
            © {new Date().getFullYear()} Shelf2Shaker
          </div>
        </footer>

        <RegionConfirmSheet
          open={regionSheetOpen}
          initialCode={region}
          onConfirm={(code) => {
            const final = setRegion(code);
            setRegionState(final);
            setRegionSheetOpen(false);
          }}
        />
      </main>
    </div>
  );
}

export default Layout;
