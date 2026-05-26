import { Link, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import logo from "../images/logo.png";

function Navbar({ isLoggedIn, setIsLoggedIn, isAdmin, isOwner }) {
  const location = useLocation();
  const navigate  = useNavigate();
  const isActive  = (p) => location.pathname === p ? "active" : "";

  const [dark, setDark]           = useState(() => localStorage.getItem("theme") === "dark");
  const [dropdownOpen, setDropdown] = useState(false);

  const userName  = localStorage.getItem("userFullName") || "User";
  const initials  = userName.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", dark ? "dark" : "light");
    localStorage.setItem("theme", dark ? "dark" : "light");
  }, [dark]);

  useEffect(() => {
    const saved = localStorage.getItem("theme") || "light";
    document.documentElement.setAttribute("data-theme", saved);
    setDark(saved === "dark");
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const close = (e) => { if (!e.target.closest(".nav-profile-menu")) setDropdown(false); };
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, []);

  const handleLogout = () => {
    ["userId","userEmail","userFullName","userRole","isLoggedIn"].forEach((k) => localStorage.removeItem(k));
    setIsLoggedIn(false);
    navigate("/");
  };

  // Admin navbar
  if (isAdmin) {
    return (
      <nav className="navbar navbar-admin">
        <div className="container navbar-inner">
          <Link to="/admin" className="logo">
            <img src={logo} alt="VacanSee" className="logo-img" />
            <span>VacanSee</span>
            <span className="admin-badge">ADMIN</span>
          </Link>
          <div className="auth-buttons">
            <button className="theme-toggle" onClick={() => setDark(!dark)} title="Toggle theme">
              {dark ? "☀️" : "🌙"}
            </button>
            <button className="nav-login-btn" onClick={handleLogout}>Logout</button>
          </div>
        </div>
      </nav>
    );
  }

  // Owner navbar — focused on their dashboard
  if (isOwner) {
    return (
      <nav className="navbar navbar-owner">
        <div className="container navbar-inner">
          <Link to="/owner-dashboard" className="logo">
            <img src={logo} alt="VacanSee" className="logo-img" />
            <span>VacanSee</span>
            <span className="owner-badge">OWNER</span>
          </Link>
          <ul className="nav-links">
            <li><Link to="/"       className={isActive("/")}>Home</Link></li>
            <li><Link to="/browse" className={isActive("/browse")}>Browse</Link></li>
          </ul>
          <div className="auth-buttons">
            <button className="theme-toggle" onClick={() => setDark(!dark)} title="Toggle theme">
              {dark ? "☀️" : "🌙"}
            </button>
            <Link to="/owner-dashboard" className="nav-cta-btn">My Dashboard</Link>
            <div className="nav-profile-menu">
              <button
                className="nav-profile-btn"
                onClick={(e) => { e.stopPropagation(); setDropdown(!dropdownOpen); }}
              >
                <span className="nav-profile-avatar">{initials}</span>
                <span className="nav-profile-name">{userName.split(" ")[0]}</span>
                <span className="nav-profile-chevron">{dropdownOpen ? "▲" : "▾"}</span>
              </button>
              {dropdownOpen && (
                <div className="nav-dropdown">
                  <div className="nav-dropdown-header">
                    <span className="ndh-name">{userName}</span>
                    <span className="ndh-email">{localStorage.getItem("userEmail")}</span>
                  </div>
                  <hr />
                  <Link to="/owner-dashboard" onClick={() => setDropdown(false)}>🏠 My Dashboard</Link>
                  <Link to="/profile"         onClick={() => setDropdown(false)}>👤 My Profile</Link>
                  <hr />
                  <button onClick={handleLogout}>🚪 Logout</button>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>
    );
  }

  return (
    <nav className="navbar">
      <div className="container navbar-inner">

        <Link to="/" className="logo">
          <img src={logo} alt="VacanSee" className="logo-img" />
          <span>VacanSee</span>
        </Link>

        <ul className="nav-links">
          <li><Link to="/"        className={isActive("/")}>Home</Link></li>
          <li><Link to="/browse"  className={isActive("/browse")}>Browse</Link></li>
          <li><Link to="/about"   className={isActive("/about")}>About</Link></li>
        </ul>

        <div className="auth-buttons">

          {/* Dark mode toggle */}
          <button className="theme-toggle" onClick={() => setDark(!dark)} title="Toggle dark mode">
            {dark ? "☀️" : "🌙"}
          </button>

          {isLoggedIn ? (
            <>
              {/* Dashboard shortcut for tenants */}
              <Link to="/dashboard" className="nav-cta-btn">Dashboard</Link>

              {/* Profile button — shows initials + name, click opens dropdown */}
              <div className="nav-profile-menu">
                <button
                  className="nav-profile-btn"
                  onClick={(e) => { e.stopPropagation(); setDropdown(!dropdownOpen); }}
                >
                  <span className="nav-profile-avatar">{initials}</span>
                  <span className="nav-profile-name">{userName.split(" ")[0]}</span>
                  <span className="nav-profile-chevron">{dropdownOpen ? "▲" : "▾"}</span>
                </button>

                {dropdownOpen && (
                  <div className="nav-dropdown">
                    <div className="nav-dropdown-header">
                      <span className="ndh-name">{userName}</span>
                      <span className="ndh-email">{localStorage.getItem("userEmail")}</span>
                    </div>
                    <hr />
                    <Link to="/profile"   onClick={() => setDropdown(false)}>👤 My Profile</Link>
                    <Link to="/dashboard" onClick={() => setDropdown(false)}>📊 Dashboard</Link>
                    <hr />
                    <button onClick={handleLogout}>🚪 Logout</button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <Link to="/login"><button className="nav-login-btn">Log In</button></Link>
              <Link to="/register"><button className="nav-register-btn">Sign Up</button></Link>
            </>
          )}
        </div>

      </div>
    </nav>
  );
}

export default Navbar;
