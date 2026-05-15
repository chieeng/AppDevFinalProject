// propertyService.js — talks to /api/properties
// Backend returns Spring Page objects: { content: [...], totalElements, ... }
const API = "http://localhost:8000/api";

export const propertyService = {

  // GET /api/properties?page=0&size=100
  // Returns Spring Page: { content: [...], totalElements, totalPages, ... }
  getAllProperties: async (page = 0, size = 100) => {
    const res = await fetch(`${API}/properties?page=${page}&size=${size}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    // Unwrap Spring Page — return the content array
    return Array.isArray(data) ? data : (data.content || []);
  },

  // GET /api/properties/{id}
  // Returns PropertyDTO
  getPropertyById: async (id) => {
    const res = await fetch(`${API}/properties/${id}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  },

  // POST /api/properties
  // Body: PropertyDTO (ownerId is required by backend)
  // Returns: created PropertyDTO
  createProperty: async (propertyData) => {
    const res = await fetch(`${API}/properties`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(propertyData),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Failed to create property");
    return data;
  },

  // PUT /api/properties/{id}
  // Body: PropertyDTO (partial — only updated fields)
  updateProperty: async (id, propertyData) => {
    const res = await fetch(`${API}/properties/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(propertyData),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Failed to update property");
    return data;
  },

  // DELETE /api/properties/{id}
  deleteProperty: async (id) => {
    const res = await fetch(`${API}/properties/${id}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Failed to delete property");
    return data;
  },

  // GET /api/properties/owner/{ownerId}
  getPropertiesByOwner: async (ownerId) => {
    const res = await fetch(`${API}/properties/owner/${ownerId}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  },

  // GET /api/properties/city/{city}
  getPropertiesByCity: async (city, page = 0, size = 20) => {
    const res = await fetch(`${API}/properties/city/${encodeURIComponent(city)}?page=${page}&size=${size}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return Array.isArray(data) ? data : (data.content || []);
  },
};
