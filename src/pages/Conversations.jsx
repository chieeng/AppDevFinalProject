import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getBookingsByUser } from "../data/adminData";

// Conversations — shows the user's booking history as conversation threads
function Conversations() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const userId = localStorage.getItem("userId");

  useEffect(() => {
    if (!userId) { setLoading(false); return; }
    getBookingsByUser(userId)
      .then((data) => setBookings((data || []).reverse()))
      .catch(() => {
        const cached = JSON.parse(localStorage.getItem("vs_bookings") || "[]");
        setBookings(cached.filter((b) => String(b.userId) === String(userId)).reverse());
      })
      .finally(() => setLoading(false));
  }, [userId]);

  const statusStyle = (status) => {
    if (status === "confirmed")  return { bg: "#ecfdf5", color: "#059669", border: "#a7f3d0" };
    if (status === "completed")  return { bg: "#eff6ff", color: "#2563eb", border: "#bfdbfe" };
    if (status === "rejected")   return { bg: "#fef2f2", color: "#dc2626", border: "#fecaca" };
    if (status === "cancelled")  return { bg: "#f1f5f9", color: "#64748b", border: "#cbd5e1" };
    return { bg: "#fffbeb", color: "#d97706", border: "#fde68a" };
  };

  return (
    <div className="messages-page">
      <div className="inner-page-header">
        <div className="container">
          <h1>My Booking History</h1>
          <p>All your booking requests and their status</p>
        </div>
      </div>

      <div className="container messages-body">
        {loading ? (
          <div className="msgs-loading">Loading bookings…</div>
        ) : bookings.length === 0 ? (
          <div className="empty-state-box">
            <div className="empty-icon">📋</div>
            <h2>No Bookings Yet</h2>
            <p>Find a property you like and submit a booking request to get started.</p>
            <Link to="/browse" className="empty-cta-btn">Browse Properties</Link>
          </div>
        ) : (
          <div className="message-list">
            {bookings.map((b) => {
              const s = statusStyle(b.status);
              return (
                <div key={b.id} className="message-thread-card">
                  <div className="mtc-icon">🏠</div>
                  <div className="mtc-body">
                    <div className="mtc-top">
                      <strong className="mtc-property">{b.propertyTitle}</strong>
                      <div className="mtc-top-right">
                        <span
                          className="mtc-status-pill"
                          style={{ background: s.bg, color: s.color, border: `1px solid ${s.border}` }}
                        >
                          {b.status === "pending"   && "⏳ "}
                          {b.status === "confirmed" && "✅ "}
                          {b.status === "completed" && "🏁 "}
                          {b.status === "rejected"  && "❌ "}
                          {b.status === "cancelled" && "🚫 "}
                          {(b.status || "pending").charAt(0).toUpperCase() + (b.status || "pending").slice(1)}
                        </span>
                        <span className="mtc-date">{b.checkIn ? new Date(b.checkIn).toLocaleDateString() : "—"}</span>
                      </div>
                    </div>

                    <div className="mtc-bubble user-bubble">
                      <span className="mtc-bubble-label">Booking Details</span>
                      <p>
                        📅 Move-in: <strong>{b.checkIn ? new Date(b.checkIn).toLocaleDateString() : "—"}</strong> &nbsp;|&nbsp;
                        🗓 Duration: <strong>{b.months} month{b.months !== 1 ? "s" : ""}</strong> &nbsp;|&nbsp;
                        💰 Total: <strong>₱{(b.total || 0).toLocaleString()}</strong>
                      </p>
                    </div>

                    {b.status === "confirmed" && (
                      <div className="mtc-bubble admin-bubble">
                        <span className="mtc-bubble-label">Admin</span>
                        <p>✅ Your booking has been confirmed! Please prepare for your move-in date.</p>
                      </div>
                    )}
                    {b.status === "completed" && (
                      <div className="mtc-bubble admin-bubble">
                        <span className="mtc-bubble-label">System</span>
                        <p>🏁 Your rental period has ended. We hope you enjoyed your stay!</p>
                      </div>
                    )}
                    {b.status === "rejected" && (
                      <div className="mtc-bubble admin-bubble" style={{ borderLeft: "3px solid #fca5a5" }}>
                        <span className="mtc-bubble-label">Admin</span>
                        <p>❌ Your booking request was not approved. Please try another property.</p>
                      </div>
                    )}
                    {b.status === "cancelled" && (
                      <div className="mtc-bubble admin-bubble" style={{ borderLeft: "3px solid #cbd5e1" }}>
                        <span className="mtc-bubble-label">System</span>
                        <p>🚫 You cancelled this booking request.</p>
                      </div>
                    )}
                    {b.status === "pending" && (
                      <div className="mtc-awaiting">⏳ Awaiting owner/admin review…</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default Conversations;
