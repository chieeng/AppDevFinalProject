import { useNavigate, Link } from "react-router-dom";
import { useState } from "react";
import { authService } from "../services/authService";

function Register({ setIsLoggedIn }) {
  const navigate = useNavigate();

  const [selectedRole, setSelectedRole] = useState("TENANT");
  const [formData, setFormData] = useState({
    fullName: "", email: "", password: "", confirmPassword: "",
  });
  const [error,   setError]   = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) =>
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const selectRole = (role) => {
    if (loading || !!success) return;
    setSelectedRole(role);
    setError("");
  };

  const handleRoleKey = (e, role) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      selectRole(role);
    }
  };

  const handleRegister = async () => {
    if (!formData.fullName.trim() || !formData.email.trim() || !formData.password) {
      setError("Please fill in all required fields.");
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const payload = {
        fullName: formData.fullName.trim(),
        email:    formData.email.trim(),
        password: formData.password,
        role:     selectedRole,
      };
      const response = await authService.register(payload);
      const role = response.role || selectedRole;
      localStorage.setItem("userId",       String(response.userId));
      localStorage.setItem("userEmail",    response.email    || formData.email);
      localStorage.setItem("userFullName", response.fullName || formData.fullName);
      localStorage.setItem("userRole",     role);
      localStorage.setItem("isLoggedIn",   "true");
      if (setIsLoggedIn) setIsLoggedIn(true);
      setSuccess(
        role === "OWNER"
          ? "Owner account created! Redirecting to your dashboard…"
          : "Account created! Redirecting to your dashboard…"
      );
      setTimeout(() => navigate(role === "OWNER" ? "/owner-dashboard" : "/dashboard"), 1500);
    } catch (err) {
      setError(err.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e) => { if (e.key === "Enter") handleRegister(); };

  const disabled = loading || !!success;

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-card auth-card-register">
          <div className="auth-logo">🏠</div>
          <h3>Create Account</h3>
          <p className="subtitle">Join thousands finding their perfect boarding house</p>

          {error   && <div className="error-message">{error}</div>}
          {success && <div className="success-message">{success}</div>}

          {/* ── Role selector ─────────────────────── */}
          <p className="role-selector-heading">I am signing up as a</p>
          <div className="role-selector-grid">

            <div
              className={`role-option${selectedRole === "TENANT" ? " active" : ""}`}
              data-role="tenant"
              role="button"
              tabIndex={0}
              aria-pressed={selectedRole === "TENANT"}
              onClick={() => selectRole("TENANT")}
              onKeyDown={(e) => handleRoleKey(e, "TENANT")}
            >
              <span className="role-option-icon">👤</span>
              <span className="role-option-label">Tenant</span>
              <span className="role-option-desc">Looking for a place to stay</span>
            </div>

            <div
              className={`role-option${selectedRole === "OWNER" ? " active" : ""}`}
              data-role="owner"
              role="button"
              tabIndex={0}
              aria-pressed={selectedRole === "OWNER"}
              onClick={() => selectRole("OWNER")}
              onKeyDown={(e) => handleRoleKey(e, "OWNER")}
            >
              <span className="role-option-icon">🏠</span>
              <span className="role-option-label">Owner</span>
              <span className="role-option-desc">Listing my boarding house</span>
            </div>

          </div>

          {/* ── Common fields ──────────────────────── */}
          <input
            name="fullName"
            type="text"
            placeholder="Full Name"
            value={formData.fullName}
            onChange={handleChange}
            onKeyPress={handleKey}
            disabled={disabled}
          />
          <input
            name="email"
            type="email"
            placeholder="Email Address"
            value={formData.email}
            onChange={handleChange}
            onKeyPress={handleKey}
            disabled={disabled}
          />
          <input
            name="password"
            type="password"
            placeholder="Password (min 6 characters)"
            value={formData.password}
            onChange={handleChange}
            onKeyPress={handleKey}
            disabled={disabled}
          />
          <input
            name="confirmPassword"
            type="password"
            placeholder="Confirm Password"
            value={formData.confirmPassword}
            onChange={handleChange}
            onKeyPress={handleKey}
            disabled={disabled}
          />

          {/* ── Owner note ────────────────────────── */}
          {selectedRole === "OWNER" && (
            <div className="owner-extra-fields">
              <p className="owner-extra-label">🏠 Owner account</p>
              <p style={{ fontSize: "13px", color: "var(--color-text-muted)", margin: 0, lineHeight: 1.5 }}>
                After registration you will be taken to your Owner Dashboard where you can add and manage your listings.
              </p>
            </div>
          )}

          {/* ── Submit ────────────────────────────── */}
          <button
            className={`btn-continue${selectedRole === "OWNER" ? " btn-continue-owner" : ""}`}
            onClick={handleRegister}
            disabled={disabled}
          >
            {loading
              ? "Creating account…"
              : success
              ? "Redirecting…"
              : selectedRole === "OWNER"
              ? "Create owner account"
              : "Create tenant account"}
          </button>

          <p className="other">
            Already have an account? <Link to="/login" className="link">Log in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Register;
