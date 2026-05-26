import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getBookingsByUser } from "../data/adminData";

function Profile() {
  const [fullName, setFullName] = useState(localStorage.getItem("userFullName") || "");
  const [email] = useState(localStorage.getItem("userEmail") || "");
  const [emailNotif, setEmailNotif] = useState(() => localStorage.getItem("pref_emailNotif") !== "false");
  const [smsNotif, setSmsNotif]     = useState(() => localStorage.getItem("pref_smsNotif") === "true");
  const [newsletter, setNewsletter] = useState(() => localStorage.getItem("pref_newsletter") !== "false");
  const [saved, setSaved] = useState(false);
  const [bookings, setBookings] = useState([]);

  const userId = localStorage.getItem("userId") || "N/A";
  const savedCount = JSON.parse(localStorage.getItem("savedListings") || "[]").length;

  useEffect(() => {
    if (userId && userId !== "N/A") {
      getBookingsByUser(userId).then(setBookings).catch(() => {
        const cached = JSON.parse(localStorage.getItem("vs_bookings") || "[]");
        setBookings(cached.filter((b) => String(b.userId) === String(userId)));
      });
    }
  }, [userId]);

  const handleSave = () => {
    localStorage.setItem("userFullName",    fullName);
    localStorage.setItem("pref_emailNotif", String(emailNotif));
    localStorage.setItem("pref_smsNotif",   String(smsNotif));
    localStorage.setItem("pref_newsletter", String(newsletter));
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="profile-page">

      <div className="profile-banner">
        <div className="container profile-banner-inner">
          <div className="profile-avatar-big">
            {(fullName || "U")[0].toUpperCase()}
          </div>
          <div>
            <h1>{fullName || "My Profile"}</h1>
            <p>{email}</p>
            <div className="profile-quick-stats">
              <span>📋 {bookings.length} booking{bookings.length !== 1 ? "s" : ""}</span>
              <span>⏳ {bookings.filter((b) => b.status === "pending").length} pending</span>
              <span>✅ {bookings.filter((b) => b.status === "confirmed").length} confirmed</span>
              <span>❤️ {savedCount} saved</span>
            </div>
          </div>
        </div>
      </div>

      <div className="container profile-body">
        <div className="profile-grid">

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
            <Link to="/dashboard" className="profile-link-item">
              <span>❤️</span>
              <div>
                <strong>Saved Properties</strong>
                <p>{savedCount} saved listing{savedCount !== 1 ? "s" : ""}</p>
              </div>
              <span className="pli-arrow">→</span>
            </Link>
            <button className="profile-link-item" style={{ width: "100%", background: "none", border: "none", cursor: "pointer", textAlign: "left" }} onClick={() => window.dispatchEvent(new CustomEvent("open-chatbox"))}>
              <span>💬</span>
              <div>
                <strong>My Messages</strong>
                <p>View sent inquiries & replies</p>
              </div>
              <span className="pli-arrow">→</span>
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}

export default Profile;
