// src/lib/region.js
export const REGION_OPTIONS = [
  { code: "AU", label: "Australia" },
  { code: "NZ", label: "New Zealand" },
  { code: "UK", label: "United Kingdom" },
  { code: "IE", label: "Ireland" },
  { code: "CA", label: "Canada" },
];

export function regionFromLocale() {
  try {
    const loc = Intl.DateTimeFormat().resolvedOptions().locale || "";
    const m = String(loc).match(/-([A-Z]{2})\b/);
    const cc = m?.[1] || "";
    if (cc === "AU") return "AU";
    if (cc === "NZ") return "NZ";
    if (cc === "GB" || cc === "UK") return "UK";
    if (cc === "IE") return "IE";
    if (cc === "CA") return "CA";
    return "AU";
  } catch {
    return "AU";
  }
}

const KEY = "s2s_region";

export function getStoredRegion() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed.code === "string") return parsed.code;
    return null;
  } catch {
    return null;
  }
}

export function isRegionConfirmed() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return false;
    const parsed = JSON.parse(raw);
    return !!parsed?.confirmedAt && typeof parsed.code === "string";
  } catch {
    return false;
  }
}

export function setRegion(code) {
  const safe = String(code || "").toUpperCase();
  const allowed = new Set(REGION_OPTIONS.map(x => x.code));
  const final = allowed.has(safe) ? safe : "AU";
  try {
    localStorage.setItem(KEY, JSON.stringify({ code: final, confirmedAt: new Date().toISOString() }));
  } catch {}
  return final;
}

export function getEffectiveRegion() {
  return getStoredRegion() || regionFromLocale();
}
