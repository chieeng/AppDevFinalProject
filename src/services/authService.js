// authService.js — talks to POST /api/auth/register and POST /api/auth/login
const API = "http://localhost:8000/api";

export const authService = {

  // POST /api/auth/register
  // Body: { email, password, fullName, phone, role, businessPermitImage? }
  // Returns: { userId, email, fullName, role, accountStatus, message }
  register: async ({ fullName, email, password, phone, role, businessPermitImage }) => {
    const res = await fetch(`${API}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email, password, fullName,
        phone: phone || "",
        role: role || "TENANT",
        businessPermitImage: businessPermitImage || null,
      }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Registration failed");
    return data;
  },

  // POST /api/auth/login
  // Body: { email, password }
  // Returns: { userId, email, fullName, role, message }
  login: async (email, password) => {
    const res = await fetch(`${API}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Login failed");
    return data;
  },

  // GET /api/auth/user/{id}
  getUser: async (userId) => {
    const res = await fetch(`${API}/auth/user/${userId}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "User not found");
    return data;
  },
};
