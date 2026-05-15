// favoriteService.js — talks to /api/favorites (new backend endpoint)
// Falls back to localStorage if backend is offline
const API = "http://localhost:8000/api";
const LS_KEY = "savedListings";

const lsGetIds = () => JSON.parse(localStorage.getItem(LS_KEY) || "[]");
const lsSetIds = (ids) => localStorage.setItem(LS_KEY, JSON.stringify(ids));

export const favoriteService = {

  // GET /api/favorites/user/{userId}  — returns array of property IDs
  getFavoriteIds: async (userId) => {
    if (!userId || localStorage.getItem("userRole") === "admin") return lsGetIds();
    try {
      const res = await fetch(`${API}/favorites/user/${userId}`);
      if (!res.ok) throw new Error();
      const ids = await res.json();    // backend returns Long[] array
      lsSetIds(ids);                   // sync to localStorage as cache
      return ids;
    } catch {
      return lsGetIds();               // offline fallback
    }
  },

  // POST /api/favorites  — add a favorite
  // Body: { userId, propertyId }
  addFavorite: async (userId, propertyId) => {
    // Optimistic update to localStorage first
    const ids = lsGetIds();
    if (!ids.includes(propertyId)) lsSetIds([...ids, propertyId]);

    if (!userId || localStorage.getItem("userRole") === "admin") return;
    try {
      await fetch(`${API}/favorites`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: Number(userId),
          propertyId: Number(propertyId),
        }),
      });
    } catch {
      // Backend offline — localStorage already updated
    }
  },

  // DELETE /api/favorites?userId=1&propertyId=3  — remove a favorite
  removeFavorite: async (userId, propertyId) => {
    // Optimistic update
    const ids = lsGetIds();
    lsSetIds(ids.filter((id) => id !== propertyId));

    if (!userId || localStorage.getItem("userRole") === "admin") return;
    try {
      await fetch(
        `${API}/favorites?userId=${Number(userId)}&propertyId=${Number(propertyId)}`,
        { method: "DELETE" }
      );
    } catch {
      // Backend offline — localStorage already updated
    }
  },

  // Toggle saved state — returns new boolean isSaved
  toggle: async (userId, propertyId) => {
    const ids = lsGetIds();
    if (ids.includes(propertyId)) {
      await favoriteService.removeFavorite(userId, propertyId);
      return false;
    } else {
      await favoriteService.addFavorite(userId, propertyId);
      return true;
    }
  },

  // Sync-safe check (localStorage only, no async)
  isSaved: (propertyId) => lsGetIds().includes(propertyId),
};
