// appData.js — single source of truth for property listings
// Always loads from Spring Boot backend (/api/properties).
// Images are kept in the module-level memory cache only — never written to
// localStorage — to avoid the 5-10 MB storage quota being exceeded.

const API    = "http://localhost:8000/api";
const LS_KEY = "vs_properties";

// Module-level memory cache: includes featuredImage for display
let _memCache = null;

const normalize = (p) => ({
  ...p,
  price:          Number(p.price)     || 0,
  areaSqft:       Number(p.areaSqft)  || null,
  bedrooms:       Number(p.bedrooms)  || null,
  bathrooms:      Number(p.bathrooms) || null,
  approvalStatus: p.approvalStatus || "approved",
});

// Strip image before writing to localStorage to stay within quota
const stripImage = (p) => ({ ...p, featuredImage: null });

// ── Fetch from backend, update both memory cache and localStorage ────
export const loadPropertiesFromBackend = async () => {
  try {
    const res  = await fetch(`${API}/properties?page=0&size=500`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const list = Array.isArray(data) ? data : (data.content || []);
    const normalized = list.map(normalize);
    _memCache = normalized;                                             // keep images in RAM
    localStorage.setItem(LS_KEY, JSON.stringify(normalized.map(stripImage))); // no images on disk
    return normalized;
  } catch (err) {
    console.warn("Backend offline — property list unavailable:", err.message);
    return null;
  }
};

// ── Sync read — memory first, then localStorage fallback (no images) ─
export const getAllListings = () => {
  if (_memCache) return _memCache;
  const cached = localStorage.getItem(LS_KEY);
  if (cached) {
    try {
      const list = JSON.parse(cached);
      if (Array.isArray(list)) return list;
    } catch {}
  }
  return [];
};

// ── Get single listing by ID ─────────────────────────────────────────
export const getListingById = (id) =>
  getAllListings().find((l) => Number(l.id) === Number(id)) || null;
