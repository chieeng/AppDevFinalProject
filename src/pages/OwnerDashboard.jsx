import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  getOwnerListings, addOwnerListing, updateOwnerListing, deleteOwnerListing,
  getOwnerBookings, updateOwnerBookingStatus,
} from "../data/adminData";

const BLANK = {
  title: "", description: "", price: "",
  propertyType: "Boarding House",
  status: "available",
  location: "", city: "", state: "", country: "Philippines",
  bedrooms: 1, bathrooms: 1, areaSqft: "", yearBuilt: "",
  hasParking: false, hasGym: false, hasPool: false,
  hasGarden: false, hasBalcony: false,
  hasWifi: false, hasMeals: false, petFriendly: false,
  featuredImage: "",
};

const STATUS_TYPES = ["available", "fully booked", "under maintenance"];

function OwnerDashboard() {
  const navigate  = useNavigate();
  const ownerId   = Number(localStorage.getItem("userId"));
  const ownerName = localStorage.getItem("userFullName") || "Owner";

  const [tab, setTab]       = useState("listings");
  const [loading, setLoading] = useState(true);

  // ── Listings state ──
  const [listings, setListings]   = useState([]);
  const [showForm, setShowForm]   = useState(false);
  const [editId, setEditId]       = useState(null);
  const [form, setForm]           = useState(BLANK);
  const [saving, setSaving]       = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [listingError, setListingError]   = useState("");

  // ── Bookings state ──
  const [bookings, setBookings]   = useState([]);
  const [bookingFilter, setBookingFilter] = useState("all");
  const [updatingBooking, setUpdatingBooking] = useState(null);


  useEffect(() => {
    if (localStorage.getItem("userRole") !== "OWNER") {
      navigate("/login");
      return;
    }
    if (!ownerId) { navigate("/login"); return; }
    loadAll();
  }, []);

  const loadAll = async () => {
    setLoading(true);
    const [l, b] = await Promise.all([
      getOwnerListings(ownerId),
      getOwnerBookings(ownerId),
    ]);
    setListings(l);
    setBookings(b);
    setLoading(false);
  };

  // ── Listing CRUD ─────────────────────────────────
  const openNew  = () => { setForm(BLANK); setEditId(null); setListingError(""); setShowForm(true); };
  const openEdit = (l) => { setForm({ ...BLANK, ...l }); setEditId(l.id); setListingError(""); setShowForm(true); };
  const closeForm = () => { setShowForm(false); setEditId(null); setForm(BLANK); setListingError(""); };

  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setListingError("Image must be under 5 MB. Please choose a smaller file.");
      e.target.value = "";
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => setForm((prev) => ({ ...prev, featuredImage: reader.result }));
    reader.readAsDataURL(file);
  };

  const handleSaveListing = async () => {
    if (!form.title.trim() || !form.price || !form.city.trim()) {
      setListingError("Title, Price, and City are required.");
      return;
    }
    setSaving(true);
    setListingError("");
    try {
      if (editId) {
        await updateOwnerListing(editId, form, ownerId);
        setListings((prev) => prev.map((l) =>
          l.id === editId ? { ...l, ...form, price: Number(form.price) || 0 } : l
        ));
      } else {
        const saved = await addOwnerListing(form, ownerId);
        setListings((prev) => [...prev, saved]);
        // Show a brief notice that the listing is pending admin review
        alert("Listing submitted! It will appear publicly once an admin approves it. You can see it in your listings with a \"Pending Review\" badge.");
      }
      closeForm();
    } catch (err) {
      setListingError(err.message || "Failed to save listing.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteOwnerListing(id, ownerId);
      setListings((prev) => prev.filter((l) => l.id !== id));
    } catch (err) {
      alert("Delete failed: " + err.message);
    }
    setDeleteConfirm(null);
  };

  // ── Booking actions ──────────────────────────────
  const handleBookingStatus = async (bookingId, status) => {
    setUpdatingBooking(bookingId);
    try {
      await updateOwnerBookingStatus(bookingId, status, ownerId);
      setBookings((prev) => prev.map((b) => b.id === bookingId ? { ...b, status } : b));
    } catch (err) {
      alert("Update failed: " + err.message);
    } finally {
      setUpdatingBooking(null);
    }
  };


  // ── Helpers ──────────────────────────────────────
  const statusStyle = (s) => {
    if (s === "confirmed")  return { bg: "#ecfdf5", color: "#059669", border: "#a7f3d0" };
    if (s === "completed")  return { bg: "#eff6ff", color: "#2563eb", border: "#bfdbfe" };
    if (s === "rejected")   return { bg: "#fef2f2", color: "#dc2626", border: "#fecaca" };
    if (s === "cancelled")  return { bg: "#f1f5f9", color: "#64748b", border: "#cbd5e1" };
    return { bg: "#fffbeb", color: "#d97706", border: "#fde68a" };
  };

  const filteredBookings = bookingFilter === "all"
    ? bookings
    : bookings.filter((b) => b.status === bookingFilter);

  // ── Stats ─────────────────────────────────────────
  const totalBookings  = bookings.filter((b) => b.status !== "rejected" && b.status !== "cancelled").length;
  const pendingCount   = bookings.filter((b) => b.status === "pending").length;
  const confirmedCount = bookings.filter((b) => b.status === "confirmed").length;

  if (loading) {
    return (
      <div className="browse-loading" style={{ paddingTop: 100 }}>
        <div className="browse-spinner" />
        <p>Loading your dashboard…</p>
      </div>
    );
  }

  return (
    <div className="owner-dashboard">

      {/* ── Header ── */}
      <div className="owner-header">
        <div className="container owner-header-inner">
          <div>
            <h1>Owner Dashboard</h1>
            <p>Welcome back, <strong>{ownerName}</strong> — manage your properties and bookings below.</p>
          </div>
          <div className="owner-stats-row">
            <div className="owner-stat">
              <span className="owner-stat-num">{listings.length}</span>
              <span className="owner-stat-label">Listings</span>
            </div>
            <div className="owner-stat">
              <span className="owner-stat-num">{totalBookings}</span>
              <span className="owner-stat-label">Bookings</span>
            </div>
            <div className="owner-stat pending-stat">
              <span className="owner-stat-num">{pendingCount}</span>
              <span className="owner-stat-label">Pending</span>
            </div>
            <div className="owner-stat">
              <span className="owner-stat-num">{confirmedCount}</span>
              <span className="owner-stat-label">Confirmed</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Tab Bar ── */}
      <div className="owner-tabs">
        <div className="container">
          {[
            { key: "listings", label: "🏠 My Listings" },
            { key: "bookings", label: `📋 Bookings${pendingCount > 0 ? ` (${pendingCount})` : ""}` },
          ].map((t) => (
            <button
              key={t.key}
              className={`owner-tab-btn ${tab === t.key ? "active" : ""}`}
              onClick={() => setTab(t.key)}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="container owner-content">

        {/* ══════════════════════════════════
            TAB: MY LISTINGS
        ══════════════════════════════════ */}
        {tab === "listings" && (
          <div className="owner-section">
            <div className="owner-section-header">
              <h2>My Listings</h2>
              <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                <button
                  className="owner-refresh-btn"
                  onClick={loadAll}
                  title="Refresh to see latest approval status"
                >
                  🔄 Refresh
                </button>
                <button className="owner-add-btn" onClick={openNew}>+ Add New Listing</button>
              </div>
            </div>

            {/* Pending listings notice */}
            {listings.filter((l) => l.approvalStatus === "pending").length > 0 && (
              <div className="owner-pending-notice">
                ⏳ <strong>{listings.filter((l) => l.approvalStatus === "pending").length}</strong> listing{listings.filter((l) => l.approvalStatus === "pending").length !== 1 ? "s" : ""} pending admin review — click <strong>Refresh</strong> to check for updates.
              </div>
            )}

            {/* ── Listing Form ── */}
            {showForm && (
              <div className="owner-form-card">
                <h3>{editId ? "Edit Listing" : "New Listing"}</h3>
                {listingError && <div className="error-message">{listingError}</div>}

                <div className="owner-form-grid">
                  <div className="owner-form-group full-width">
                    <label>Title *</label>
                    <input name="title" value={form.title} onChange={handleFormChange} placeholder="e.g. Cozy Room near UP Diliman" />
                  </div>
                  <div className="owner-form-group full-width">
                    <label>Description</label>
                    <textarea name="description" value={form.description} onChange={handleFormChange} rows={3} placeholder="Describe the property…" />
                  </div>
                  <div className="owner-form-group">
                    <label>Monthly Price (₱) *</label>
                    <input name="price" type="number" value={form.price} onChange={handleFormChange} placeholder="3500" />
                  </div>
                  <div className="owner-form-group">
                    <label>Property Type</label>
                    <select name="propertyType" value={form.propertyType} onChange={handleFormChange}>
                      {["Boarding House","Bed Space","Dormitory"].map((t) => (
                        <option key={t}>{t}</option>
                      ))}
                    </select>
                  </div>
                  <div className="owner-form-group">
                    <label>Status</label>
                    <select name="status" value={form.status} onChange={handleFormChange}>
                      {STATUS_TYPES.map((s) => <option key={s}>{s}</option>)}
                    </select>
                  </div>
                  <div className="owner-form-group">
                    <label>City *</label>
                    <input name="city" value={form.city} onChange={handleFormChange} placeholder="Quezon City" />
                  </div>
                  <div className="owner-form-group">
                    <label>Province / State</label>
                    <input name="state" value={form.state} onChange={handleFormChange} placeholder="Metro Manila" />
                  </div>
                  <div className="owner-form-group full-width">
                    <label>Street / Location</label>
                    <input name="location" value={form.location} onChange={handleFormChange} placeholder="118 Katipunan Avenue" />
                  </div>
                  <div className="owner-form-group">
                    <label>Bedrooms</label>
                    <input name="bedrooms" type="number" min="1" value={form.bedrooms} onChange={handleFormChange} />
                  </div>
                  <div className="owner-form-group">
                    <label>Bathrooms</label>
                    <input name="bathrooms" type="number" min="1" value={form.bathrooms} onChange={handleFormChange} />
                  </div>
                  <div className="owner-form-group">
                    <label>Area (sqft)</label>
                    <input name="areaSqft" type="number" value={form.areaSqft} onChange={handleFormChange} placeholder="Optional" />
                  </div>
                  <div className="owner-form-group">
                    <label>Year Built</label>
                    <input name="yearBuilt" type="number" value={form.yearBuilt} onChange={handleFormChange} placeholder="Optional" />
                  </div>
                </div>

                {/* Amenities */}
                <div className="owner-amenities">
                  <label className="owner-amenities-title">Amenities</label>
                  <div className="owner-amenities-grid">
                    {[
                      ["hasParking","Parking"],["hasGym","Gym"],["hasPool","Pool"],
                      ["hasGarden","Garden"],["hasBalcony","Balcony"],
                      ["hasWifi","WiFi"],["hasMeals","Meals included"],["petFriendly","Pet-friendly"],
                    ].map(([name, label]) => (
                      <label key={name} className="owner-check-label">
                        <input type="checkbox" name={name} checked={!!form[name]} onChange={handleFormChange} />
                        {label}
                      </label>
                    ))}
                  </div>
                </div>

                {/* Featured image */}
                <div className="owner-form-group full-width" style={{ marginTop: 16 }}>
                  <label>Featured Image</label>
                  <input type="file" accept="image/*" onChange={handleImageUpload} />
                  {form.featuredImage && (
                    <img src={form.featuredImage} alt="preview" className="owner-img-preview" />
                  )}
                </div>

                <div className="owner-form-actions">
                  <button className="owner-cancel-btn" onClick={closeForm} disabled={saving}>Cancel</button>
                  <button className="owner-save-btn" onClick={handleSaveListing} disabled={saving}>
                    {saving ? "Saving…" : editId ? "Save Changes" : "Create Listing"}
                  </button>
                </div>
              </div>
            )}

            {/* ── Listing cards ── */}
            {listings.length === 0 ? (
              <div className="owner-empty">
                <span>🏠</span>
                <p>No listings yet. Click "Add New Listing" to get started!</p>
              </div>
            ) : (
              <div className="owner-listings-grid">
                {listings.map((l) => (
                  <div key={l.id} className="owner-listing-card">
                    {l.featuredImage ? (
                      <img src={l.featuredImage} alt={l.title} className="owner-listing-img" />
                    ) : (
                      <div className="owner-listing-img-placeholder">🏠</div>
                    )}
                    <div className="owner-listing-body">
                      <div className="owner-listing-top">
                        <h3>{l.title}</h3>
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
                          {l.approvalStatus === "pending" && (
                            <span className="owner-status-badge status-pending-review">⏳ Pending Review</span>
                          )}
                          {l.approvalStatus === "rejected" && (
                            <span className="owner-status-badge status-rejected">✕ Rejected</span>
                          )}
                          {(!l.approvalStatus || l.approvalStatus === "approved") && (
                            <span className={`owner-status-badge status-${(l.status || "available").replace(/\s+/g, "-")}`}>
                              {l.status || "available"}
                            </span>
                          )}
                        </div>
                      </div>
                      <p className="owner-listing-location">📍 {l.city}{l.state ? `, ${l.state}` : ""}</p>
                      <p className="owner-listing-price">₱{Number(l.price).toLocaleString()}/mo</p>
                      <p className="owner-listing-type">{l.propertyType} · {l.bedrooms}BR {l.bathrooms}BA</p>
                      {/* Per-property booking stats */}
                      <p className="owner-listing-stats">
                        {bookings.filter((b) => String(b.propertyId) === String(l.id)).length} booking(s) ·{" "}
                        {bookings.filter((b) => String(b.propertyId) === String(l.id) && b.status === "pending").length} pending
                      </p>
                    </div>
                    <div className="owner-listing-actions">
                      <button className="owner-edit-btn" onClick={() => openEdit(l)}>Edit</button>
                      {deleteConfirm === l.id ? (
                        <>
                          <span className="owner-confirm-text">Delete?</span>
                          <button className="owner-delete-confirm-btn" onClick={() => handleDelete(l.id)}>Yes</button>
                          <button className="owner-cancel-btn small" onClick={() => setDeleteConfirm(null)}>No</button>
                        </>
                      ) : (
                        <button className="owner-delete-btn" onClick={() => setDeleteConfirm(l.id)}>Delete</button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ══════════════════════════════════
            TAB: BOOKINGS
        ══════════════════════════════════ */}
        {tab === "bookings" && (
          <div className="owner-section">
            <div className="owner-section-header">
              <h2>Bookings</h2>
              <div className="owner-filter-pills">
                {["all","pending","confirmed","completed","rejected","cancelled"].map((f) => (
                  <button
                    key={f}
                    className={`owner-pill ${bookingFilter === f ? "active" : ""}`}
                    onClick={() => setBookingFilter(f)}
                  >
                    {f.charAt(0).toUpperCase() + f.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {filteredBookings.length === 0 ? (
              <div className="owner-empty">
                <span>📋</span>
                <p>{bookingFilter === "all" ? "No bookings yet." : `No ${bookingFilter} bookings.`}</p>
              </div>
            ) : (
              <div className="owner-bookings-list">
                {filteredBookings.map((b) => {
                  const st = statusStyle(b.status);
                  const isPending = b.status === "pending";
                  const isUpdating = updatingBooking === b.id;
                  return (
                    <div key={b.id} className="owner-booking-card">
                      <div className="obc-left">
                        <div className="obc-property">{b.propertyTitle}</div>
                        <div className="obc-tenant">
                          👤 {b.userName} — <a href={`mailto:${b.userEmail}`}>{b.userEmail}</a>
                        </div>
                        <div className="obc-dates">
                          📅 Check-in: {b.checkIn ? new Date(b.checkIn).toLocaleDateString() : "—"}
                          {b.months && (
                            <> &nbsp;→&nbsp; Check-out: {(() => {
                              const d = new Date(b.checkIn);
                              d.setDate(d.getDate() + b.months * 30);
                              return d.toLocaleDateString();
                            })()}</>
                          )}
                        </div>
                        <div className="obc-total">
                          💰 Total: ₱{Number(b.total || 0).toLocaleString()}
                          {b.notes && <> · {b.notes}</>}
                        </div>
                        <div className="obc-date">Submitted: {new Date(b.date).toLocaleDateString()}</div>
                      </div>
                      <div className="obc-right">
                        <span
                          className="obc-status"
                          style={{ background: st.bg, color: st.color, border: `1px solid ${st.border}` }}
                        >
                          {b.status}
                        </span>
                        {isPending && (
                          <div className="obc-actions">
                            <button
                              className="owner-approve-btn"
                              disabled={isUpdating}
                              onClick={() => handleBookingStatus(b.id, "confirmed")}
                            >
                              {isUpdating ? "…" : "Approve"}
                            </button>
                            <button
                              className="owner-reject-btn"
                              disabled={isUpdating}
                              onClick={() => handleBookingStatus(b.id, "rejected")}
                            >
                              {isUpdating ? "…" : "Reject"}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}


      </div>
    </div>
  );
}

export default OwnerDashboard;
