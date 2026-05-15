import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getMessages } from "../data/adminData";

// Messages — shows the current user's sent inquiries and any admin replies
function Messages() {
  const [messages, setMessages] = useState([]);
  const userId = localStorage.getItem("userId");

  useEffect(() => {
    getMessages().then((all) => {
      setMessages(all.filter((m) => m.from === userId).reverse());
    });
  }, []);

  return (
    <div className="messages-page">
      <div className="inner-page-header">
        <div className="container">
          <h1>My Conversations</h1>
          <p>All your property inquiries</p>
        </div>
      </div>

      <div className="container messages-body">
        {messages.length === 0 ? (
          <div className="empty-state-box">
            <div className="empty-icon">💬</div>
            <h2>No Messages Yet</h2>
            <p>Browse a property and click "Message Owner" to start an inquiry.</p>
            <Link to="/browse" className="empty-cta-btn">Browse Properties</Link>
          </div>
        ) : (
          <div className="message-list">
            {messages.map((msg) => (
              <div key={msg.id} className="message-thread-card">
                <div className="mtc-icon">💬</div>
                <div className="mtc-body">
                  <div className="mtc-top">
                    <strong className="mtc-property">Re: {msg.propertyTitle}</strong>
                    <span className="mtc-date">{new Date(msg.date).toLocaleDateString()}</span>
                  </div>

                  {/* The message the user sent */}
                  <div className="mtc-bubble user-bubble">
                    <span className="mtc-bubble-label">You</span>
                    <p>{msg.text}</p>
                  </div>

                  {/* Admin reply (if any) */}
                  {msg.reply ? (
                    <div className="mtc-bubble admin-bubble">
                      <span className="mtc-bubble-label">VacanSee Admin</span>
                      <p>{msg.reply}</p>
                      <span className="mtc-reply-time">
                        {msg.replyDate ? new Date(msg.replyDate).toLocaleDateString() : ""}
                      </span>
                    </div>
                  ) : (
                    <div className="mtc-awaiting">⏳ Awaiting reply from admin…</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Messages;
