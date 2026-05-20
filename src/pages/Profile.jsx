import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getBookingsByUser } from "../data/adminData";
import { authService } from "../services/authService";

function Profile() {
  const userId  = localStorage.getItem("userId") || "N/A";
  const [email] = useState(localStorage.getItem("userEmail") || "");

  const [fullName, setFullName] = useState(localStorage.getItem("userFullName") || "");
  const [phone, setPhone]       = useState(localStorage.getItem("userPhone") || "");
  const [profileImage, setProfileImage] = useState(null);
  const [profileSaved, setProfileSaved] = useState(false);
  const [profileError, setProfileError] = useState("");
  const [profileLoading, setProfileLoading] = useState(false);

  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwLoading, setPwLoading] = useState(false);
  const [pwSuccess, setPwSuccess] = useState("");
  const [pwError, setPwError]     = useState("");

  const [emailNotif, setEmailNotif] = useState(true);
  const [smsNotif, setSmsNotif]     = useState(false);
  const [newsletter, setNewsletter] = useState(true);

  const [bookings, setBookings] = useState([]);
  const savedCount = JSON.parse(localStorage.getItem("savedListings") || "[]").length;

  useEffect(() => {
    // Load bookings count
    getBookingsByUser(userId).then(setBookings).catch(() => {});
    // Load phone from backend if available
    authService.getUser(userId).then((u) => {
      if (u.phone) { setPhone(u.phone); localStorage.setItem("userPhone", u.phone); }
      if (u.profileImage) setProfileImage(u.profileImage);
    }).catch(() => {});
  }, [userId]);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setProfileImage(reader.result);
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = async () => {
    setProfileLoading(true);
    setProfileError("");
    try {
      await authService.updateProfile(userId, { fullName, phone, profileImage });
      localStorage.setItem("userFullName", fullName);
      localStorage.setItem("userPhone", phone);
      setProfileSaved(true);
      setTimeout(() => setProfileSaved(false), 2500);
    } catch (err) {
      // Fallback: save locally
      localStorage.setItem("userFullName", fullName);
      localStorage.setItem("userPhone", phone);
      setProfileSaved(true);
      setTimeout(() => setProfileSaved(false), 2500);
    } finally {
      setProfileLoading(false);
    }
  };

  const handleChangePassword = async () => {
    setPwError("");
    setPwSuccess("");
    if (!oldPassword || !newPassword) { setPwError("Please fill in all password fields."); return; }
    if (newPassword.length < 6) { setPwError("New password must be at least 6 characters."); return; }
    if (newPassword !== confirmPassword) { setPwError("New passwords do not match."); return; }
    setPwLoading(true);
    try {
      await authService.changePassword(userId, oldPassword, newPassword);
      setPwSuccess("Password changed successfully!");
      setOldPassword(""); setNewPassword(""); setConfirmPassword("");
      setTimeout(() => setPwSuccess(""), 3000);
    } catch (err) {
      setPwError(err.message || "Failed to change password.");
    } finally {
      setPwLoading(false);
    }
  };

  const avatarSrc = profileImage;
  const avatarLetter = (fullName || "U")[0].toUpperCase();

  return (
    <div className="profile-page">

      {/* TOP BANNER */}
      <div className="profile-banner">
        <div className="container profile-banner-inner">
          <div className="profile-avatar-big" style={{ position: "relative", overflow: "hidden" }}>
            {avatarSrc
              ? <img src={avatarSrc} alt="Profile" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%" }} />
              : avatarLetter}
          </div>
          <div>
            <h1>{fullName || "My Profile"}</h1>
            <p>{email}</p>
            <div className="profile-quick-stats">
              <span>📋 {bookings.length} bookings</span>
              <span>❤️ {savedCount} saved</span>
              <span>🆔 #{String(userId).slice(0, 8)}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="container profile-body">
        <div className="profile-grid">

          {/* Personal Information */}
          <div className="profile-card">
            <h2>Personal Information</h2>

            {/* Profile image upload */}
            <div className="profile-field">
              <label>Profile Photo</label>
              <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                <div style={{
                  width: "64px", height: "64px", borderRadius: "50%",
                  background: "var(--color-primary)", color: "#fff",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "24px", fontWeight: 700, overflow: "hidden", flexShrink: 0
                }}>
                  {avatarSrc
                    ? <img src={avatarSrc} alt="Profile" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    : avatarLetter}
                </div>
                <label style={{ cursor: "pointer" }}>
                  <input type="file" accept="image/*" onChange={handleImageUpload} style={{ display: "none" }} />
                  <span style={{
                    display: "inline-block", padding: "7px 16px", background: "var(--color-light-bg)",
                    border: "1.5px solid var(--color-border)", borderRadius: "8px", fontSize: "13px",
                    color: "var(--color-text-primary)", fontWeight: 600, cursor: "pointer"
                  }}>
                    Upload Photo
                  </span>
                </label>
              </div>
            </div>

            <div className="profile-field">
              <label>Full Name</label>
              <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Your full name" />
            </div>

            <div className="profile-field">
              <label>Email Address</label>
              <input type="email" value={email} readOnly className="input-readonly" title="Email cannot be changed" />
              <small>Email address cannot be changed</small>
            </div>

            <div className="profile-field">
              <label>Phone Number</label>
              <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="e.g. +63 912 345 6789" />
            </div>

            <div className="profile-field">
              <label>Account ID</label>
              <input type="text" value={`#${userId}`} readOnly className="input-readonly" />
            </div>

            {profileError   && <div className="error-message">{profileError}</div>}
            {profileSaved   && <div className="profile-saved-msg">✅ Profile updated!</div>}
            <button className="save-btn" onClick={handleSaveProfile} disabled={profileLoading}>
              {profileLoading ? "Saving..." : "Save Changes"}
            </button>
          </div>

          {/* Change Password */}
          <div className="profile-card">
            <h2>Change Password</h2>
            <div className="profile-field">
              <label>Current Password</label>
              <input type="password" value={oldPassword} onChange={(e) => setOldPassword(e.target.value)} placeholder="Your current password" />
            </div>
            <div className="profile-field">
              <label>New Password</label>
              <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Min 6 characters" />
            </div>
            <div className="profile-field">
              <label>Confirm New Password</label>
              <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Repeat new password" />
            </div>
            {pwError   && <div className="error-message">{pwError}</div>}
            {pwSuccess && <div className="profile-saved-msg">✅ {pwSuccess}</div>}
            <button className="save-btn" onClick={handleChangePassword} disabled={pwLoading}>
              {pwLoading ? "Changing..." : "Change Password"}
            </button>
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
              <div><strong>My Bookings</strong><p>{bookings.length} booking request{bookings.length !== 1 ? "s" : ""}</p></div>
              <span className="pli-arrow">→</span>
            </Link>
            <Link to="/saved" className="profile-link-item">
              <span>❤️</span>
              <div><strong>Saved Properties</strong><p>{savedCount} saved listing{savedCount !== 1 ? "s" : ""}</p></div>
              <span className="pli-arrow">→</span>
            </Link>
            <Link to="/conversations" className="profile-link-item">
              <span>💬</span>
              <div><strong>My Messages</strong><p>View sent inquiries</p></div>
              <span className="pli-arrow">→</span>
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
}

export default Profile;
