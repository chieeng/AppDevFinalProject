import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { getMessagesSync, getUserMessages, addMessage, getOwnerInquiries, replyToOwnerMessage } from "../data/adminData";

function ChatBox() {
  const [open, setOpen]                   = useState(false);
  const [selectedThread, setSelectedThread] = useState(null);
  const [composeFor, setComposeFor]       = useState(null); // { propertyId, propertyTitle }
  const [replyText, setReplyText]         = useState("");
  const [sending, setSending]             = useState(false);
  const [messages, setMessages]           = useState([]);

  const bottomRef  = useRef(null);
  const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";
  const userId     = localStorage.getItem("userId");
  const userName   = localStorage.getItem("userFullName") || "You";
  const userRole   = localStorage.getItem("userRole");
  const isOwner    = userRole === "OWNER";

  // Listen for external open trigger (e.g. from booking flow)
  // detail: { propertyId, propertyTitle } opens/creates a thread for that property
  useEffect(() => {
    const handler = (e) => {
      setOpen(true);
      setReplyText("");
      if (e.detail?.propertyId) {
        setComposeFor({ propertyId: String(e.detail.propertyId), propertyTitle: e.detail.propertyTitle });
        setSelectedThread(null);
      } else {
        setComposeFor(null);
        setSelectedThread(null);
      }
    };
    window.addEventListener("open-chatbox", handler);
    return () => window.removeEventListener("open-chatbox", handler);
  }, []);

  const refreshMessages = async () => {
    if (!userId) return;
    const mine = isOwner ? await getOwnerInquiries(userId) : await getUserMessages(userId);
    setMessages(mine);
  };

  const refreshMessagesSync = () => {
    if (isOwner) {
      setMessages(JSON.parse(localStorage.getItem("vs_owner_inquiries") || "[]"));
    } else {
      const all = getMessagesSync();
      setMessages(all.filter((m) => String(m.from) === String(userId)));
    }
  };

  useEffect(() => {
    if (open && isLoggedIn) refreshMessages();
  }, [open]);

  useEffect(() => {
    if (selectedThread || composeFor) {
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    }
  }, [selectedThread, composeFor, messages]);

  // Group messages into threads by property
  const threads = messages.reduce((acc, msg) => {
    const key = String(msg.propertyId);
    if (!acc[key]) {
      acc[key] = { propertyId: msg.propertyId, propertyTitle: msg.propertyTitle, messages: [], lastDate: msg.date, hasUnread: false };
    }
    acc[key].messages.push(msg);
    if (isOwner ? !msg.reply : (msg.reply && !msg.read)) acc[key].hasUnread = true;
    if (msg.date > acc[key].lastDate) acc[key].lastDate = msg.date;
    return acc;
  }, {});

  const threadList    = Object.values(threads).sort((a, b) => new Date(b.lastDate) - new Date(a.lastDate));
  const currentThread = selectedThread ? threads[String(selectedThread)] : null;

  // When composeFor is set and the thread now exists (after send), auto-open it
  useEffect(() => {
    if (composeFor && threads[composeFor.propertyId]) {
      setSelectedThread(Number(composeFor.propertyId));
      setComposeFor(null);
    }
  }, [messages]);

  // Send a follow-up in an existing thread (tenant)
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
      refreshMessagesSync();
    } catch (err) {
      console.error("Failed to send:", err);
    } finally {
      setSending(false);
    }
  };

  // Send first message in a new conversation (compose view)
  const handleComposeSend = async () => {
    if (!replyText.trim() || !composeFor) return;
    setSending(true);
    try {
      await addMessage({
        from:          userId,
        fromName:      userName,
        fromEmail:     localStorage.getItem("userEmail") || "",
        propertyId:    composeFor.propertyId,
        propertyTitle: composeFor.propertyTitle,
        text:          replyText.trim(),
      });
      setReplyText("");
      // refreshMessages will trigger the useEffect that auto-opens the thread
      await refreshMessages();
    } catch (err) {
      console.error("Failed to send:", err);
    } finally {
      setSending(false);
    }
  };

  // Owner reply to an inquiry
  const handleOwnerReply = async (msgId) => {
    if (!replyText.trim()) return;
    setSending(true);
    try {
      await replyToOwnerMessage(msgId, replyText.trim());
      setMessages((prev) => prev.map((m) =>
        m.id === msgId ? { ...m, reply: replyText.trim(), replyDate: new Date().toISOString(), read: true } : m
      ));
      setReplyText("");
    } catch (err) {
      console.error("Reply failed:", err);
    } finally {
      setSending(false);
    }
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (composeFor) handleComposeSend();
      else handleSendReply();
    }
  };

  const unreadCount = threadList.filter((t) => t.hasUnread).length;

  // ── Not logged in ─────────────────────────────────────────────
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
              : "After booking a property, message the owner here."}
          </small>
        </div>
      ) : (
        threadList.map((thread) => {
          const lastMsg  = [...thread.messages].sort((a, b) => new Date(b.date) - new Date(a.date))[0];
          const preview  = isOwner ? lastMsg.text : (lastMsg.reply || lastMsg.text);
          const tenantName = lastMsg.fromName || "Tenant";
          return (
            <div
              key={thread.propertyId}
              className={`chatbox-thread-item ${thread.hasUnread ? "unread" : ""}`}
              onClick={() => { setSelectedThread(thread.propertyId); setComposeFor(null); }}
            >
              <div className="cti-avatar">🏠</div>
              <div className="cti-body">
                {isOwner ? (
                  <>
                    <div className="cti-title">{tenantName}</div>
                    <div className="cti-property-tag">🏠 {thread.propertyTitle}</div>
                    <div className="cti-preview">{preview?.slice(0, 50)}{preview?.length > 50 ? "…" : ""}</div>
                  </>
                ) : (
                  <>
                    <div className="cti-title">{thread.propertyTitle}</div>
                    <div className="cti-preview">{preview?.slice(0, 50)}{preview?.length > 50 ? "…" : ""}</div>
                  </>
                )}
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

  // ── Compose view (new conversation) ──────────────────────────
  const ComposeView = () => (
    <div className="chatbox-thread-view">
      <div className="chatbox-messages">
        <div className="chatbox-empty" style={{ padding: "24px 16px" }}>
          <span>💬</span>
          <p>Start a conversation about</p>
          <strong style={{ fontSize: "13px", color: "var(--color-primary, #0fa492)" }}>{composeFor?.propertyTitle}</strong>
        </div>
        <div ref={bottomRef} />
      </div>
      <div className="chatbox-reply">
        <textarea
          value={replyText}
          onChange={(e) => setReplyText(e.target.value)}
          onKeyDown={handleKey}
          placeholder="Type your message… (Enter to send)"
          rows={2}
          disabled={sending}
          autoFocus
        />
        <button className="chatbox-send-btn" onClick={handleComposeSend} disabled={sending || !replyText.trim()}>
          {sending ? "…" : "Send"}
        </button>
      </div>
    </div>
  );

  // ── Thread view (conversation) ────────────────────────────────
  const ThreadView = () => {
    if (!currentThread) return null;
    const sorted    = [...currentThread.messages].sort((a, b) => new Date(a.date) - new Date(b.date));
    const unreplied = isOwner ? sorted.filter((m) => !m.reply) : [];
    return (
      <div className="chatbox-thread-view">
        {isOwner && (
          <div className="chatbox-property-banner">
            🏠 {currentThread.propertyTitle}
          </div>
        )}
        <div className="chatbox-messages">
          {sorted.map((msg, i) => (
            <div key={i} className="chatbox-msg-group">
              {isOwner ? (
                <>
                  <div className="chatbox-bubble admin">
                    <span className="chatbox-bubble-label">{msg.fromName || "Tenant"}</span>
                    <p>{msg.text}</p>
                    <span className="chatbox-bubble-time">{new Date(msg.date).toLocaleDateString()}</span>
                  </div>
                  {msg.reply ? (
                    <div className="chatbox-bubble user">
                      <span className="chatbox-bubble-label">You (Owner)</span>
                      <p>{msg.reply}</p>
                      {msg.replyDate && <span className="chatbox-bubble-time">{new Date(msg.replyDate).toLocaleDateString()}</span>}
                    </div>
                  ) : (
                    <div className="chatbox-awaiting">⏳ Not yet replied</div>
                  )}
                </>
              ) : (
                <>
                  <div className="chatbox-bubble user">
                    <span className="chatbox-bubble-label">{userName}</span>
                    <p>{msg.text}</p>
                    <span className="chatbox-bubble-time">{new Date(msg.date).toLocaleDateString()}</span>
                  </div>
                  {msg.reply ? (
                    <div className="chatbox-bubble admin">
                      <span className="chatbox-bubble-label">Owner / Admin</span>
                      <p>{msg.reply}</p>
                      {msg.replyDate && <span className="chatbox-bubble-time">{new Date(msg.replyDate).toLocaleDateString()}</span>}
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

        {!isOwner && (
          <div className="chatbox-reply">
            <textarea
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Type a message… (Enter to send)"
              rows={2}
              disabled={sending}
            />
            <button className="chatbox-send-btn" onClick={handleSendReply} disabled={sending || !replyText.trim()}>
              {sending ? "…" : "Send"}
            </button>
          </div>
        )}
        {isOwner && unreplied.length > 0 && (
          <div className="chatbox-reply">
            <textarea
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="Type your reply…"
              rows={2}
              disabled={sending}
            />
            <button className="chatbox-send-btn" onClick={() => handleOwnerReply(unreplied[0].id)} disabled={sending || !replyText.trim()}>
              {sending ? "…" : "Reply"}
            </button>
          </div>
        )}
      </div>
    );
  };

  // Determine header title
  const headerTitle = () => {
    if (composeFor) return composeFor.propertyTitle;
    if (selectedThread && currentThread) return currentThread.propertyTitle;
    return "Messages";
  };

  const headerSub = () => {
    if (composeFor) return "New conversation";
    if (selectedThread) return isOwner ? "Tenant Inquiry" : "Owner / Admin";
    return isOwner
      ? `${threadList.length} inquiry${threadList.length !== 1 ? "s" : ""}`
      : `${threadList.length} conversation${threadList.length !== 1 ? "s" : ""}`;
  };

  const showBack = selectedThread || composeFor;
  const handleBack = () => {
    setSelectedThread(null);
    setComposeFor(null);
    setReplyText("");
    refreshMessagesSync();
  };

  return (
    <>
      <div className="chat-toggle" onClick={() => { setOpen(!open); setSelectedThread(null); setComposeFor(null); }} title="Messages">
        💬
        {unreadCount > 0 && <span className="chat-toggle-badge">{unreadCount}</span>}
      </div>

      {open && (
        <div className="chat-container chatbox-redesigned">

          {/* Header */}
          <div className="chat-header">
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              {showBack && (
                <button className="chatbox-back-btn" onClick={handleBack}>←</button>
              )}
              <div>
                <h4>{headerTitle()}</h4>
                <span style={{ fontSize: "11px", opacity: 0.7 }}>{headerSub()}</span>
              </div>
            </div>
            <button onClick={() => { setOpen(false); setSelectedThread(null); setComposeFor(null); }} style={{ background: "none", border: "none", color: "white", cursor: "pointer", fontSize: "18px", padding: 0 }}>✕</button>
          </div>

          {/* Body */}
          {!isLoggedIn ? (
            NotLoggedIn()
          ) : composeFor ? (
            ComposeView()
          ) : selectedThread ? (
            ThreadView()
          ) : (
            ThreadList()
          )}

        </div>
      )}
    </>
  );
}

export default ChatBox;
