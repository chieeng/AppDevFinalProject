import { useState, useEffect } from "react";
import { Link } from "react-router-dom";

const API = "http://localhost:8000/api";

function Messages() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const userId = localStorage.getItem("userId");

  useEffect(() => {
    if (!userId) { setLoading(false); return; }
    fetch(`${API}/inquiries/user/${userId}`)
      .then((r) => r.ok ? r.json() : [])
      .then((data) => {
        const arr = Array.isArray(data) ? data : [];
        const normalized = arr.map((inq) => ({
          id:            inq.id,
          propertyTitle: inq.property?.title || `Property #${inq.property?.id}`,
          text:          inq.message || "",
          date:          inq.createdAt || new Date().toISOString(),
          reply:         inq.adminReply || null,
          replyDate:     inq.replyDate || null,
          status:        inq.status || "pending",
        })).reverse();
        setMessages(normalized);
      })
      .catch(() => {
        const cached = JSON.parse(localStorage.getItem("vs_messages") || "[]");
        setMessages(
          cached.filter((m) => String(m.from) === String(userId)).reverse()
        );
      })
      .finally(() => setLoading(false));
  }, [userId]);

  // Derive replied state from whether a reply exists — more reliable than the status string
  const statusColor = (hasReply) => {
    if (hasReply) return { bg: "#ecfdf5", color: "#059669", border: "#a7f3d0" };
    return { bg: "#fffbeb", color: "#d97706", border: "#fde68a" };
  };

  return (
    <div className="messages-page">
      <div className="inner-page-header">
        <div className="container">
          <h1>My Messages</h1>
          <p>Inquiries you sent to property owners</p>
        </div>
      </div>

      <div className="container messages-body">
        {loading ? (
          <div className="msgs-loading">Loading messages…</div>
        ) : messages.length === 0 ? (
          <div className="empty-state-box">
            <div className="empty-icon">💬</div>
            <h2>No Messages Yet</h2>
            <p>Browse a property and send a message to the owner after booking.</p>
            <Link to="/browse" className="empty-cta-btn">Browse Properties</Link>
          </div>
        ) : (
          <div className="message-list">
            {messages.map((msg) => {
              const sc = statusColor(!!msg.reply);
              return (
                <div key={msg.id} className="message-thread-card">
                  <div className="mtc-icon">💬</div>
                  <div className="mtc-body">
                    <div className="mtc-top">
                      <strong className="mtc-property">Re: {msg.propertyTitle}</strong>
                      <div className="mtc-top-right">
                        <span
                          className="mtc-status-pill"
                          style={{ background: sc.bg, color: sc.color, border: `1px solid ${sc.border}` }}
                        >
                          {msg.reply ? "✅ Replied" : "⏳ Pending"}
                        </span>
                        <span className="mtc-date">{new Date(msg.date).toLocaleDateString()}</span>
                      </div>
                    </div>

                    <div className="mtc-bubble user-bubble">
                      <span className="mtc-bubble-label">You</span>
                      <p>{msg.text}</p>
                    </div>

                    {msg.reply ? (
                      <div className="mtc-bubble admin-bubble">
                        <span className="mtc-bubble-label">Owner / Admin</span>
                        <p>{msg.reply}</p>
                        {msg.replyDate && (
                          <span className="mtc-reply-time">{new Date(msg.replyDate).toLocaleDateString()}</span>
                        )}
                      </div>
                    ) : (
                      <div className="mtc-awaiting">⏳ Awaiting reply…</div>
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

export default Messages;
