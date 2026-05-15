// bookingService.js — talks to /api/bookings
// Backend Booking model fields: property{id}, user{id}, checkInDate, checkOutDate,
//                               numberOfGuests, totalPrice, status, notes
const API = "http://localhost:8000/api";

export const bookingService = {

  // GET /api/bookings
  getAllBookings: async () => {
    const res = await fetch(`${API}/bookings`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  },

  // GET /api/bookings/{id}
  getBookingById: async (id) => {
    const res = await fetch(`${API}/bookings/${id}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  },

  // POST /api/bookings
  // Body must match Booking entity exactly:
  // { property: {id}, user: {id}, checkInDate: "YYYY-MM-DD",
  //   checkOutDate: "YYYY-MM-DD", numberOfGuests, totalPrice, status, notes }
  createBooking: async (bookingData) => {
    const res = await fetch(`${API}/bookings`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(bookingData),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Failed to create booking");
    return data;
  },

  // PUT /api/bookings/{id}  — full update
  updateBooking: async (id, bookingData) => {
    const res = await fetch(`${API}/bookings/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(bookingData),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Failed to update booking");
    return data;
  },

  // PATCH /api/bookings/{id}/status  — admin approve/reject
  // Body: { status: "confirmed" | "rejected" | "pending" }
  updateBookingStatus: async (id, status) => {
    const res = await fetch(`${API}/bookings/${id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Failed to update status");
    return data;
  },

  // DELETE /api/bookings/{id}
  deleteBooking: async (id) => {
    const res = await fetch(`${API}/bookings/${id}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Failed to delete booking");
    return data;
  },

  // GET /api/bookings/user/{userId}
  getBookingsByUser: async (userId) => {
    const res = await fetch(`${API}/bookings/user/${userId}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  },

  // GET /api/bookings/owner/{ownerId}
  getBookingsByOwner: async (ownerId) => {
    const res = await fetch(`${API}/bookings/owner/${ownerId}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  },

  // GET /api/bookings/property/{propertyId}
  getBookingsByProperty: async (propertyId) => {
    const res = await fetch(`${API}/bookings/property/${propertyId}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  },

  // GET /api/bookings/status/{status}
  getBookingsByStatus: async (status) => {
    const res = await fetch(`${API}/bookings/status/${status}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  },
};
