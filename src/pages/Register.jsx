import { useNavigate, Link } from "react-router-dom";
import { useState } from "react";
import { authService } from "../services/authService";

function Register({ setIsLoggedIn }) {
  const navigate = useNavigate();

  const [selectedRole, setSelectedRole] = useState("TENANT");
  const [formData, setFormData] = useState({
    fullName: "", email: "", password: "", confirmPassword: "",
  });
  const [permitImage, setPermitImage]   = useState(null);   // base64
  const [permitPreview, setPermitPreview] = useState(null); // blob URL for preview
  const [error,   setError]   = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [pending, setPending] = useState(false); // owner submitted, awaiting admin

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

  const handlePermitUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setError("Business permit image must be under 5 MB.");
      return;
    }
    setPermitPreview(URL.createObjectURL(file));
    const reader = new FileReader();
    reader.onloadend = () => setPermitImage(reader.result);
    reader.readAsDataURL(file);
    setError("");
  };

  const removePermit = () => {
    setPermitImage(null);
    setPermitPreview(null);
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
    if (selectedRole === "OWNER" && !permitImage) {
      setError("Please upload your business permit image to continue.");
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
        businessPermitImage: selectedRole === "OWNER" ? permitImage : null,
      };
      const response = await authService.register(payload);

      if (selectedRole === "OWNER") {
        // Owner accounts need admin approval — do NOT log in
        setPending(true);
      } else {
        // Tenant — log in immediately
        const role = response.role || "TENANT";
        localStorage.setItem("userId",       String(response.userId));
        localStorage.setItem("userEmail",    response.email    || formData.email);
        localStorage.setItem("userFullName", response.fullName || formData.fullName);
        localStorage.setItem("userRole",     role);
        localStorage.setItem("isLoggedIn",   "true");
        if (setIsLoggedIn) setIsLoggedIn(true);
        setSuccess("Account created! Redirecting to your dashboard…");
        setTimeout(() => navigate("/dashboard"), 1500);
      }
    } catch (err) {
      setError(err.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e) => { if (e.key === "Enter") handleRegister(); };
  const disabled = loading || !!success || pending;

  // ── Pending approval screen (shown after owner submits) ───────
  if (pending) {
    return (
      <div className="auth-page">
        <div className="auth-container">
          <div className="auth-card">
            <div className="auth-logo">⏳</div>
            <h3>Application Submitted!</h3>
            <div className="owner-pending-card">
              <p>Your owner account application has been received.</p>
              <ul className="owner-pending-steps">
                <li>✅ Account created</li>
                <li>⏳ Admin review — in progress</li>
                <li>📧 You will be notified once approved</li>
              </ul>
              <p style={{ fontSize: "13px", color: "var(--color-text-muted)", marginTop: "12px" }}>
                Once your business permit is verified, you can log in and start listing your property.
              </p>
            </div>
            <Link to="/login" className="btn-continue" style={{ display: "block", textAlign: "center", textDecoration: "none", marginTop: "16px" }}>
              Go to Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

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

          {/* ── Owner: business permit upload ─────── */}
          {selectedRole === "OWNER" && (
            <div className="owner-extra-fields">
              <p className="owner-extra-label">📋 Business Permit Required</p>
              <p style={{ fontSize: "13px", color: "var(--color-text-muted)", marginBottom: "10px", lineHeight: 1.5 }}>
                Upload a photo of your DTI / Mayor's Permit / Business Permit. Your account will be reviewed by admin before activation.
              </p>

              {permitPreview ? (
                <div className="permit-preview-wrap">
                  <img src={permitPreview} alt="Business permit preview" className="permit-preview-img" />
                  <button type="button" className="permit-remove-btn" onClick={removePermit} disabled={disabled}>
                    ✕ Remove
                  </button>
                </div>
              ) : (
                <label className="permit-upload-zone">
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,application/pdf"
                    onChange={handlePermitUpload}
                    disabled={disabled}
                    style={{ display: "none" }}
                  />
                  <span className="permit-upload-icon">📄</span>
                  <span className="permit-upload-text">Click to upload business permit</span>
                  <span className="permit-upload-hint">JPG, PNG, WEBP — max 5 MB</span>
                </label>
              )}
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
              ? "Submit Owner Application"
              : "Create Account"}
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
