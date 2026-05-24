// appData.js — single source of truth for property listings
// Always loads from Spring Boot backend (/api/properties).
// Falls back to hardcoded mock data only when backend is offline.

const API      = "http://localhost:8000/api";
const LS_KEY   = "vs_properties";

// Normalize backend fields (BigDecimal price → Number, etc.)
const normalize = (p) => ({
  ...p,
  price:          Number(p.price)     || 0,
  areaSqft:       Number(p.areaSqft)  || null,
  bedrooms:       Number(p.bedrooms)  || null,
  bathrooms:      Number(p.bathrooms) || null,
  approvalStatus: p.approvalStatus || "approved",
});

// ── Fetch from backend and update the cache ──────────────────
export const loadPropertiesFromBackend = async () => {
  try {
    const res  = await fetch(`${API}/properties?page=0&size=500`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const list = Array.isArray(data) ? data : (data.content || []);
    const normalized = list.map(normalize);
    localStorage.setItem(LS_KEY, JSON.stringify(normalized));
    return normalized;
  } catch (err) {
    console.warn("Backend offline — using cached/mock properties:", err.message);
    return null;
  }
};

// ── Sync read — returns cached backend data OR mock fallback ─
export const getAllListings = () => {
  const cached = localStorage.getItem(LS_KEY);
  if (cached) {
    try {
      const list = JSON.parse(cached);
      if (Array.isArray(list) && list.length > 0) return list;
    } catch {}
  }
  return MOCK_LISTINGS;
};

// ── Get single listing by ID ──────────────────────────────────
export const getListingById = (id) =>
  getAllListings().find((l) => Number(l.id) === Number(id)) || null;

// ── Hardcoded fallback (backend offline only) ─────────────────
const MOCK_LISTINGS = [
  {
    id: 1, title: "Cozy Boarding House near UP Diliman",
    description: "Clean and comfortable boarding house with 6 rooms. Includes free WiFi, weekly laundry, and meals. Walking distance to UP Diliman.",
    price: 3500, propertyType: "Boarding House", status: "available",
    location: "118 Katipunan Avenue", city: "Quezon City", state: "Metro Manila", country: "Philippines",
    bedrooms: 2, bathrooms: 2,
    hasParking: true, hasGym: true,  hasPool: false, hasGarden: false, hasBalcony: false,
    hasWifi: true, hasMeals: true, petFriendly: false, createdAt: "2024-01-15T10:30:00",
  },
  {
    id: 2, title: "Budget Room near UST",
    description: "Affordable student-friendly room with free WiFi and 24/7 security. Minutes away from UST.",
    price: 2500, propertyType: "Bed Space", status: "available",
    location: "45 Espana Blvd", city: "Manila", state: "Metro Manila", country: "Philippines",
    bedrooms: 1, bathrooms: 1,
    hasParking: false, hasGym: false, hasPool: false, hasGarden: false, hasBalcony: false,
    hasWifi: true, hasMeals: false, petFriendly: false, createdAt: "2024-01-20T09:00:00",
  },
  {
    id: 3, title: "Boarding House in BGC Taguig",
    description: "Well-maintained boarding house in BGC. Gym access, parking included, and pet-friendly. Perfect for professionals working in the area.",
    price: 8500, propertyType: "Boarding House", status: "available",
    location: "30th Street", city: "Taguig", state: "Metro Manila", country: "Philippines",
    bedrooms: 2, bathrooms: 2,
    hasParking: true, hasGym: true, hasPool: true, hasGarden: false, hasBalcony: true,
    hasWifi: true, hasMeals: false, petFriendly: true, createdAt: "2024-02-01T11:00:00",
  },
  {
    id: 4, title: "Female Dorm near Ateneo",
    description: "Safe, female-only dormitory. Meals included, WiFi, near Ateneo de Manila.",
    price: 4000, propertyType: "Dormitory", status: "available",
    location: "65 Katipunan Ave", city: "Quezon City", state: "Metro Manila", country: "Philippines",
    bedrooms: 1, bathrooms: 2,
    hasParking: false, hasGym: false, hasPool: false, hasGarden: true, hasBalcony: false,
    hasWifi: true, hasMeals: true, petFriendly: false, createdAt: "2024-02-05T08:00:00",
  },
  {
    id: 5, title: "Bed Space near IT Park Cebu",
    description: "Affordable bed space near Cebu IT Park. Ideal for BPO workers and students. Free WiFi, with balcony access.",
    price: 5500, propertyType: "Bed Space", status: "available",
    location: "Cebu IT Park", city: "Cebu City", state: "Cebu", country: "Philippines",
    bedrooms: 1, bathrooms: 1,
    hasParking: true, hasGym: true, hasPool: false, hasGarden: false, hasBalcony: true,
    hasWifi: true, hasMeals: false, petFriendly: false, createdAt: "2024-02-10T10:00:00",
  },
  {
    id: 6, title: "Boarding House with Garden in Davao",
    description: "Pet-friendly boarding house with garden in a quiet subdivision. 3 rooms available, near Ateneo de Davao.",
    price: 6000, propertyType: "Boarding House", status: "available",
    location: "Matina District", city: "Davao City", state: "Davao del Sur", country: "Philippines",
    bedrooms: 3, bathrooms: 2,
    hasParking: true, hasGym: false, hasPool: false, hasGarden: true, hasBalcony: false,
    hasWifi: false, hasMeals: false, petFriendly: true, createdAt: "2024-02-15T09:00:00",
  },
];

