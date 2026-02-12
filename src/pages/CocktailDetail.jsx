import React, { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase.js";

function dashId(id) {
  return String(id || "").trim().toLowerCase().replace(/:/g, "-");
}
function colonId(id) {
  return String(id || "").trim().toLowerCase().replace(/-/g, ":");
}

function methodToSteps(method) {
  const t = String(method || "").trim();
  if (!t) return [];

  const byLine = t
    .split(/\n+/)
    .map((x) => x.trim())
    .filter(Boolean)
    .map((x) => x.replace(/^[\-\*\d\.\)\s]+/, "").trim())
    .filter(Boolean);

  if (byLine.length >= 2) return byLine;

  const sentences = t
    .replace(/\s+/g, " ")
    .trim()
    .split(/(?<=[.!?])\s+/)
    .map((x) => x.trim())
    .filter(Boolean);

  return sentences.slice(0, 10);
}

function renderIngredientLine(x) {
  if (!x) return null;
  if (typeof x === "string") return <span>{x}</span>;

  const amount = x.amount ?? "";
  const unit = x.unit ?? "";
  const name = x.name ?? "";
  const prep = x.prep ? String(x.prep) : "";
  const notes = x.notes ? String(x.notes) : "";

  return (
    <div style={{ display: "flex", gap: 12, alignItems: "baseline" }}>
      <div style={{ minWidth: 92, fontWeight: 900, opacity: 0.95 }}>
        {amount}
        {unit ? " " + unit : ""}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 500, opacity: 0.98 }}>{name}</div>
        {(prep || notes) ? (
          <div style={{ opacity: 0.75, fontSize: 12, marginTop: 2, lineHeight: 1.35 }}>
            {prep ? prep : ""}
            {prep && notes ? " • " : ""}
            {notes ? notes : ""}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function Drawer({ open, title, onClose, children }) {
  const [dragY, setDragY] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [startY, setStartY] = useState(0);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  // reset drag when opening
  useEffect(() => {
    if (open) {
      setDragY(0);
      setDragging(false);
      setStartY(0);
    }
  }, [open]);

  function onPointerDown(e) {
    // only left click / touch
    if (e.pointerType === "mouse" && e.button !== 0) return;
    setDragging(true);
    setStartY(e.clientY || 0);
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch {}
  }

  function onPointerMove(e) {
    if (!dragging) return;
    const y = e.clientY || 0;
    const delta = Math.max(0, y - startY); // only allow downward drag
    setDragY(delta);
  }

  function onPointerUp(e) {
    if (!dragging) return;
    setDragging(false);
    const shouldClose = dragY > 140;
    if (shouldClose) {
      onClose?.();
      return;
    }
    // snap back
    setDragY(0);
    try { e.currentTarget.releasePointerCapture(e.pointerId); } catch {}
  }

  if (!open) return null;

  const overlayOpacity = Math.max(0.18, 0.55 - dragY / 500);

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: `rgba(0,0,0,${overlayOpacity})`,
        zIndex: 9999,
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "min(900px, 100vw)",
          maxHeight: "82vh",
          background: "rgba(18,18,18,0.98)",
          borderTop: "1px solid rgba(255,255,255,0.12)",
          borderLeft: "1px solid rgba(255,255,255,0.12)",
          borderRight: "1px solid rgba(255,255,255,0.12)",
          borderTopLeftRadius: 18,
          borderTopRightRadius: 18,
          padding: 18,
          overflowY: "auto",
          boxShadow: "0 -18px 50px rgba(0,0,0,0.45)",
          transform: `translateY(${dragY}px)`,
          transition: dragging ? "none" : "transform 160ms ease",
          touchAction: "none",
        }}
      >
        {/* drag handle (also captures swipe-down) */}
        <div
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          style={{ cursor: "grab", paddingTop: 2, paddingBottom: 10 }}
        >
          <div
            data-s2s-drawer-handle
            style={{
              width: 44,
              height: 5,
              borderRadius: 999,
              background: "rgba(255,255,255,0.22)",
              margin: "0 auto",
            }}
          />
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
          <div style={{ fontSize: 16, fontWeight: 900, letterSpacing: 0.2 }}>{title}</div>
          <button
            onClick={onClose}
            style={{
              padding: "6px 10px",
              borderRadius: 10,
              border: "1px solid rgba(255,255,255,0.18)",
              background: "rgba(255,255,255,0.06)",
              color: "inherit",
              cursor: "pointer",
              fontWeight: 800,
              opacity: 0.9,
            }}
          >
            Close
          </button>
        </div>

        <div style={{ marginTop: 14 }}>{children}</div>
      </div>
    </div>
  );
}

