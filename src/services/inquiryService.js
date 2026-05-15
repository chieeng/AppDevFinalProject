// inquiryService.js — "Message Owner" feature uses /api/inquiries
// This replaces the old messageService for the tenant→admin inquiry flow.
// Backend Inquiry fields: property{id}, inquirer{id}, subject, message, email, phone, status
const API = "http://localhost:8000/api";

export const inquiryService = {

  // POST /api/inquiries  — tenant sends a message about a property
  // Body: { property: {id}, inquirer: {id}, subject, message, email, phone }
  createInquiry: async ({ propertyId, inquirerId, email, subject, message, phone }) => {
    const res = await fetch(`${API}/inquiries`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        property:  { id: propertyId },
        inquirer:  { id: inquirerId },
        subject:   subject || `Inquiry about property #${propertyId}`,
        message,
        email,
        phone:     phone || "",
        status:    "pending",
      }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Failed to send inquiry");
    return data;
  },

  // GET /api/inquiries  — all inquiries (admin only)
  getAllInquiries: async () => {
    const res = await fetch(`${API}/inquiries`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  },

  // GET /api/inquiries/user/{userId}  — inquiries sent by this user
  getInquiriesByUser: async (userId) => {
    const res = await fetch(`${API}/inquiries/user/${userId}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  },

  // PATCH /api/inquiries/{id}/reply  — admin replies
  // Body: { reply: "..." }
  replyToInquiry: async (id, reply) => {
    const res = await fetch(`${API}/inquiries/${id}/reply`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reply }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Failed to send reply");
    return data;
  },

  // PATCH /api/inquiries/{id}/read  — mark as read
  markAsRead: async (id) => {
    const res = await fetch(`${API}/inquiries/${id}/read`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  },

  // DELETE /api/inquiries/{id}
  deleteInquiry: async (id) => {
    const res = await fetch(`${API}/inquiries/${id}`, { method: "DELETE" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  },
};
