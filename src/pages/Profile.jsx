import { useState } from "react";
import { Link } from "react-router-dom";
import { getBookingsByUser } from "../data/adminData";

// Profile page - shows user info from localStorage + their booking stats
function Profile() {
  const [fullName, setFullName] = useState(localStorage.getItem("userFullName") || "");
  const [email] = useState(localStorage.getItem("userEmail") || "");
  const [emailNotif, setEmailNotif] = useState(true);
  const [smsNotif, setSmsNotif] = useState(false);
  const [newsletter, setNewsletter] = useState(true);
  const [saved, setSaved] = useState(false);

  const userId = localStorage.getItem("userId") || "N/A";
  const bookings = getBookingsByUser(userId);
  const savedCount = JSON.parse(localStorage.getItem("savedListings") || "[]").length;

  const handleSave = () => {
    localStorage.setItem("userFullName", fullName);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="profile-page">

      {/* TOP BANNER */}
      <div className="profile-banner">
        <div className="container profile-banner-inner">
          <div className="profile-avatar-big">
            {(fullName || "U")[0].toUpperCase()}
          </div>
          <div>
            <h1>{fullName || "My Profile"}</h1>
            <p>{email}</p>
            <div className="profile-quick-stats">
              <span>📋 {bookings.length} bookings</span>
              <span>❤️ {savedCount} saved</span>
              <span>🆔 #{userId.slice(0, 8)}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="container profile-body">

        <div className="profile-grid">

          {/* Personal Information */}
          <div className="profile-card">
            <h2>Personal Information</h2>

            <div className="profile-field">
              <label>Full Name</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Your full name"
              />
            </div>

            <div className="profile-field">
              <label>Email Address</label>
              <input
                type="email"
                value={email}
                readOnly
                className="input-readonly"
                title="Email cannot be changed here"
              />
              <small>Email address cannot be changed</small>
            </div>

            <div className="profile-field">
              <label>Account ID</label>
              <input type="text" value={`#${userId}`} readOnly className="input-readonly" />
            </div>

            {saved && <div className="profile-saved-msg">✅ Profile updated!</div>}
            <button className="save-btn" onClick={handleSave}>Save Changes</button>
          </div>

          {/* Notification Settings */}
          <div className="profile-card">
            <h2>Notification Settings</h2>

            <div className="setting-item">
              <div>
                <div className="setting-label">Email Notifications</div>
                <div className="setting-desc">Receive booking updates by email</div>
              </div>
              <label className="toggle-switch">
                <input type="checkbox" checked={emailNotif} onChange={(e) => setEmailNotif(e.target.checked)} />
                <span className="toggle-slider" />
              </label>
            </div>

            <div className="setting-item">
              <div>
                <div className="setting-label">SMS Notifications</div>
                <div className="setting-desc">Get text alerts for bookings</div>
              </div>
              <label className="toggle-switch">
                <input type="checkbox" checked={smsNotif} onChange={(e) => setSmsNotif(e.target.checked)} />
                <span className="toggle-slider" />
              </label>
            </div>

            <div className="setting-item">
              <div>
                <div className="setting-label">Newsletter</div>
                <div className="setting-desc">Weekly property deals and news</div>
              </div>
              <label className="toggle-switch">
                <input type="checkbox" checked={newsletter} onChange={(e) => setNewsletter(e.target.checked)} />
                <span className="toggle-slider" />
              </label>
            </div>
          </div>

          {/* Quick links card */}
          <div className="profile-card profile-links-card">
            <h2>My Activity</h2>
            <Link to="/dashboard" className="profile-link-item">
              <span>📋</span>
              <div>
                <strong>My Bookings</strong>
                <p>{bookings.length} booking request{bookings.length !== 1 ? "s" : ""}</p>
              </div>
              <span className="pli-arrow">→</span>
            </Link>
            <Link to="/saved" className="profile-link-item">
              <span>❤️</span>
              <div>
                <strong>Saved Properties</strong>
                <p>{savedCount} saved listing{savedCount !== 1 ? "s" : ""}</p>
              </div>
              <span className="pli-arrow">→</span>
            </Link>
            <Link to="/conversations" className="profile-link-item">
              <span>💬</span>
              <div>
                <strong>My Messages</strong>
                <p>View sent inquiries</p>
              </div>
              <span className="pli-arrow">→</span>
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
}

export default Profile;
