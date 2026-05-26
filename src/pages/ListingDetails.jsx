import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { getListingById, getAllListings } from "../data/appData";
import { addBooking, toggleSaved, getSavedIds, getBookingsByUser } from "../data/adminData";
import listing1 from "../images/listing-1.jpg";
import listing2 from "../images/listing-2.jpg";
import listing3 from "../images/listing-3.png";

const STEP_FORM    = "form";
const STEP_MESSAGE = "message";

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


  // Property + save state
  const [data, setData]     = useState(null);
  const [isSaved, setIsSaved] = useState(false);


  const [reviews, setReviews]         = useState([]);
  const [reviewText, setReviewText]   = useState("");
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewError, setReviewError] = useState("");
  const [reviewSuccess, setReviewSuccess] = useState(false);
  const [hasApprovedBooking, setHasApprovedBooking] = useState(false);
  const currentUserId   = localStorage.getItem("userId");
  const currentUserName = localStorage.getItem("userFullName");

  useEffect(() => {
    const listing = getListingById(parseInt(id))
      || getAllListings().find((l) => String(l.id) === id);
    setData(listing || null);
    setIsSaved(getSavedIds().includes(parseInt(id)));
    // Fetch reviews for this property
    fetch(`http://localhost:8000/api/reviews/property/${id}`)
      .then(r => r.ok ? r.json() : [])
      .then(data => setReviews(Array.isArray(data) ? data : []))
      .catch(() => {});
    // Check if the current user has a confirmed booking for this property
    if (currentUserId) {
      getBookingsByUser(currentUserId)
        .then((bookings) => {
          const approved = bookings.some(
            (b) => String(b.propertyId) === String(id) && b.status === "confirmed"
          );
          setHasApprovedBooking(approved);
        })
        .catch(() => {});
    }
  }, [id, currentUserId]);

  const toggleSave_ = () => {
    const updated = toggleSaved(parseInt(id));
    setIsSaved(updated.includes(parseInt(id)));
  };

  // ── STEP 1: User confirms the booking ────────────────────────

  const handleSubmitReview = async () => {
    if (!isLoggedIn) { alert("Please log in to leave a review."); return; }
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
    if (!checkIn)    { setBookingError("Please select a move-in date."); return; }
    if (months < 1)  { setBookingError("Number of months must be at least 1."); return; }

    setBookingLoading(true);
    setBookingError("");

    // ── Duplicate check: block if the tenant already has an active booking
    //    (pending or confirmed) for this exact listing.
    try {
      const allBookings = await getBookingsByUser(currentUserId);
      const duplicate = allBookings.find(
        (b) =>
          String(b.propertyId) === String(data.id) &&
          (b.status === "pending" || b.status === "confirmed")
      );
      if (duplicate) {
        setBookingError(
          duplicate.status === "pending"
            ? "You already have a pending booking for this property. Please wait for the owner's decision."
            : "You already have an active confirmed booking for this property."
        );
        setBookingLoading(false);
        return;
      }
    } catch {
      // If we can't fetch bookings, let the server enforce the rule
    }

    // ── Conflict check: block if the tenant already has a confirmed booking
    //    whose date range overlaps with the requested dates.
    try {
      const allBookings = await getBookingsByUser(currentUserId);
      const confirmed   = allBookings.filter((b) => b.status === "confirmed");

      const newStart = new Date(checkIn);
      const newEnd   = new Date(checkIn);
      newEnd.setDate(newEnd.getDate() + months * 30);

      for (const b of confirmed) {
        if (!b.checkIn) continue;
        const existStart = new Date(b.checkIn);
        // Reconstruct check-out: months × 30 days from check-in
        const existEnd = new Date(b.checkIn);
        existEnd.setDate(existEnd.getDate() + (b.months || 1) * 30);

        // Standard interval overlap: A starts before B ends AND A ends after B starts
        const overlaps = newStart < existEnd && newEnd > existStart;
        if (overlaps) {
          const fmt = (d) =>
            d.toLocaleDateString("en-PH", { year: "numeric", month: "long", day: "numeric" });
          setBookingError(
            `You already have an active confirmed stay at "${b.propertyTitle}" ` +
            `(${fmt(existStart)} – ${fmt(existEnd)}). ` +
            `You cannot book another property while an approved stay is ongoing. ` +
            `Please choose dates after ${fmt(existEnd)}.`
          );
          setBookingLoading(false);
          return;
        }
      }
    } catch {
      // If we can't fetch bookings (network down), let the server enforce the rule
    }

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
  const hero   = data.featuredImage || images[parseInt(String(data.id).slice(-1)) % images.length];
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
              <div className={`listing-availability ${(data.status || "available").replace(/\s+/g, "-").toLowerCase()}`}>
                {data.status === "occupied"          ? "● Occupied"
                  : data.status === "fully booked"   ? "● Fully Booked"
                  : data.status === "under maintenance" ? "● Under Maintenance"
                  : "● Available Now"}
              </div>
              <h1 className="title">{data.title}</h1>
              <p className="location">📍 {data.location}, {data.city}</p>
              {data.ownerName && (
                <p className="listing-owner-name">🏠 Listed by <strong>{data.ownerName}</strong></p>
              )}
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


          {/* REVIEWS SECTION */}
          <div className="section">
            <h3>⭐ Reviews & Ratings</h3>

            {/* Average rating */}
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

            {/* Existing reviews */}
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

            {/* Write a review */}
            {isLoggedIn && !hasApprovedBooking && (
              <p style={{ fontSize: "13px", color: "var(--color-text-muted)", marginTop: "12px" }}>
                You can only leave a review after your booking has been approved.
              </p>
            )}
            {isLoggedIn && hasApprovedBooking && (
              <div className="review-form">
                <h4>Write a Review</h4>
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
              </div>
            )}
          </div>

        </div>

        {/* RIGHT — booking panel (sticky) */}
        <div className="listing-right">
          <div className="booking-form">

            {/* ── Owner cannot book their own listing ───────── */}
            {isLoggedIn && data.ownerId && Number(currentUserId) === Number(data.ownerId) ? (
              <div className="own-listing-notice">
                <span className="oln-icon">🏠</span>
                <p>This is your listing. You cannot book your own property.</p>
              </div>
            ) : (
              <>
                {/* ── STEP: form ────────────────────────────── */}
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

                {/* ── STEP: message (after booking) ─────────── */}
                {step === STEP_MESSAGE && (
                  <>
                    <div className="booking-success" style={{ marginBottom: "20px" }}>
                      ✅ Booking submitted successfully!
                    </div>

                    <h3 style={{ marginBottom: "6px" }}>Message the Owner?</h3>
                    <p style={{ fontSize: "14px", color: "var(--color-text-muted)", marginBottom: "20px", lineHeight: 1.6 }}>
                      Want to introduce yourself or ask a question? Open the chat to message the owner directly.
                    </p>

                    <div className="booking-message-actions">
                      <button
                        className="btn-continue"
                        onClick={() => {
                          window.dispatchEvent(new CustomEvent("open-chatbox", {
                            detail: { propertyId: data.id, propertyTitle: data.title },
                          }));
                          navigate("/dashboard");
                        }}
                      >
                        💬 Message Owner
                      </button>
                      <button className="btn-skip" onClick={() => navigate("/dashboard")}>
                        Skip → Go to Dashboard
                      </button>
                    </div>
                  </>
                )}

              </>
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
