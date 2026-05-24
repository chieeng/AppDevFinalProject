import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { getBookingsByUser, cancelBooking, getSavedIds } from "../data/adminData";
import { getAllListings } from "../data/appData";
import Card from "../components/Card";

function Dashboard() {
  const userId   = localStorage.getItem("userId");
  const userName = localStorage.getItem("userFullName") || "User";

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [cancelling, setCancelling] = useState(null);

  const allListings = getAllListings();
  const savedIds    = getSavedIds();
  const savedListings = allListings.filter((p) => savedIds.includes(p.id)).slice(0, 3);

  const fetchBookings = async () => {
    try {
      const mine = await getBookingsByUser(userId);
      setBookings(mine || []);
    } catch {
      const cached = JSON.parse(localStorage.getItem("vs_bookings") || "[]");
      setBookings(cached.filter((b) => String(b.userId) === String(userId)));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [userId]);

  const handleCancel = async (id) => {
    if (!window.confirm("Cancel this booking request?")) return;
    setCancelling(id);
    await cancelBooking(id);
    await fetchBookings();
    setCancelling(null);
  };

  const statusStyle = (status) => {
    if (status === "confirmed")  return { bg: "#ecfdf5", color: "#059669", border: "#a7f3d0" };
    if (status === "rejected")   return { bg: "#fef2f2", color: "#dc2626", border: "#fecaca" };
    if (status === "cancelled")  return { bg: "#f1f5f9", color: "#64748b", border: "#cbd5e1" };
    return { bg: "#fffbeb", color: "#d97706", border: "#fde68a" };
  };

  const stats = [
    { icon: "📋", label: "My Bookings",     value: bookings.length },
    { icon: "⏳", label: "Pending",          value: bookings.filter((b) => b.status === "pending").length },
    { icon: "✅", label: "Confirmed",         value: bookings.filter((b) => b.status === "confirmed").length },
    { icon: "❤️", label: "Saved Properties", value: savedIds.length },
  ];

  return (
    <div className="dashboard-page">

      <div className="dashboard-welcome">
        <div className="container">
          <div className="dash-welcome-inner">
            <div>
              <h1>Welcome back, {userName}! 👋</h1>
              <p>Here is a summary of your activity on VacanSee</p>
            </div>
            <div className="dash-welcome-actions">
              <Link to="/search" className="dash-action-btn primary">🔍 Find a Room</Link>
              <Link to="/saved"  className="dash-action-btn outline">❤️ Saved ({savedIds.length})</Link>
            </div>
          </div>
        </div>
      </div>

      <div className="container dash-content">

        <div className="dashboard-stats">
          {stats.map((s, i) => (
            <div key={i} className="dash-stat">
              <div className="stat-icon">{s.icon}</div>
              <div className="stat-content">
                <h4>{s.label}</h4>
                <p>{s.value}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="dash-section">
          <div className="dash-section-header">
            <h2>My Booking Requests</h2>
            <Link to="/browse" className="dash-section-link">Browse More →</Link>
          </div>

          {loading ? (
            <p style={{ color: "var(--color-text-muted)", padding: "20px 0" }}>Loading bookings…</p>
          ) : bookings.length === 0 ? (
            <div className="dash-empty">
              <div className="empty-icon">🏠</div>
              <h3>No bookings yet</h3>
              <p>Browse properties and submit your first booking request.</p>
              <Link to="/browse" className="empty-cta-btn">Browse Properties</Link>
            </div>
          ) : (
            <div className="bookings-list">
              {[...bookings].reverse().map((b) => {
                const s = statusStyle(b.status);
                const isPending = b.status === "pending";
                return (
                  <div key={b.id} className="booking-row">
                    <div className="booking-row-info">
                      <div className="booking-row-title">{b.propertyTitle}</div>
                      <div className="booking-row-meta">
                        <span>📅 Move-in: {b.checkIn ? new Date(b.checkIn).toLocaleDateString() : "—"}</span>
                        <span>🗓 {b.months} month{b.months !== 1 ? "s" : ""}</span>
                        <span>💰 ₱{(b.total || 0).toLocaleString()}</span>
                      </div>
                    </div>
                    <div className="booking-row-actions">
                      <span
                        className="booking-status-pill"
                        style={{ background: s.bg, color: s.color, border: `1px solid ${s.border}` }}
                      >
                        {b.status === "pending"   && "⏳ "}
                        {b.status === "confirmed" && "✅ "}
                        {b.status === "rejected"  && "❌ "}
                        {b.status === "cancelled" && "🚫 "}
                        {(b.status || "pending").charAt(0).toUpperCase() + (b.status || "pending").slice(1)}
                      </span>
                      {isPending && (
                        <button
                          className="booking-cancel-btn"
                          onClick={() => handleCancel(b.id)}
                          disabled={cancelling === b.id}
                          title="Cancel this booking request"
                        >
                          {cancelling === b.id ? "…" : "Cancel"}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {savedListings.length > 0 && (
          <div className="dash-section">
            <div className="dash-section-header">
              <h2>❤️ Saved Properties</h2>
              <Link to="/saved" className="dash-section-link">View All →</Link>
            </div>
            <div className="cards">
              {savedListings.map((p) => (
                <Card
                  key={p.id}
                  id={p.id}
                  title={p.title}
                  location={p.city || p.location}
                  price={p.price}
                  bedrooms={p.bedrooms}
                  bathrooms={p.bathrooms}
                  propertyType={p.propertyType}
                  status={p.status}
                />
              ))}
            </div>
          </div>
        )}

        <div className="dash-section">
          <div className="dash-section-header"><h2>Quick Links</h2></div>
          <div className="quick-actions">
            {[
              { icon: "🔍", label: "Search Properties", link: "/search" },
              { icon: "🏠", label: "Browse All",        link: "/browse" },
              { icon: "💬", label: "My Messages",       link: "/messages" },
              { icon: "👤", label: "My Profile",        link: "/profile" },
            ].map((a, i) => (
              <Link key={i} to={a.link} className="quick-action-btn">
                <span className="action-icon">{a.icon}</span>
                <span className="action-label">{a.label}</span>
              </Link>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}

export default Dashboard;
