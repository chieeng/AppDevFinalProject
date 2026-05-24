import { useNavigate, Link } from "react-router-dom";
import { useState } from "react";
import { authService } from "../services/authService";

function Login({ setIsLoggedIn }) {
  const navigate  = useNavigate();
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [error,    setError]    = useState("");
  const [loading,  setLoading]  = useState(false);
  const [showHint, setShowHint] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) { setError("Please enter both email and password."); return; }
    setLoading(true);
    setError("");

    try {
      const response = await authService.login(email, password);

      localStorage.setItem("userId",       String(response.userId));
      localStorage.setItem("userEmail",    response.email    || email);
      localStorage.setItem("userFullName", response.fullName || "User");
      localStorage.setItem("isLoggedIn",   "true");

      // Role comes from backend: ADMIN | OWNER | TENANT
      const role = response.role || "TENANT";
      localStorage.setItem("userRole", role);

      setIsLoggedIn(true);
      if (role === "ADMIN")  navigate("/admin");
      else if (role === "OWNER") navigate("/owner-dashboard");
      else navigate("/dashboard");

    } catch (err) {
      setError(err.message || "Login failed. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e) => { if (e.key === "Enter") handleLogin(); };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-logo">🏠</div>
          <h3>Welcome Back</h3>
          <p className="subtitle">Log in to access your bookings and messages</p>

          {/* Demo hint — collapsed by default */}
          <button
            className="demo-hint-toggle"
            onClick={() => setShowHint(!showHint)}
            type="button"
          >
            {showHint ? "▲ Hide demo credentials" : "▼ Show demo credentials"}
          </button>
          {showHint && (
            <div className="admin-hint">
              <strong>Admin:</strong> admin@vacansee.com / admin123<br />
              <strong>Owner:</strong> Register with "Boarding House Owner" role<br />
              <strong>Tenant:</strong> Register with "Tenant" role (default)
            </div>
          )}

          {error && <div className="error-message">{error}</div>}

          <input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyPress={handleKey}
            disabled={loading}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyPress={handleKey}
            disabled={loading}
          />

          <button className="btn-continue" onClick={handleLogin} disabled={loading}>
            {loading ? "Logging in…" : "Log In"}
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
