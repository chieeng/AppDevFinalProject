import { useNavigate, Link } from "react-router-dom";
import { useState } from "react";
import { authService } from "../services/authService";

function Register({ setIsLoggedIn }) {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ fullName: "", email: "", password: "", confirmPassword: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleRegister = async () => {
    if (!formData.fullName || !formData.email || !formData.password) {
      setError("Please fill in all fields.");
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
    try {
      const response = await authService.register(formData);
      localStorage.setItem("userId", response.userId);
      localStorage.setItem("userEmail", response.email || formData.email);
      localStorage.setItem("userFullName", response.fullName || formData.fullName);
      localStorage.setItem("userRole", "user");
      localStorage.setItem("isLoggedIn", "true");
      if (setIsLoggedIn) setIsLoggedIn(true);
      alert("Account created! Welcome to VacanSee.");
      navigate("/dashboard");
    } catch (err) {
      setError(err.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-logo">🏠</div>
          <h3>Create Account</h3>
          <p className="subtitle">Join thousands finding their perfect boarding house</p>

          {error && <div className="error-message">{error}</div>}

          <input name="fullName" type="text" placeholder="Full Name" value={formData.fullName} onChange={handleChange} disabled={loading} />
          <input name="email" type="email" placeholder="Email Address" value={formData.email} onChange={handleChange} disabled={loading} />
          <input name="password" type="password" placeholder="Password (min 6 chars)" value={formData.password} onChange={handleChange} disabled={loading} />
          <input name="confirmPassword" type="password" placeholder="Confirm Password" value={formData.confirmPassword} onChange={handleChange} disabled={loading} />

          <button className="btn-continue" onClick={handleRegister} disabled={loading}>
            {loading ? "Creating account..." : "Create Account"}
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
