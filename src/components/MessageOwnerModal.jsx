import { useState } from "react";
import { addMessage } from "../data/adminData";
import "./MessageOwnerModal.css";

// MessageOwnerModal — pops up when user clicks "Message Owner" on a listing.
// Sends via POST /api/inquiries (tries backend first, falls back to localStorage).
function MessageOwnerModal({ listing, isOpen, onClose, currentUserId, currentUserName }) {
  const [messageText, setMessageText] = useState("");
  const [isSending, setIsSending]     = useState(false);
  const [sent, setSent]               = useState(false);
  const [error, setError]             = useState("");

  if (!isOpen) return null;

  const handleSend = async () => {
    if (!messageText.trim()) { setError("Please type a message."); return; }
    setIsSending(true);
    setError("");
    try {
      await addMessage({
        from:          currentUserId || "guest",
        fromName:      currentUserName || localStorage.getItem("userFullName") || "Anonymous",
        fromEmail:     localStorage.getItem("userEmail") || "",
        propertyId:    listing?.id,
        propertyTitle: listing?.title || "Property",
        text:          messageText.trim(),
      });
      setSent(true);
      setMessageText("");
      setTimeout(() => { setSent(false); onClose(); }, 1800);
    } catch (e) {
      setError("Failed to send: " + (e.message || "Unknown error"));
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>

        <div className="modal-header">
          <div>
            <h2>Message Owner</h2>
            <p>Your inquiry goes to the VacanSee admin team</p>
          </div>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
          <div className="modal-property-pill">
            🏠 {listing?.title || "Property"} — {listing?.city || listing?.location || ""}
          </div>

          {sent ? (
            <div className="modal-success">
              ✅ Message sent! Our team will get back to you soon.
            </div>
          ) : (
            <>
              {error && <div className="error-message">{error}</div>}
              <label className="modal-label">Your message</label>
              <textarea
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                placeholder="Hi, I am interested in this property. Can I schedule a viewing?"
                rows={5}
                disabled={isSending}
              />
              <p className="modal-note">
                💡 Include your preferred move-in date and any questions you have.
              </p>
            </>
          )}
        </div>

        {!sent && (
          <div className="modal-footer">
            <button className="btn-cancel" onClick={onClose} disabled={isSending}>Cancel</button>
            <button
              className="btn-send"
              onClick={handleSend}
              disabled={isSending || !messageText.trim()}
            >
              {isSending ? "Sending…" : "Send Message"}
            </button>
          </div>
        )}

      </div>
    </div>
  );
}

export default MessageOwnerModal;
