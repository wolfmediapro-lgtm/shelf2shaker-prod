// src/components/RegionConfirmSheet.jsx
import React, { useMemo, useState } from "react";
import { REGION_OPTIONS } from "../lib/region.js";

export default function RegionConfirmSheet({ open, initialCode, onConfirm }) {
  const initial = initialCode || "AU";
  const [code, setCode] = useState(initial);

  const opts = useMemo(() => REGION_OPTIONS, []);
  if (!open) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.55)",
        zIndex: 9999,
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
        padding: 14,
      }}
      role="dialog"
      aria-modal="true"
    >
      <div
        style={{
          width: "min(720px, 100%)",
          borderRadius: 18,
          background: "rgba(18,18,18,0.96)",
          border: "1px solid rgba(255,255,255,0.10)",
          boxShadow: "0 20px 60px rgba(0,0,0,0.55)",
          padding: 16,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 900 }}>Confirm your region</div>
            <div style={{ opacity: 0.75, fontSize: 13, marginTop: 4 }}>
              We use this for local ingredient availability and sponsored picks. VPNs can confuse device locale.
            </div>
          </div>
          <div
            style={{
              width: 38,
              height: 5,
              borderRadius: 999,
              background: "rgba(255,255,255,0.18)",
              marginLeft: 10,
            }}
          />
        </div>

        <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ fontWeight: 800, opacity: 0.9 }}>Region</div>

          <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
            {opts.map((o) => (
              <button
                key={o.code}
                onClick={() => setCode(o.code)}
                style={{
                  padding: "10px 12px",
                  borderRadius: 12,
                  border: "1px solid rgba(255,255,255,0.16)",
                  background: code === o.code ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.06)",
                  color: "inherit",
                  cursor: "pointer",
                  fontWeight: 900,
                }}
              >
                {o.label}
              </button>
            ))}
          </div>

          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 10 }}>
            <button
              onClick={() => onConfirm(code)}
              style={{
                padding: "10px 14px",
                borderRadius: 12,
                border: "1px solid rgba(255,255,255,0.22)",
                background: "rgba(255,255,255,0.10)",
                color: "inherit",
                cursor: "pointer",
                fontWeight: 950,
              }}
            >
              Confirm
            </button>
          </div>

          <div style={{ opacity: 0.6, fontSize: 12 }}>
            You can change this later in Settings (we’ll add that when you’re ready).
          </div>
        </div>
      </div>
    </div>
  );
}
