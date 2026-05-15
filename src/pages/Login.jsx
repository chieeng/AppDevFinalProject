import { useNavigate, Link } from "react-router-dom";
import { useState } from "react";
import { authService } from "../services/authService";

// Login page — handles both admin and regular user login
// IMPORTANT: Admin login goes through the backend to get the real database ID.
// This ensures ownerId is correct when the admin creates property listings.
function Login({ setIsLoggedIn }) {
  const navigate  = useNavigate();
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [error,    setError]    = useState("");
  const [loading,  setLoading]  = useState(false);

  const ADMIN_EMAIL = "admin@vacansee.com";

  const handleLogin = async () => {
    if (!email || !password) { setError("Please enter both email and password."); return; }
    setLoading(true);
    setError("");

    try {
      // All logins go through the backend — this gives us the real DB userId
      const response = await authService.login(email, password);

      // Store real DB userId — critical for bookings, inquiries, and property creation
      localStorage.setItem("userId",       String(response.userId));
      localStorage.setItem("userEmail",    response.email    || email);
      localStorage.setItem("userFullName", response.fullName || "User");
      localStorage.setItem("isLoggedIn",   "true");

      // Admin is identified by email — role stored separately
      const isAdmin = email.toLowerCase() === ADMIN_EMAIL.toLowerCase();
      localStorage.setItem("userRole", isAdmin ? "admin" : "user");

      setIsLoggedIn(true);
      navigate(isAdmin ? "/admin" : "/dashboard");

    } catch (err) {
      setError(err.message || "Login failed. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-logo">🏠</div>
          <h3>Welcome Back</h3>
          <p className="subtitle">Log in to access your bookings and messages</p>

          <div className="admin-hint">
            <strong>Admin:</strong> admin@vacansee.com / admin123
          </div>

          {error && <div className="error-message">{error}</div>}

          <input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleLogin()}
            disabled={loading}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleLogin()}
            disabled={loading}
          />

          <button className="btn-continue" onClick={handleLogin} disabled={loading}>
            {loading ? "Logging in..." : "Log In"}
          </button>

          <p className="other">
            No account yet? <Link to="/register" className="link">Sign up free</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;
