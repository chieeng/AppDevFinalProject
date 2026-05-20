// authService.js — talks to /api/auth/* endpoints
const API = "http://localhost:8000/api";

export const authService = {

  // POST /api/auth/register
  register: async ({ fullName, email, password, phone, role }) => {
    const res = await fetch(`${API}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, fullName, phone: phone || "", role: role || "TENANT" }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Registration failed");
    return data;
  },

  // POST /api/auth/login
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

  // PUT /api/auth/user/{id} — update fullName, phone, bio, profileImage
  updateProfile: async (userId, profileData) => {
    const res = await fetch(`${API}/auth/user/${userId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(profileData),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Failed to update profile");
    return data;
  },

  // PATCH /api/auth/user/{id}/password — change password
  changePassword: async (userId, oldPassword, newPassword) => {
    const res = await fetch(`${API}/auth/user/${userId}/password`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ oldPassword, newPassword }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Failed to change password");
    return data;
  },

  // POST /api/auth/forgot-password — returns { tempPassword } for demo
  forgotPassword: async (email) => {
    const res = await fetch(`${API}/auth/forgot-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Failed to reset password");
    return data;
  },
};
