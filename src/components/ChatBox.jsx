import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { getMessagesSync, getUserMessages, addMessage, getOwnerInquiries } from "../data/adminData";

function ChatBox() {
  const [open, setOpen]           = useState(false);
  const [selectedThread, setSelectedThread] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [sending, setSending]     = useState(false);
  const [messages, setMessages]   = useState([]);

  const bottomRef  = useRef(null);
  const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";
  const userId     = localStorage.getItem("userId");
  const userName   = localStorage.getItem("userFullName") || "You";
  const userRole   = localStorage.getItem("userRole");
  const isOwner    = userRole === "OWNER";

  // For owners: fetch inquiries received about their properties.
  // For tenants: fetch inquiries they sent.
  const refreshMessages = async () => {
    if (!userId) return;
    if (isOwner) {
      const mine = await getOwnerInquiries(userId);
      setMessages(mine);
    } else {
      const mine = await getUserMessages(userId);
      setMessages(mine);
    }
  };

  // Sync fallback used after a tenant sends a message (or owner goes back from thread view)
  const refreshMessagesSync = () => {
    if (isOwner) {
      // Owner's inquiries are cached in vs_owner_inquiries, not vs_messages
      const ownerMsgs = JSON.parse(localStorage.getItem("vs_owner_inquiries") || "[]");
      setMessages(ownerMsgs);
    } else {
      const all = getMessagesSync();
      setMessages(all.filter((m) => String(m.from) === String(userId)));
    }
  };

  useEffect(() => {
    if (open && isLoggedIn) refreshMessages();
  }, [open]);

  // Scroll to bottom when thread opens or new message arrives
  useEffect(() => {
    if (selectedThread) {
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    }
  }, [selectedThread, messages]);

  // Group messages by property — one thread per property
  const threads = messages.reduce((acc, msg) => {
    const key = String(msg.propertyId);
    if (!acc[key]) {
      acc[key] = {
        propertyId:    msg.propertyId,
        propertyTitle: msg.propertyTitle,
        messages:      [],
        lastDate:      msg.date,
        hasUnread:     false,
      };
    }
    acc[key].messages.push(msg);
    // Owners: unread = tenant message not yet replied to; Tenants: unread = admin reply not yet read
    if (isOwner ? !msg.reply : (msg.reply && !msg.read)) acc[key].hasUnread = true;
    // Keep the most recent date for sorting
    if (msg.date > acc[key].lastDate) acc[key].lastDate = msg.date;
    return acc;
  }, {});

  const threadList = Object.values(threads).sort(
    (a, b) => new Date(b.lastDate) - new Date(a.lastDate)
  );

  const currentThread = selectedThread ? threads[String(selectedThread)] : null;

  // Send a new message in the current thread
  const handleSendReply = async () => {
    if (!replyText.trim() || !currentThread) return;
    setSending(true);
    try {
      await addMessage({
        from:          userId,
        fromName:      userName,
        fromEmail:     localStorage.getItem("userEmail") || "",
        propertyId:    currentThread.propertyId,
        propertyTitle: currentThread.propertyTitle,
        text:          replyText.trim(),
      });
      setReplyText("");
      refreshMessagesSync(); // update UI immediately; background fetch will follow on next open
    } catch (err) {
      console.error("Failed to send:", err);
    } finally {
      setSending(false);
    }
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSendReply(); }
  };

  // ── Not logged in state ───────────────────────────────────────
  const NotLoggedIn = () => (
    <div className="chatbox-nologin">
      <span className="chatbox-nologin-icon">💬</span>
      <p>Log in to view your conversations with VacanSee</p>
      <Link to="/login" className="chatbox-login-btn">Log In</Link>
    </div>
  );

  // ── Thread list (inbox) ───────────────────────────────────────
  const ThreadList = () => (
    <div className="chatbox-threads">
      {threadList.length === 0 ? (
        <div className="chatbox-empty">
          <span>📭</span>
          <p>{isOwner ? "No tenant inquiries yet" : "No conversations yet"}</p>
          <small>
            {isOwner
              ? "Inquiries from tenants about your properties will appear here."
              : "When you message an owner after booking a property, it will appear here."}
          </small>
        </div>
      ) : (
        threadList.map((thread) => {
          const lastMsg = [...thread.messages].sort(
            (a, b) => new Date(b.date) - new Date(a.date)
          )[0];
          // For owners: show the tenant's message as preview; for tenants: show latest reply or their own message
          const preview = isOwner ? lastMsg.text : (lastMsg.reply || lastMsg.text);
          const previewLabel = isOwner ? `${lastMsg.fromName || "Tenant"}: ` : "";
          return (
            <div
              key={thread.propertyId}
              className={`chatbox-thread-item ${thread.hasUnread ? "unread" : ""}`}
              onClick={() => setSelectedThread(thread.propertyId)}
            >
              <div className="cti-avatar">🏠</div>
              <div className="cti-body">
                <div className="cti-title">{thread.propertyTitle}</div>
                <div className="cti-preview">
                  {previewLabel}{preview?.slice(0, 50)}{preview?.length > 50 ? "…" : ""}
                </div>
              </div>
              <div className="cti-meta">
                <span className="cti-date">{new Date(lastMsg.date).toLocaleDateString()}</span>
                {thread.hasUnread && <span className="cti-dot" />}
              </div>
            </div>
          );
        })
      )}
    </div>
  );

  // ── Single thread conversation ────────────────────────────────
  const ThreadView = () => {
    if (!currentThread) return null;
    const sorted = [...currentThread.messages].sort(
      (a, b) => new Date(a.date) - new Date(b.date)
    );

    return (
      <div className="chatbox-thread-view">
        <div className="chatbox-messages">
          {sorted.map((msg, i) => (
            <div key={i} className="chatbox-msg-group">
              {isOwner ? (
                // ── Owner view: tenant's message comes first, then owner reply ──
                <>
                  <div className="chatbox-bubble admin">
                    <span className="chatbox-bubble-label">{msg.fromName || "Tenant"}</span>
                    <p>{msg.text}</p>
                    <span className="chatbox-bubble-time">
                      {new Date(msg.date).toLocaleDateString()}
                    </span>
                  </div>
                  {msg.reply ? (
                    <div className="chatbox-bubble user">
                      <span className="chatbox-bubble-label">You (Owner)</span>
                      <p>{msg.reply}</p>
                      {msg.replyDate && (
                        <span className="chatbox-bubble-time">
                          {new Date(msg.replyDate).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  ) : (
                    <div className="chatbox-awaiting">⏳ Not yet replied — go to Dashboard → Messages to reply</div>
                  )}
                </>
              ) : (
                // ── Tenant view: their own message, then admin/owner reply ──
                <>
                  <div className="chatbox-bubble user">
                    <span className="chatbox-bubble-label">{userName}</span>
                    <p>{msg.text}</p>
                    <span className="chatbox-bubble-time">
                      {new Date(msg.date).toLocaleDateString()}
                    </span>
                  </div>
                  {msg.reply ? (
                    <div className="chatbox-bubble admin">
                      <span className="chatbox-bubble-label">Owner / Admin</span>
                      <p>{msg.reply}</p>
                      {msg.replyDate && (
                        <span className="chatbox-bubble-time">
                          {new Date(msg.replyDate).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  ) : (
                    <div className="chatbox-awaiting">⏳ Awaiting owner/admin reply…</div>
                  )}
                </>
              )}
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        {/* Tenants can send follow-up messages; owners reply via their dashboard */}
        {!isOwner && (
          <div className="chatbox-reply">
            <textarea
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Type a follow-up message… (Enter to send)"
              rows={2}
              disabled={sending}
            />
            <button
              className="chatbox-send-btn"
              onClick={handleSendReply}
              disabled={sending || !replyText.trim()}
            >
              {sending ? "…" : "Send"}
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      {/* Floating button */}
      <div className="chat-toggle" onClick={() => { setOpen(!open); setSelectedThread(null); }} title="Messages">
        💬
      </div>

      {open && (
        <div className="chat-container chatbox-redesigned">

          {/* Header */}
          <div className="chat-header">
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              {selectedThread && (
                <button
                  className="chatbox-back-btn"
                  onClick={() => { setSelectedThread(null); refreshMessagesSync(); }}
                >
                  ←
                </button>
              )}
              <div>
                <h4>
                  {selectedThread && currentThread
                    ? currentThread.propertyTitle
                    : "Messages"}
                </h4>
                <span style={{ fontSize: "11px", opacity: 0.7 }}>
                  {selectedThread
                    ? (isOwner ? "Tenant Inquiry" : "Owner / Admin")
                    : isOwner
                      ? `${threadList.length} tenant inquiry${threadList.length !== 1 ? "s" : ""}`
                      : `${threadList.length} conversation${threadList.length !== 1 ? "s" : ""}`}
                </span>
              </div>
            </div>
            <button
              onClick={() => { setOpen(false); setSelectedThread(null); }}
              style={{ background: "none", border: "none", color: "white", cursor: "pointer", fontSize: "18px", padding: 0 }}
            >
              ✕
            </button>
          </div>

          {/* Body */}
          {!isLoggedIn ? (
            <NotLoggedIn />
          ) : selectedThread ? (
            <ThreadView />
          ) : (
            <ThreadList />
          )}

        </div>
      )}
    </>
  );
}

export default ChatBox;
