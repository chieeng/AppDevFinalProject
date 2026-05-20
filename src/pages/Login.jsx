import { useNavigate, Link } from "react-router-dom";
import { useState } from "react";
import { authService } from "../services/authService";

function Login({ setIsLoggedIn }) {
  const navigate  = useNavigate();
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [error,    setError]    = useState("");
  const [loading,  setLoading]  = useState(false);

  // Forgot password state
  const [showForgot, setShowForgot]   = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotResult, setForgotResult]   = useState(null);
  const [forgotError, setForgotError]     = useState("");

  const ADMIN_EMAIL = "admin@vacansee.com";

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

      // Determine role: backend now returns role, but admin email overrides
      const isAdminEmail = email.toLowerCase() === ADMIN_EMAIL.toLowerCase();
      const backendRole  = (response.role || "TENANT").toUpperCase();
      let storeRole;
      if (isAdminEmail) {
        storeRole = "admin";
      } else if (backendRole === "LANDLORD") {
        storeRole = "landlord";
      } else {
        storeRole = "user";
      }
      localStorage.setItem("userRole", storeRole);

      setIsLoggedIn(true);
      if (storeRole === "admin" || storeRole === "landlord") {
        navigate("/admin");
      } else {
        navigate("/dashboard");
      }

    } catch (err) {
      setError(err.message || "Login failed. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!forgotEmail.trim()) { setForgotError("Please enter your email address."); return; }
    setForgotLoading(true);
    setForgotError("");
    setForgotResult(null);
    try {
      const res = await authService.forgotPassword(forgotEmail.trim());
      setForgotResult(res);
    } catch (err) {
      setForgotError(err.message || "Failed to reset password.");
    } finally {
      setForgotLoading(false);
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

          <div style={{ textAlign: "right", marginBottom: "8px" }}>
            <button
              type="button"
              className="link"
              style={{ background: "none", border: "none", cursor: "pointer", fontSize: "13px", color: "var(--color-primary)", padding: 0 }}
              onClick={() => { setShowForgot(true); setForgotEmail(email); setForgotResult(null); setForgotError(""); }}
            >
              Forgot Password?
            </button>
          </div>

          <button className="btn-continue" onClick={handleLogin} disabled={loading}>
            {loading ? "Logging in..." : "Log In"}
          </button>

          <p className="other">
            No account yet? <Link to="/register" className="link">Sign up free</Link>
          </p>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgot && (
        <div className="modal-overlay" onClick={() => setShowForgot(false)}>
          <div className="modal-content" style={{ maxWidth: "420px" }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h2>Reset Password</h2>
                <p>Enter your email to receive a temporary password</p>
              </div>
              <button className="close-btn" onClick={() => setShowForgot(false)}>✕</button>
            </div>
            <div className="modal-body">
              {!forgotResult ? (
                <>
                  <input
                    type="email"
                    placeholder="Your email address"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    disabled={forgotLoading}
                    style={{ width: "100%", marginBottom: "12px" }}
                  />
                  {forgotError && <div className="error-message">{forgotError}</div>}
                </>
              ) : (
                <div style={{ textAlign: "center", padding: "10px 0" }}>
                  <div style={{ fontSize: "36px", marginBottom: "10px" }}>✅</div>
                  <p style={{ marginBottom: "12px", color: "var(--color-text-secondary)" }}>{forgotResult.message}</p>
                  {forgotResult.tempPassword && (
                    <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "10px", padding: "14px", marginTop: "10px" }}>
                      <div style={{ fontSize: "12px", color: "#059669", marginBottom: "6px", fontWeight: 600 }}>YOUR TEMPORARY PASSWORD</div>
                      <div style={{ fontSize: "20px", fontWeight: 700, letterSpacing: "2px", color: "#065f46", fontFamily: "monospace" }}>
                        {forgotResult.tempPassword}
                      </div>
                      <div style={{ fontSize: "12px", color: "#6b7280", marginTop: "8px" }}>
                        Use this to log in, then change your password in Profile settings.
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="modal-footer">
              {!forgotResult ? (
                <>
                  <button className="btn-cancel" onClick={() => setShowForgot(false)}>Cancel</button>
                  <button className="btn-send" onClick={handleForgotPassword} disabled={forgotLoading}>
                    {forgotLoading ? "Sending..." : "Reset Password"}
                  </button>
                </>
              ) : (
                <button className="btn-continue" onClick={() => setShowForgot(false)} style={{ width: "100%" }}>
                  Close & Log In
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Login;
