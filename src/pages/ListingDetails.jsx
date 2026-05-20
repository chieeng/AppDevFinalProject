import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { getListingById, getAllListings, loadPropertiesFromBackend } from "../data/appData";
import { addBooking, addMessage, toggleSaved, getSavedIds } from "../data/adminData";
import listing1 from "../images/listing-1.jpg";
import listing2 from "../images/listing-2.jpg";
import listing3 from "../images/listing-3.png";

const STEP_FORM    = "form";
const STEP_MESSAGE = "message";
const STEP_DONE    = "done";

function ListingDetails({ isLoggedIn }) {
  const { id }   = useParams();
  const navigate = useNavigate();

  const [months, setMonths]               = useState(1);
  const [checkIn, setCheckIn]             = useState("");
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingError, setBookingError]   = useState("");
  const [step, setStep]                   = useState(STEP_FORM);

  const [messageText, setMessageText]       = useState("");
  const [messageLoading, setMessageLoading] = useState(false);
  const [messageError, setMessageError]     = useState("");

  // Pre-booking inquiry (shown in the form step)
  const [showInquiry, setShowInquiry]         = useState(false);
  const [inquiryText, setInquiryText]         = useState("");
  const [inquiryLoading, setInquiryLoading]   = useState(false);
  const [inquiryError, setInquiryError]       = useState("");
  const [inquirySent, setInquirySent]         = useState(false);

  const [data, setData]     = useState(null);
  const [isSaved, setIsSaved] = useState(false);

  const [reviews, setReviews]         = useState([]);
  const [reviewText, setReviewText]   = useState("");
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewError, setReviewError] = useState("");
  const [reviewSuccess, setReviewSuccess] = useState(false);
  const [hasConfirmedBooking, setHasConfirmedBooking] = useState(false);

  const currentUserId   = localStorage.getItem("userId");
  const currentUserName = localStorage.getItem("userFullName");

  useEffect(() => {
    const listing = getListingById(parseInt(id))
      || getAllListings().find((l) => String(l.id) === id);
    setData(listing || null);
    setIsSaved(getSavedIds().includes(parseInt(id)));

    // Fetch reviews
    fetch(`http://localhost:8000/api/reviews/property/${id}`)
      .then(r => r.ok ? r.json() : [])
      .then(d => setReviews(Array.isArray(d) ? d : []))
      .catch(() => {});

    // Check if logged-in user has a confirmed booking (for review gate)
    if (isLoggedIn && currentUserId) {
      fetch(`http://localhost:8000/api/bookings/check?userId=${currentUserId}&propertyId=${id}`)
        .then(r => r.ok ? r.json() : { hasConfirmedBooking: false })
        .then(d => setHasConfirmedBooking(d.hasConfirmedBooking === true))
        .catch(() => {});
    }
  }, [id, isLoggedIn, currentUserId]);

  const toggleSave_ = () => {
    const updated = toggleSaved(parseInt(id));
    setIsSaved(updated.includes(parseInt(id)));
  };

  // Pre-booking inquiry send
  const handleSendInquiry = async () => {
    if (!isLoggedIn) { alert("Please log in to send an inquiry."); navigate("/login"); return; }
    if (!inquiryText.trim()) { setInquiryError("Please write your message."); return; }
    setInquiryLoading(true);
    setInquiryError("");
    try {
      await addMessage({
        from:          currentUserId,
        fromName:      currentUserName || "User",
        fromEmail:     localStorage.getItem("userEmail") || "",
        propertyId:    data.id,
        propertyTitle: data.title,
        text:          inquiryText.trim(),
      });
      setInquirySent(true);
      setInquiryText("");
      setTimeout(() => { setInquirySent(false); setShowInquiry(false); }, 2500);
    } catch (err) {
      setInquiryError(err.message || "Failed to send inquiry.");
    } finally {
      setInquiryLoading(false);
    }
  };

  const handleSubmitReview = async () => {
    if (!isLoggedIn) { alert("Please log in to leave a review."); return; }
    if (!hasConfirmedBooking) {
      setReviewError("You can only review properties you have a confirmed booking for.");
      return;
    }
    if (!reviewText.trim()) { setReviewError("Please write a review."); return; }
    setReviewLoading(true);
    setReviewError("");
    try {
      const res = await fetch("http://localhost:8000/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          propertyId: Number(data.id),
          userId:     Number(currentUserId),
          rating:     reviewRating,
          comment:    reviewText.trim(),
        }),
      });
      const saved = await res.json();
      if (!res.ok) throw new Error(saved.message || "Failed to submit review");
      setReviews((prev) => [saved, ...prev]);
      setReviewText("");
      setReviewRating(5);
      setReviewSuccess(true);
      setTimeout(() => setReviewSuccess(false), 3000);
    } catch (err) {
      setReviewError(err.message || "Failed to submit review.");
    } finally {
      setReviewLoading(false);
    }
  };

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
      setStep(STEP_MESSAGE);
    } catch (err) {
      setBookingError(err.message || "Booking failed. Please try again.");
    } finally {
      setBookingLoading(false);
    }
  };

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

  const handleSkip = () => {
    setStep(STEP_DONE);
    setTimeout(() => navigate("/dashboard"), 1200);
  };

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
  if (data.hasParking)  features.push({ icon: "🅿️", label: "Parking" });
  if (data.hasGym)      features.push({ icon: "🏋️", label: "Gym Access" });
  if (data.hasPool)     features.push({ icon: "🏊", label: "Swimming Pool" });
  if (data.hasGarden)   features.push({ icon: "🌿", label: "Garden" });
  if (data.hasBalcony)  features.push({ icon: "🏡", label: "Balcony" });
  if (data.hasWifi)     features.push({ icon: "📶", label: "WiFi" });
  if (data.hasMeals)    features.push({ icon: "🍽️", label: "Meals Included" });
  if (data.petFriendly) features.push({ icon: "🐾", label: "Pet Friendly" });
  if (data.areaSqft)    features.push({ icon: "📐", label: `${data.areaSqft} sqft` });

  return (
    <div className="listing-page">

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
                  <div key={i} className="feature-item"><span>{f.icon}</span> {f.label}</div>
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

          {/* REVIEWS SECTION */}
          <div className="section">
            <h3>⭐ Reviews & Ratings</h3>

            {reviews.length > 0 && (
              <div className="reviews-avg">
                <span className="reviews-avg-score">
                  {(reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)}
                </span>
                <span className="reviews-avg-stars">
                  {"★".repeat(Math.round(reviews.reduce((s, r) => s + r.rating, 0) / reviews.length))}
                  {"☆".repeat(5 - Math.round(reviews.reduce((s, r) => s + r.rating, 0) / reviews.length))}
                </span>
                <span className="reviews-avg-count">({reviews.length} review{reviews.length !== 1 ? "s" : ""})</span>
              </div>
            )}

            <div className="reviews-list">
              {reviews.length === 0 ? (
                <p style={{ color: "var(--color-text-muted)", fontSize: "14px" }}>No reviews yet. Be the first to review!</p>
              ) : (
                reviews.map((r, i) => (
                  <div key={r.id || i} className="review-item">
                    <div className="review-header">
                      <div className="review-avatar">{(r.userName || "U")[0].toUpperCase()}</div>
                      <div>
                        <div className="review-name">{r.userName || "Anonymous"}</div>
                        <div className="review-stars">{"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}</div>
                      </div>
                      <div className="review-date">{r.createdAt ? new Date(r.createdAt).toLocaleDateString() : ""}</div>
                    </div>
                    <p className="review-comment">{r.comment}</p>
                  </div>
                ))
              )}
            </div>

            {/* Write a review — only for users with confirmed bookings */}
            {isLoggedIn && (
              <div className="review-form">
                <h4>Write a Review</h4>
                {hasConfirmedBooking ? (
                  <>
                    <div className="review-rating-pick">
                      <span>Rating:</span>
                      {[1,2,3,4,5].map((star) => (
                        <button
                          key={star}
                          className={`star-btn ${star <= reviewRating ? "active" : ""}`}
                          onClick={() => setReviewRating(star)}
                        >★</button>
                      ))}
                    </div>
                    <textarea
                      placeholder="Share your experience with this property..."
                      value={reviewText}
                      onChange={(e) => setReviewText(e.target.value)}
                      rows={3}
                      style={{ width: "100%", padding: "10px 12px", borderRadius: "10px", border: "1.5px solid var(--color-border)", fontSize: "14px", fontFamily: "inherit", resize: "vertical", background: "var(--color-light-bg)", color: "var(--color-text-primary)", boxSizing: "border-box" }}
                    />
                    {reviewError   && <div className="error-message">{reviewError}</div>}
                    {reviewSuccess && <div className="booking-success" style={{ padding: "10px", marginTop: "8px" }}>✅ Review submitted!</div>}
                    <button
                      className="btn-continue"
                      onClick={handleSubmitReview}
                      disabled={reviewLoading || !reviewText.trim()}
                      style={{ marginTop: "10px" }}
                    >
                      {reviewLoading ? "Submitting..." : "Submit Review"}
                    </button>
                  </>
                ) : (
                  <div style={{ background: "#fef9c3", border: "1px solid #fde68a", borderRadius: "10px", padding: "14px", fontSize: "14px", color: "#92400e" }}>
                    🔒 You can only review properties you have a <strong>confirmed booking</strong> for.
                  </div>
                )}
              </div>
            )}
          </div>

        </div>

        {/* RIGHT — booking + inquiry panel */}
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

                {/* ── PRE-BOOKING INQUIRY ────────────────────── */}
                <div style={{ marginTop: "20px", borderTop: "1px solid var(--color-border)", paddingTop: "16px" }}>
                  {!showInquiry ? (
                    <button
                      className="btn-skip"
                      onClick={() => {
                        if (!isLoggedIn) { navigate("/login"); return; }
                        setShowInquiry(true);
                      }}
                      style={{ width: "100%" }}
                    >
                      💬 Ask the Owner a Question
                    </button>
                  ) : (
                    <>
                      <h4 style={{ marginBottom: "8px", fontSize: "14px" }}>Send an Inquiry</h4>
                      <p style={{ fontSize: "13px", color: "var(--color-text-muted)", marginBottom: "10px" }}>
                        Have questions before booking? Send a message to the owner.
                      </p>
                      <textarea
                        rows={3}
                        placeholder="Hi! I'd like to ask about..."
                        value={inquiryText}
                        onChange={(e) => setInquiryText(e.target.value)}
                        disabled={inquiryLoading}
                        style={{ width: "100%", padding: "10px 12px", borderRadius: "10px", border: "1.5px solid var(--color-border)", fontSize: "13px", fontFamily: "inherit", resize: "vertical", background: "var(--color-light-bg)", color: "var(--color-text-primary)", boxSizing: "border-box" }}
                      />
                      {inquiryError && <div className="error-message" style={{ marginTop: "6px" }}>{inquiryError}</div>}
                      {inquirySent  && <div className="booking-success" style={{ padding: "8px 12px", marginTop: "6px" }}>✅ Inquiry sent!</div>}
                      <div style={{ display: "flex", gap: "8px", marginTop: "10px" }}>
                        <button
                          className="btn-continue"
                          onClick={handleSendInquiry}
                          disabled={inquiryLoading || !inquiryText.trim()}
                          style={{ flex: 1 }}
                        >
                          {inquiryLoading ? "Sending..." : "Send"}
                        </button>
                        <button
                          className="btn-skip"
                          onClick={() => { setShowInquiry(false); setInquiryText(""); setInquiryError(""); }}
                          disabled={inquiryLoading}
                        >
                          Cancel
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </>
            )}

            {/* ── STEP: message (after booking) ─────────────── */}
            {step === STEP_MESSAGE && (
              <>
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
                  <div className="error-message" style={{ marginTop: "8px" }}>❌ {messageError}</div>
                )}
                <div className="booking-message-actions">
                  <button className="btn-continue" onClick={handleSendMessage} disabled={messageLoading || !messageText.trim()}>
                    {messageLoading ? "Sending..." : "💬 Send Message"}
                  </button>
                  <button className="btn-skip" onClick={handleSkip} disabled={messageLoading}>
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
