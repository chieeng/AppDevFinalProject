import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { getListingById, getAllListings } from "../data/appData";
import { addBooking, addMessage, toggleSaved, getSavedIds } from "../data/adminData";
import listing1 from "../images/listing-1.jpg";
import listing2 from "../images/listing-2.jpg";
import listing3 from "../images/listing-3.png";

// Step states for the booking form:
//   "form"     — user fills in date and months
//   "message"  — booking done, optionally add a message to the owner
//   "done"     — message sent (or skipped), redirecting
const STEP_FORM    = "form";
const STEP_MESSAGE = "message";
const STEP_DONE    = "done";

function ListingDetails({ isLoggedIn }) {
  const { id }     = useParams();
  const navigate   = useNavigate();

  // Booking form state
  const [months, setMonths]               = useState(1);
  const [checkIn, setCheckIn]             = useState("");
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingError, setBookingError]   = useState("");

  // Step state controls which view the right-side panel shows
  const [step, setStep] = useState(STEP_FORM);

  // Message state (shown after booking is confirmed)
  const [messageText, setMessageText]       = useState("");
  const [messageLoading, setMessageLoading] = useState(false);
  const [messageError, setMessageError]     = useState("");

  // Property + save state
  const [data, setData]     = useState(null);
  const [isSaved, setIsSaved] = useState(false);

  const currentUserId   = localStorage.getItem("userId");
  const currentUserName = localStorage.getItem("userFullName");

  useEffect(() => {
    const listing = getListingById(parseInt(id))
      || getAllListings().find((l) => String(l.id) === id);
    setData(listing || null);
    setIsSaved(getSavedIds().includes(parseInt(id)));
  }, [id]);

  const toggleSave_ = () => {
    const updated = toggleSaved(parseInt(id));
    setIsSaved(updated.includes(parseInt(id)));
  };

  // ── STEP 1: User confirms the booking ────────────────────────
  const handleBooking = async () => {
    if (!isLoggedIn) { alert("Please log in first!"); navigate("/login"); return; }
    if (!checkIn)    { alert("Please select a move-in date."); return; }
    if (months < 1)  { alert("Number of months must be at least 1."); return; }

    setBookingLoading(true);
    setBookingError("");

    try {
      await addBooking({
        userId:        currentUserId,
        userName:      currentUserName || "User",
        userEmail:     localStorage.getItem("userEmail") || "",
        propertyId:    data.id,
        propertyTitle: data.title,
        price:         data.price,
        checkIn,
        months,
        total:         (data.price || 0) * months,
      });
      // Booking saved — move to the message step
      setStep(STEP_MESSAGE);
    } catch (err) {
      setBookingError(err.message || "Booking failed. Please try again.");
    } finally {
      setBookingLoading(false);
    }
  };

  // ── STEP 2a: User sends a message then we redirect ───────────
  const handleSendMessage = async () => {
    if (!messageText.trim()) return;

    setMessageLoading(true);
    setMessageError("");

    try {
      await addMessage({
        from:          currentUserId,
        fromName:      currentUserName || "User",
        fromEmail:     localStorage.getItem("userEmail") || "",
        propertyId:    data.id,
        propertyTitle: data.title,
        text:          messageText.trim(),
      });
      setStep(STEP_DONE);
      setTimeout(() => navigate("/dashboard"), 1800);
    } catch (err) {
      setMessageError(err.message || "Failed to send message.");
    } finally {
      setMessageLoading(false);
    }
  };

  // ── STEP 2b: User skips the message and goes to dashboard ─────
  const handleSkip = () => {
    setStep(STEP_DONE);
    setTimeout(() => navigate("/dashboard"), 1200);
  };

  // ── Loading / not found state ─────────────────────────────────
  if (!data) {
    return (
      <div className="container" style={{ padding: "80px 0", textAlign: "center" }}>
        <h2>Property not found</h2>
        <button onClick={() => navigate("/browse")} style={{ marginTop: "20px", padding: "10px 20px", cursor: "pointer" }}>
          Back to Browse
        </button>
      </div>
    );
  }

  const images = [listing1, listing2, listing3];
  const hero   = images[parseInt(String(data.id).slice(-1)) % images.length];
  const total  = (data.price || 0) * months;

  const features = [];
  if (data.hasParking) features.push({ icon: "🅿️", label: "Parking" });
  if (data.hasGym)     features.push({ icon: "🏋️", label: "Gym Access" });
  if (data.hasPool)    features.push({ icon: "🏊", label: "Swimming Pool" });
  if (data.hasGarden)  features.push({ icon: "🌿", label: "Garden" });
  if (data.hasBalcony) features.push({ icon: "🏡", label: "Balcony" });
  if (data.hasWifi)    features.push({ icon: "📶", label: "WiFi" });
  if (data.hasMeals)   features.push({ icon: "🍽️", label: "Meals Included" });
  if (data.petFriendly) features.push({ icon: "🐾", label: "Pet Friendly" });
  if (data.areaSqft)   features.push({ icon: "📐", label: `${data.areaSqft} sqft` });

  return (
    <div className="listing-page">

      {/* HERO IMAGE */}
      <div className="listing-hero" style={{ backgroundImage: `url(${hero})` }}>
        <div className="listing-hero-overlay" />
        <div className="listing-hero-actions">
          <button className={`hero-save-btn ${isSaved ? "saved" : ""}`} onClick={toggleSave_}>
            {isSaved ? "❤️ Saved" : "🤍 Save"}
          </button>
        </div>
      </div>

      <div className="container listing-layout">

        {/* LEFT — property details */}
        <div className="listing-left">

          <div className="listing-header">
            <div>
              <div className={`listing-availability ${(data.status || "available").toLowerCase()}`}>
                {data.status === "occupied" ? "● Occupied" : "● Available Now"}
              </div>
              <h1 className="title">{data.title}</h1>
              <p className="location">📍 {data.location}, {data.city}</p>
            </div>
            <div className="price-box">
              <h2>₱{(data.price || 0).toLocaleString()}</h2>
              <span>/ month</span>
            </div>
          </div>

          <div className="property-meta">
            <div className="meta-item"><strong>{data.bedrooms  || "—"}</strong><span>Bedrooms</span></div>
            <div className="meta-item"><strong>{data.bathrooms || "—"}</strong><span>Bathrooms</span></div>
            <div className="meta-item"><strong>{data.propertyType || "—"}</strong><span>Type</span></div>
            <div className="meta-item"><strong>{data.yearBuilt || "—"}</strong><span>Year Built</span></div>
          </div>

          <div className="section">
            <h3>Description</h3>
            <p className="description">{data.description || "No description available."}</p>
          </div>

          {features.length > 0 && (
            <div className="section">
              <h3>Amenities</h3>
              <div className="features-grid">
                {features.map((f, i) => (
                  <div key={i} className="feature-item">
                    <span>{f.icon}</span> {f.label}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="section">
            <h3>Property Info</h3>
            <div className="info-rows">
              <div className="info-row"><span>Listing ID</span><span>#{data.id}</span></div>
              <div className="info-row"><span>City</span><span>{data.city || "—"}</span></div>
              <div className="info-row"><span>Province</span><span>{data.state || "—"}</span></div>
              <div className="info-row"><span>Area</span><span>{data.areaSqft ? `${data.areaSqft} sqft` : "—"}</span></div>
              <div className="info-row"><span>Listed</span><span>{new Date(data.createdAt || Date.now()).toLocaleDateString()}</span></div>
            </div>
          </div>

        </div>

        {/* RIGHT — booking panel (sticky) */}
        <div className="listing-right">
          <div className="booking-form">

            {/* ── STEP: form ────────────────────────────────── */}
            {step === STEP_FORM && (
              <>
                <h3>Book This Property</h3>

                <label>Move-in Date</label>
                <input
                  type="date"
                  value={checkIn}
                  onChange={(e) => setCheckIn(e.target.value)}
                  min={new Date().toISOString().split("T")[0]}
                />

                <label>Number of Months</label>
                <input
                  type="number"
                  min="1"
                  max="24"
                  value={months}
                  onChange={(e) => setMonths(Number(e.target.value))}
                />

                <div className="total">
                  Total: <strong>₱{total.toLocaleString()}</strong>
                  <span style={{ fontSize: "13px", color: "var(--color-text-muted)", marginLeft: "6px" }}>
                    ({months} mo × ₱{(data.price || 0).toLocaleString()})
                  </span>
                </div>

                {bookingError && (
                  <div className="error-message" style={{ marginTop: "10px" }}>
                    ❌ {bookingError}
                  </div>
                )}

                <button
                  className="btn-continue"
                  onClick={handleBooking}
                  disabled={bookingLoading}
                  style={{ marginTop: "16px" }}
                >
                  {bookingLoading ? "Submitting..." : "📅 Confirm Booking"}
                </button>
              </>
            )}

            {/* ── STEP: message (after booking) ─────────────── */}
            {step === STEP_MESSAGE && (
              <>
                {/* Success banner */}
                <div className="booking-success" style={{ marginBottom: "20px" }}>
                  ✅ Booking submitted successfully!
                </div>

                <h3 style={{ marginBottom: "6px" }}>Message the Owner</h3>
                <p style={{ fontSize: "14px", color: "var(--color-text-muted)", marginBottom: "16px", lineHeight: 1.6 }}>
                  Want to introduce yourself or ask a question? Add a message to your booking request. You can also skip this.
                </p>

                <textarea
                  className="booking-message-textarea"
                  rows={4}
                  placeholder="Hi! I booked your property. My preferred move-in date is... I would like to ask about..."
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  disabled={messageLoading}
                />

                {messageError && (
                  <div className="error-message" style={{ marginTop: "8px" }}>
                    ❌ {messageError}
                  </div>
                )}

                <div className="booking-message-actions">
                  <button
                    className="btn-continue"
                    onClick={handleSendMessage}
                    disabled={messageLoading || !messageText.trim()}
                  >
                    {messageLoading ? "Sending..." : "💬 Send Message"}
                  </button>
                  <button
                    className="btn-skip"
                    onClick={handleSkip}
                    disabled={messageLoading}
                  >
                    Skip → Go to Dashboard
                  </button>
                </div>
              </>
            )}

            {/* ── STEP: done ─────────────────────────────────── */}
            {step === STEP_DONE && (
              <div className="booking-success" style={{ textAlign: "center", padding: "32px 16px" }}>
                <div style={{ fontSize: "40px", marginBottom: "12px" }}>🎉</div>
                <h3 style={{ marginBottom: "8px", color: "var(--color-text-primary)" }}>All Done!</h3>
                <p style={{ color: "var(--color-text-muted)", fontSize: "14px" }}>
                  Redirecting you to your dashboard...
                </p>
              </div>
            )}

          </div>

          {/* Safety note — only shown on the form step */}
          {step === STEP_FORM && (
            <div className="safety-note">
              <strong>🔒 Safe Booking</strong>
              <p>Your booking goes to our admin team who will confirm availability and contact you shortly.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

export default ListingDetails;
