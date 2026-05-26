import { Link } from "react-router-dom";

// Footer - appears at the bottom of every page
// Contains nav links, contact info, and copyright
function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="container footer-inner">

        {/* BRAND COLUMN */}
        <div className="footer-brand">
          <h3>🏠 VacanSee</h3>
          <p>Your trusted platform for finding affordable and comfortable boarding houses across the Philippines.</p>
          <div className="footer-socials">
            <span>📘</span>
            <span>🐦</span>
            <span>📸</span>
          </div>
        </div>

        {/* QUICK LINKS */}
        <div className="footer-col">
          <h4>Explore</h4>
          <Link to="/">Home</Link>
          <Link to="/browse">Browse Listings</Link>
          <Link to="/about">About Us</Link>
        </div>

        {/* ACCOUNT LINKS */}
        <div className="footer-col">
          <h4>Account</h4>
          {localStorage.getItem("isLoggedIn") !== "true" && (
            <>
              <Link to="/login">Log In</Link>
              <Link to="/register">Sign Up</Link>
            </>
          )}
          <Link to="/dashboard">Dashboard</Link>
          <Link to="/profile">My Profile</Link>
        </div>

        {/* CONTACT INFO */}
        <div className="footer-col">
          <h4>Contact</h4>
          <p>📍 Baguio City, Philippines</p>
          <p>📞 +63 912 345 6789</p>
          <p>✉️ support@vacansee.com</p>
          <p>🕒 Mon–Fri, 9AM–6PM</p>
        </div>

      </div>

      {/* BOTTOM BAR */}
      <div className="footer-bottom">
        <div className="container">
          <p>© {currentYear} VacanSee. All rights reserved.</p>
        </div>
      </div>

    </footer>
  );
}

export default Footer;