export default function CocktailDetail() {
  const { id: rawId } = useParams();
  const [cocktail, setCocktail] = useState(null);
  const [loading, setLoading] = useState(true);

  const [descExpanded, setDescExpanded] = useState(false);
  const [showAllGarnishes, setShowAllGarnishes] = useState(false);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerLoading, setDrawerLoading] = useState(false);
  const [drawerError, setDrawerError] = useState("");
  const [drawerGarnishId, setDrawerGarnishId] = useState("");
  const [drawerGarnish, setDrawerGarnish] = useState(null);

  const id = useMemo(() => String(rawId || "").trim(), [rawId]);

  useEffect(() => {
    let alive = true;

    async function load() {
      setLoading(true);
      setCocktail(null);

      const candidates = [];
      if (id) {
        candidates.push(id);
        const d = dashId(id);
        const c = colonId(id);
        if (!candidates.includes(d)) candidates.push(d);
        if (!candidates.includes(c)) candidates.push(c);
      }

      try {
        let found = null;
        for (const cid of candidates) {
          const ref = doc(db, "cocktails", cid);
          const snap = await getDoc(ref);
          if (snap.exists()) {
            found = { id: snap.id, ...snap.data() };
            break;
          }
        }
        if (!alive) return;
        setCocktail(found);
      } catch (e) {
        console.error("Failed to load cocktail:", e);
      } finally {
        if (alive) setLoading(false);
      }
    }

    load();
    return () => {
      alive = false;
    };
  }, [id]);

  async function openGarnishDrawer(garnishId, label) {
    const gid = String(garnishId || "").trim();
    if (!gid) return;

    setDrawerError("");
    setDrawerGarnish(null);
    setDrawerGarnishId(gid);
    setDrawerOpen(true);
    setDrawerLoading(true);

    try {
      const ref = doc(db, "garnishes", gid);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        setDrawerGarnish({ id: snap.id, ...snap.data(), _label: label || "" });
      } else {
        setDrawerError("Garnish not found.");
      }
    } catch (e) {
      console.error("Failed to load garnish:", e);
      setDrawerError("Failed to load garnish.");
    } finally {
      setDrawerLoading(false);
    }
  }

  const description = (cocktail?.description || "").trim();
  const shouldShowReadMore = description.length > 220;

  const method = (cocktail?.method || "").trim();
  const methodSteps =
    Array.isArray(cocktail?.methodSteps) && cocktail.methodSteps.length
      ? cocktail.methodSteps
      : methodToSteps(method);

  const garnishSuggestions = Array.isArray(cocktail?.garnishSuggestions)
    ? cocktail.garnishSuggestions.filter(Boolean)
    : [];

  const tags = Array.isArray(cocktail?.tags) ? cocktail.tags.filter(Boolean) : [];

  if (loading) {
    return (
      <div style={{ padding: 24 }}>
        <h2>Loading… 🍸</h2>
      </div>
    );
  }

  if (!cocktail) {
    return (
      <div style={{ padding: 24 }}>
        <h2>Not found</h2>
        <p style={{ opacity: 0.75 }}>
          Couldn’t find this cocktail ID: <code>{id}</code>
        </p>
        <Link to="/" style={{ opacity: 0.9 }}>← Back to cocktails</Link>
      </div>
    );
  }

  const drawerTitle =
    (drawerGarnish?.name || drawerGarnish?._label || drawerGarnishId || "Garnish").toString();

  const drawerImage =
    drawerGarnish?.imageUrl_768 ||
    drawerGarnish?.imageUrl_1024 ||
    drawerGarnish?.imageUrl768Webp ||
    drawerGarnish?.imageUrl ||
    "";

  return (
    <div style={{ padding: 24, maxWidth: 900, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 16, alignItems: "baseline" }}>
        <h2 style={{ margin: 0 }}>{cocktail.name || "Cocktail"}</h2>
        <Link to="/" style={{ opacity: 0.85, textDecoration: "none" }}>← Back</Link>
      </div>

      {description ? (
        <div style={{ marginTop: 10 }}>
          <p
            style={{
              margin: 0,
              opacity: 0.92,
              lineHeight: 1.55,
              ...(descExpanded
                ? {}
                : {
                    display: "-webkit-box",
                    WebkitBoxOrient: "vertical",
                    WebkitLineClamp: 3,
                    overflow: "hidden",
                  }),
            }}
          >
            {description}
          </p>

          {(shouldShowReadMore || descExpanded) ? (
            <button
              onClick={() => setDescExpanded((v) => !v)}
              style={{
                marginTop: 8,
                padding: "6px 10px",
                borderRadius: 10,
                border: "1px solid rgba(255,255,255,0.18)",
                background: "rgba(255,255,255,0.06)",
                color: "inherit",
                cursor: "pointer",
                fontWeight: 700,
              }}
            >
              {descExpanded ? "Read less" : "Read more"}
            </button>
          ) : null}
        </div>
      ) : null}

      {Array.isArray(cocktail.ingredients) && cocktail.ingredients.length ? (
        <div style={{ marginTop: 18 }}>
          <h3 style={{ marginTop: 0 }}>Ingredients</h3>

          <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 10 }}>
            {cocktail.ingredients.map((x, i) => (
              <div
                key={i}
                style={{
                  paddingBottom: 10,
                  borderBottom: "1px solid rgba(255,255,255,0.08)",
                }}
              >
                {renderIngredientLine(x)}
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <div style={{ marginTop: 18 }}>
        <h3 style={{ marginTop: 0 }}>Garnishes & Extras</h3>

        {garnishSuggestions.length ? (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center" }}>
            {(showAllGarnishes ? garnishSuggestions : garnishSuggestions.slice(0, 5)).map((g, i) => {
              const gid = g.garnishId || g.id || "";
              const label = g.label || gid || "Garnish";

              return (
                <button
                  key={i}
                  onClick={() => openGarnishDrawer(gid, label)}
                  style={{
                    padding: "8px 10px",
                    borderRadius: 999,
                    border: "1px solid rgba(255,255,255,0.14)",
                    background: "rgba(255,255,255,0.05)",
                    color: "inherit",
                    cursor: gid ? "pointer" : "default",
                    fontSize: 13,
                    fontWeight: 750,
                    opacity: gid ? 0.95 : 0.55,
                  }}
                  title={gid ? "Open garnish details" : "No garnishId"}
                >
                  {label}
                </button>
              );
            })}

            {garnishSuggestions.length > 5 ? (
              <button
                onClick={() => setShowAllGarnishes((v) => !v)}
                style={{
                  padding: "8px 10px",
                  borderRadius: 999,
                  border: "1px solid rgba(255,255,255,0.18)",
                  background: "rgba(255,255,255,0.06)",
                  color: "inherit",
                  cursor: "pointer",
                  fontWeight: 800,
                  opacity: 0.9,
                }}
              >
                {showAllGarnishes ? "Show less" : `+${garnishSuggestions.length - 5} more`}
              </button>
            ) : null}
          </div>
        ) : (
          <div style={{ opacity: 0.75 }}>No garnishes listed yet.</div>
        )}
      </div>

      {methodSteps.length ? (
        <div style={{ marginTop: 18 }}>
          <h3 style={{ marginTop: 0 }}>Method</h3>
          <ol style={{ marginTop: 8, paddingLeft: 18, opacity: 0.92, lineHeight: 1.55 }}>
            {methodSteps.map((step, i) => (
              <li key={i} style={{ marginBottom: 6 }}>
                {step}
              </li>
            ))}
          </ol>
        </div>
      ) : null}

      {cocktail?.glass ? (
        <div style={{ marginTop: 18 }}>
          <h3 style={{ marginTop: 0 }}>Suggested glass</h3>
          <p style={{ opacity: 0.92, marginBottom: 8 }}>{cocktail.glass}</p>
          {cocktail?.glassNote ? (
            <p style={{ opacity: 0.7, marginTop: 0 }}>{cocktail.glassNote}</p>
          ) : null}
        </div>
      ) : null}

      {tags.length ? (
        <div style={{ marginTop: 18 }}>
          <h3 style={{ marginTop: 0 }}>Tags</h3>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, opacity: 0.9 }}>
            {tags.slice(0, 5).map((t, i) => (
              <span
                key={i}
                style={{
                  padding: "6px 10px",
                  borderRadius: 999,
                  border: "1px solid rgba(255,255,255,0.14)",
                  background: "rgba(255,255,255,0.05)",
                  fontSize: 12,
                  fontWeight: 700,
                }}
              >
                {t}
              </span>
            ))}
          </div>
        </div>
      ) : null}

      <Drawer
        open={drawerOpen}
        title={drawerTitle}
        onClose={() => {
          setDrawerOpen(false);
          setDrawerError("");
          setDrawerGarnish(null);
          setDrawerGarnishId("");
        }}
      >
        {drawerLoading ? (
          <div style={{ opacity: 0.8 }}>Loading garnish…</div>
        ) : drawerError ? (
          <div style={{ opacity: 0.85 }}>{drawerError}</div>
        ) : drawerGarnish ? (
          <div>
            {drawerImage ? (
              <img
                src={drawerImage}
                alt={drawerTitle}
                style={{
width: "100%",
                  maxWidth: 280,
                  aspectRatio: "1 / 1",
                  objectFit: "cover",
                  display: "block",
                  margin: "0 auto 12px",
                  borderRadius: 14,
                  border: "1px solid rgba(255,255,255,0.10)",
                }}
              />
            ) : null}

            {drawerGarnish?.prepSummary ? (
              <p style={{ opacity: 0.92, lineHeight: 1.55, marginTop: 0 }}>{drawerGarnish.prepSummary}</p>
            ) : null}

            {Array.isArray(drawerGarnish?.tools) && drawerGarnish.tools.length ? (
              <div style={{ marginTop: 12 }}>
                <div style={{ fontWeight: 900, opacity: 0.92, marginBottom: 6 }}>Tools</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, opacity: 0.9 }}>
                  {drawerGarnish.tools.map((t, i) => (
                    <span
                      key={i}
                      style={{
                        padding: "6px 10px",
                        borderRadius: 999,
                        border: "1px solid rgba(255,255,255,0.14)",
                        background: "rgba(255,255,255,0.05)",
                        fontSize: 12,
                      }}
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}

            {Array.isArray(drawerGarnish?.steps) && drawerGarnish.steps.length ? (
              <div style={{ marginTop: 12 }}>
                <div style={{ fontWeight: 900, opacity: 0.92, marginBottom: 6 }}>Steps</div>
                <ol style={{ marginTop: 6, paddingLeft: 18, opacity: 0.92, lineHeight: 1.55 }}>
                  {drawerGarnish.steps.map((s, i) => (
                    <li key={i} style={{ marginBottom: 6 }}>
                      {s}
                    </li>
                  ))}
                </ol>
              </div>
            ) : null}

            {Array.isArray(drawerGarnish?.tips) && drawerGarnish.tips.length ? (
              <div style={{ marginTop: 12 }}>
                <div style={{ fontWeight: 900, opacity: 0.92, marginBottom: 6 }}>Tips</div>
                <ul style={{ marginTop: 6, paddingLeft: 18, opacity: 0.9, lineHeight: 1.55 }}>
                  {drawerGarnish.tips.map((s, i) => (
                    <li key={i} style={{ marginBottom: 6 }}>
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            <div style={{ marginTop: 14 }}>
              <Link
                to={`/garnishes/${drawerGarnishId}`}
                style={{
                  display: "inline-block",
                  textDecoration: "none",
                  color: "inherit",
                  padding: "10px 12px",
                  borderRadius: 12,
                  border: "1px solid rgba(255,255,255,0.18)",
                  background: "rgba(255,255,255,0.06)",
                  fontWeight: 900,
                  opacity: 0.92,
                }}
              >
                Open full garnish page →
              </Link>
            </div>
          </div>
        ) : null}
      </Drawer>
    </div>
  );
}
