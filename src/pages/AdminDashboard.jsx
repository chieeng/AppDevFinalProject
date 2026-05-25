import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  getMessages, markMessageRead, replyToMessage,
  getBookings, updateBookingStatus,
  getAdminListings, addListing, updateListing, deleteListing, setListingApproval,
} from "../data/adminData";

// ─────────────────────────────────────────────
// BLANK FORM STATE  (matches the mock data shape)
// ─────────────────────────────────────────────
const BLANK = {
  title: "", description: "", price: "",
  propertyType: "Boarding House",  // always Boarding House — this app is BH only
  status: "available",
  location: "", city: "", state: "", country: "Philippines",
  bedrooms: 1, bathrooms: 1, areaSqft: "",
  yearBuilt: "", hasParking: false, hasGym: false,
  hasPool: false, hasGarden: false, hasBalcony: false,
  hasWifi: false, hasMeals: false, petFriendly: false,
  featuredImage: "",
};

function AdminDashboard() {
  const navigate   = useNavigate();
  const [tab, setTab] = useState("listings");

  // ── Listings state ──
  const [listings, setListings]     = useState([]);
  const [showForm, setShowForm]     = useState(false);
  const [editId, setEditId]         = useState(null);   // null = new listing
  const [form, setForm]             = useState(BLANK);
  const [saving, setSaving]         = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null); // id to confirm delete

  // ── Bookings state ──
  const [bookings, setBookings]   = useState([]);
  const [filter, setFilter]       = useState("all");

  // ── Messages state ──
  const [messages, setMessages]   = useState([]);
  const [replyModal, setReplyModal] = useState(null);
  const [replyText, setReplyText]   = useState("");
  const [replying, setReplying]     = useState(false);

  const [loading, setLoading]     = useState(true);

  useEffect(() => {
    if (localStorage.getItem("userRole") !== "ADMIN") { navigate("/login"); return; }
    loadAll();
  }, []);

  const loadAll = async () => {
    setLoading(true);
    const [backendListings, b, m] = await Promise.all([
      getAdminListings(),
      getBookings(),
      getMessages(),
    ]);

    // Supplement with any listings from vs_properties that didn't come back from the backend.
    // addOwnerListing writes to vs_properties on success, so owner-submitted listings
    // are always present there even if getAdminListings had a cache/sync miss.
    const propsCache = JSON.parse(localStorage.getItem("vs_properties") || "[]");
    const seenIds = new Set(backendListings.map((l) => Number(l.id)));
    const extraFromProps = propsCache.filter((l) => l.id && !seenIds.has(Number(l.id)));

    // Also include admin-only listings that only reached localStorage (marked _localOnly)
    const adminCache = JSON.parse(localStorage.getItem("vs_admin_listings") || "[]");
    const localOnly = adminCache.filter((l) => l._localOnly);

    const merged = [...localOnly, ...extraFromProps, ...backendListings];
    setListings(merged);
    setBookings(b);
    setMessages(m);
    setLoading(false);
  };

  // ── Listing filter state ──────────────────────
  const [listingFilter, setListingFilter] = useState("all"); // "all" | "pending" | "approved" | "rejected"

  // ── Listing actions ──────────────────────────
  const openNew  = () => { setForm(BLANK); setEditId(null); setShowForm(true); };
  const openEdit = (listing) => {
    setForm({ ...BLANK, ...listing });
    setEditId(listing.id);
    setShowForm(true);
  };
  const closeForm = () => { setShowForm(false); setEditId(null); setForm(BLANK); };

  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  };

  // Convert selected image file to base64 and store in form state
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setForm((prev) => ({ ...prev, featuredImage: reader.result }));
    };
    reader.readAsDataURL(file);
  };

  const handleSaveListing = async () => {
    if (!form.title.trim() || !form.price || !form.city.trim()) {
      alert("Please fill in Title, Price, and City — they are required.");
      return;
    }
    setSaving(true);
    const payload = {
      ...form,
      propertyType: "Boarding House",
      price:     parseFloat(form.price)    || 0,
      bedrooms:  parseInt(form.bedrooms)   || 1,
      bathrooms: parseInt(form.bathrooms)  || 1,
      areaSqft:  form.areaSqft  ? parseFloat(form.areaSqft)  : null,
      yearBuilt: form.yearBuilt ? parseInt(form.yearBuilt) : null,
    };

    try {
      if (editId) {
        await updateListing(editId, payload);
      } else {
        await addListing(payload);
      }
      // Success — reload list then close form
      await loadAll();
      closeForm();
    } catch (err) {
      // Show the real backend error so admin knows what went wrong
      // Keep form open so admin can fix and retry
      alert("⚠️ Backend error: " + (err.message || "Unknown error") +
        "\n\nThe listing has been saved locally and will appear in your list. " +
        "It will sync to the database once the connection is restored.");
      // Still reload so the locally-saved version shows up
      await loadAll();
      closeForm();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    await deleteListing(id);
    setDeleteConfirm(null);
    loadAll();
  };

  // ── Booking actions ──────────────────────────
  const handleBookingAction = async (id, action) => {
    await updateBookingStatus(id, action);
    loadAll();
  };

  // ── Message actions ──────────────────────────
  const openReply = (msg) => {
    markMessageRead(msg.id);
    setReplyModal(msg);
    setReplyText(msg.reply || "");
  };
  const handleSendReply = async () => {
    if (!replyText.trim()) return;
    setReplying(true);
    await replyToMessage(replyModal.id, replyText.trim());
    setReplying(false);
    setReplyModal(null);
    loadAll();
  };

  // ── Listing approval action ──────────────────
  const handleApproval = async (id, approvalStatus) => {
    await setListingApproval(id, approvalStatus);
    loadAll();
  };

  // ── Derived counts ───────────────────────────
  const pendingApprovalCount = listings.filter((l) => l.approvalStatus === "pending").length;
  const pendingCount  = bookings.filter((b) => b.status === "pending").length;
  const unreadCount   = messages.filter((m) => !m.read).length;
  const filteredBk    = filter === "all" ? bookings : bookings.filter((b) => b.status === filter);

  const statusStyle = (s) => {
    if (s === "confirmed")  return { bg: "#ecfdf5", color: "#059669", border: "#a7f3d0" };
    if (s === "completed")  return { bg: "#eff6ff", color: "#2563eb", border: "#bfdbfe" };
    if (s === "rejected")   return { bg: "#fef2f2", color: "#dc2626", border: "#fecaca" };
    if (s === "cancelled")  return { bg: "#f1f5f9", color: "#64748b", border: "#cbd5e1" };
    return { bg: "#fffbeb", color: "#d97706", border: "#fde68a" };
  };

  return (
    <div className="admin-page">

      {/* ── HEADER ──────────────────────────── */}
      <div className="admin-header">
        <div className="container admin-header-inner">
          <div>
            <h1>Admin Dashboard</h1>
            <p>VacanSee Property Management System</p>
          </div>
          <div className="admin-header-stats">
            <div className="admin-stat-pill"><span>{listings.length}</span> listings</div>
            {pendingApprovalCount > 0 && (
              <div className="admin-stat-pill unread"><span>{pendingApprovalCount}</span> pending approval</div>
            )}
            <div className="admin-stat-pill"><span>{pendingCount}</span> pending bookings</div>
            <div className="admin-stat-pill unread"><span>{unreadCount}</span> unread messages</div>
          </div>
        </div>
      </div>

      <div className="container admin-body">

        {/* ── TABS ────────────────────────────── */}
        <div className="admin-tabs">
          <button className={`admin-tab ${tab === "listings" ? "active" : ""}`} onClick={() => setTab("listings")}>
            🏠 Listings <span className="tab-count">{listings.length}</span>
            {pendingApprovalCount > 0 && <span className="tab-badge">{pendingApprovalCount}</span>}
          </button>
          <button className={`admin-tab ${tab === "bookings" ? "active" : ""}`} onClick={() => setTab("bookings")}>
            📅 Bookings
            {pendingCount > 0 && <span className="tab-badge">{pendingCount}</span>}
          </button>
          <button className={`admin-tab ${tab === "messages" ? "active" : ""}`} onClick={() => setTab("messages")}>
            💬 Messages
            {unreadCount > 0 && <span className="tab-badge">{unreadCount}</span>}
          </button>
        </div>

        {loading ? (
          <div className="admin-loading">Loading…</div>
        ) : (

          <>
            {/* ════════════════════════════════════
                LISTINGS TAB
            ════════════════════════════════════ */}
            {tab === "listings" && (
              <div className="admin-section">
                <div className="admin-section-header">
                  <h2>Property Listings</h2>
                  <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                    <button className="admin-refresh-btn" onClick={loadAll} title="Refresh listings">🔄 Refresh</button>
                    <button className="admin-add-btn" onClick={openNew}>+ Add New Listing</button>
                  </div>
                </div>

                {/* ── PENDING APPROVAL BANNER (always shown first when there are pending listings) ── */}
                {listings.filter((l) => l.approvalStatus === "pending").length > 0 && (
                  <div className="admin-pending-section">
                    <div className="admin-pending-header">
                      <span className="admin-pending-icon">⏳</span>
                      <div>
                        <h3>Pending Owner Submissions</h3>
                        <p>{listings.filter((l) => l.approvalStatus === "pending").length} listing{listings.filter((l) => l.approvalStatus === "pending").length !== 1 ? "s" : ""} waiting for your approval</p>
                      </div>
                    </div>
                    <div className="admin-listings-grid">
                      {listings.filter((l) => l.approvalStatus === "pending").map((l) => (
                        <div key={l.id} className="admin-listing-card pending-card">
                          {l.featuredImage && <div className="alc-image"><img src={l.featuredImage} alt={l.title} /></div>}
                          <div className="alc-header">
                            <div className="alc-title">{l.title}</div>
                            <span className="alc-status pending-approval">⏳ Pending Review</span>
                          </div>
                          <div className="alc-meta">
                            <span>📍 {l.city}{l.state ? `, ${l.state}` : ""}</span>
                            <span>🛏 {l.bedrooms} bed</span>
                            <span>🚿 {l.bathrooms} bath</span>
                            <span>🏷 {l.propertyType}</span>
                          </div>
                          <div className="alc-price">₱{(parseFloat(l.price) || 0).toLocaleString()} / mo</div>
                          <p className="alc-desc">{l.description ? l.description.slice(0, 120) + (l.description.length > 120 ? "…" : "") : "No description."}</p>
                          <div className="alc-approval-actions">
                            <span className="alc-approval-label">Owner submission — review required:</span>
                            <button className="alc-btn approve" onClick={() => handleApproval(l.id, "approved")}>✓ Approve</button>
                            <button className="alc-btn reject"  onClick={() => handleApproval(l.id, "rejected")}>✕ Reject</button>
                          </div>
                          <div className="alc-actions">
                            <button className="alc-btn edit" onClick={() => openEdit(l)}>✏️ Edit</button>
                            <button className="alc-btn delete" onClick={() => setDeleteConfirm(l.id)}>🗑 Delete</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* ── LISTING FILTER TABS ── */}
                <div className="admin-listing-filter-tabs">
                  {[
                    { key: "all",      label: `All (${listings.length})` },
                    { key: "pending",  label: `Pending (${listings.filter((l) => l.approvalStatus === "pending").length})` },
                    { key: "approved", label: `Approved (${listings.filter((l) => !l.approvalStatus || l.approvalStatus === "approved").length})` },
                    { key: "rejected", label: `Rejected (${listings.filter((l) => l.approvalStatus === "rejected").length})` },
                  ].map((f) => (
                    <button
                      key={f.key}
                      className={`alc-filter-tab ${listingFilter === f.key ? "active" : ""}`}
                      onClick={() => setListingFilter(f.key)}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>

                {/* ── LISTINGS GRID ── */}
                {(() => {
                  const filtered = listings.filter((l) => {
                    if (listingFilter === "pending")  return l.approvalStatus === "pending";
                    if (listingFilter === "approved") return !l.approvalStatus || l.approvalStatus === "approved";
                    if (listingFilter === "rejected") return l.approvalStatus === "rejected";
                    return true;
                  });
                  if (filtered.length === 0) return (
                    <div className="admin-empty">
                      <div className="empty-icon">🏠</div>
                      <h3>{listingFilter === "all" ? "No listings yet" : `No ${listingFilter} listings`}</h3>
                      <p>{listingFilter === "all" ? "Click \"Add New Listing\" to create your first property." : `No listings with \"${listingFilter}\" status.`}</p>
                    </div>
                  );
                  return (
                    <div className="admin-listings-grid">
                      {[...filtered].reverse().map((l) => (
                        <div key={l.id} className="admin-listing-card">
                          {l.featuredImage && (
                            <div className="alc-image"><img src={l.featuredImage} alt={l.title} /></div>
                          )}
                          <div className="alc-header">
                            <div className="alc-title">
                              {l.title}
                              {l._localOnly && (
                                <span style={{ fontSize: "10px", background: "#fef3c7", color: "#d97706", padding: "2px 6px", borderRadius: "999px", marginLeft: "6px", fontWeight: 700 }}>
                                  Local only
                                </span>
                              )}
                            </div>
                            {l.approvalStatus === "pending" ? (
                              <span className="alc-status pending-approval">⏳ Pending Review</span>
                            ) : l.approvalStatus === "rejected" ? (
                              <span className="alc-status rejected">✕ Rejected</span>
                            ) : (
                              <span className={`alc-status ${(l.status || "available").replace(/\s+/g, "-")}`}>
                                {l.status === "available"            ? "● Available"
                                  : l.status === "fully booked"      ? "● Fully Booked"
                                  : l.status === "under maintenance" ? "● Under Maintenance"
                                  : "● Occupied"}
                              </span>
                            )}
                          </div>
                          <div className="alc-meta">
                            <span>📍 {l.city}{l.state ? `, ${l.state}` : ""}</span>
                            <span>🛏 {l.bedrooms} bed</span>
                            <span>🚿 {l.bathrooms} bath</span>
                            <span>🏷 {l.propertyType}</span>
                          </div>
                          <div className="alc-price">₱{(parseFloat(l.price) || 0).toLocaleString()} / mo</div>
                          <p className="alc-desc">{l.description ? l.description.slice(0, 100) + (l.description.length > 100 ? "…" : "") : "No description."}</p>
                          {l.approvalStatus === "pending" && (
                            <div className="alc-approval-actions">
                              <span className="alc-approval-label">Owner submission — review required:</span>
                              <button className="alc-btn approve" onClick={() => handleApproval(l.id, "approved")}>✓ Approve</button>
                              <button className="alc-btn reject"  onClick={() => handleApproval(l.id, "rejected")}>✕ Reject</button>
                            </div>
                          )}
                          <div className="alc-actions">
                            <button className="alc-btn edit" onClick={() => openEdit(l)}>✏️ Edit</button>
                            <button className="alc-btn delete" onClick={() => setDeleteConfirm(l.id)}>🗑 Delete</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>
            )}

            {/* ════════════════════════════════════
                BOOKINGS TAB
            ════════════════════════════════════ */}
            {tab === "bookings" && (
              <div className="admin-section">
                <div className="admin-section-header">
                  <h2>Booking Requests</h2>
                  <div className="admin-filter-pills">
                    {["all","pending","confirmed","completed","rejected","cancelled"].map((f) => (
                      <button key={f} className={`filter-pill ${filter === f ? "active" : ""}`} onClick={() => setFilter(f)}>
                        {f.charAt(0).toUpperCase() + f.slice(1)}
                        {f === "pending" && pendingCount > 0 ? ` (${pendingCount})` : ""}
                      </button>
                    ))}
                  </div>
                </div>
                {filteredBk.length === 0 ? (
                  <div className="admin-empty">
                    <div className="empty-icon">📭</div>
                    <h3>No {filter !== "all" ? filter : ""} bookings</h3>
                    <p>Booking requests from tenants will appear here.</p>
                  </div>
                ) : (
                  <div className="booking-cards-admin">
                    {[...filteredBk].reverse().map((b) => {
                      const s = statusStyle(b.status);
                      return (
                        <div key={b.id} className="booking-card-admin">
                          <div className="bca-left">
                            <div className="bca-property">{b.propertyTitle}</div>
                            <div className="bca-tenant">👤 {b.userName}<span className="bca-email">{b.userEmail}</span></div>
                            <div className="bca-meta">
                              <span>📅 Move-in: {b.checkIn ? new Date(b.checkIn).toLocaleDateString() : "—"}</span>
                              <span>🗓 {b.months} month{b.months !== 1 ? "s" : ""}</span>
                              <span>💰 ₱{(b.total || 0).toLocaleString()}</span>
                              <span>📌 {new Date(b.date).toLocaleDateString()}</span>
                            </div>
                          </div>
                          <div className="bca-right">
                            <span className="bca-status" style={{ background: s.bg, color: s.color, border: `1px solid ${s.border}` }}>{b.status}</span>
                            {b.status === "pending" && (
                              <div className="bca-actions">
                                <button className="bca-btn approve" onClick={() => handleBookingAction(b.id, "confirmed")}>✓ Approve</button>
                                <button className="bca-btn reject"  onClick={() => handleBookingAction(b.id, "rejected")}>✕ Reject</button>
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

            {/* ════════════════════════════════════
                MESSAGES TAB
            ════════════════════════════════════ */}
            {tab === "messages" && (
              <div className="admin-section">
                <div className="admin-section-header">
                  <h2>Messages from Tenants</h2>
                  <p className="admin-section-sub">Click Reply to respond. Tenants see replies in their Messages page.</p>
                </div>
                {messages.length === 0 ? (
                  <div className="admin-empty">
                    <div className="empty-icon">💬</div>
                    <h3>No messages yet</h3>
                    <p>Tenant inquiries sent via listings will appear here.</p>
                  </div>
                ) : (
                  <div className="message-cards-admin">
                    {[...messages].reverse().map((msg) => (
                      <div key={msg.id} className={`message-card-admin ${!msg.read ? "unread" : ""}`}>
                        <div className="mca-avatar">{(msg.fromName || "U")[0].toUpperCase()}</div>
                        <div className="mca-body">
                          <div className="mca-top">
                            <strong>{msg.fromName || "Anonymous"}</strong>
                            <span className="mca-email">{msg.fromEmail}</span>
                            {!msg.read && <span className="mca-new-badge">NEW</span>}
                            <span className="mca-time">{new Date(msg.date).toLocaleDateString()}</span>
                          </div>
                          <div className="mca-property">Re: {msg.propertyTitle}</div>
                          <div className="mca-text">{msg.text}</div>
                          {msg.reply && (
                            <div className="mca-reply-preview">
                              <span className="mca-reply-label">Your reply:</span> {msg.reply}
                            </div>
                          )}
                          <button className="mca-reply-btn" onClick={() => openReply(msg)}>
                            {msg.reply ? "✏️ Edit Reply" : "💬 Reply"}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* ════════════════════════════════════════
          ADD / EDIT LISTING MODAL
      ════════════════════════════════════════ */}
      {showForm && (
        <div className="modal-overlay" onClick={closeForm}>
          <div className="modal-content listing-form-modal" onClick={(e) => e.stopPropagation()}>

            <div className="modal-header">
              <div>
                <h2>{editId ? "Edit Listing" : "Add New Listing"}</h2>
                <p>Fill in the property details below</p>
              </div>
              <button className="close-btn" onClick={closeForm}>✕</button>
            </div>

            <div className="modal-body listing-form-body">

              {/* ── Basic Info ── */}
              <div className="lf-section">
                <h4 className="lf-section-title">Basic Information</h4>
                <div className="lf-grid-2">
                  <div className="lf-field lf-span-2">
                    <label>Property Title *</label>
                    <input name="title" value={form.title} onChange={handleFormChange} placeholder="e.g. Cozy Boarding House near UPLB" />
                  </div>

                  {/* IMAGE UPLOAD */}
                  <div className="lf-field lf-span-2">
                    <label>Property Photo</label>
                    <div className="lf-image-upload">
                      {form.featuredImage ? (
                        <div className="lf-image-preview">
                          <img src={form.featuredImage} alt="Preview" />
                          <button
                            type="button"
                            className="lf-image-remove"
                            onClick={() => setForm((prev) => ({ ...prev, featuredImage: "" }))}
                          >
                            ✕ Remove
                          </button>
                        </div>
                      ) : (
                        <label className="lf-image-dropzone">
                          <input
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            onChange={handleImageUpload}
                            style={{ display: "none" }}
                          />
                          <span className="lf-image-icon">📷</span>
                          <span className="lf-image-text">Click to upload a photo</span>
                          <span className="lf-image-hint">JPG, PNG or WEBP — max 5MB</span>
                        </label>
                      )}
                    </div>
                  </div>
                  <div className="lf-field">
                    <label>Availability Status</label>
                    <select name="status" value={form.status} onChange={handleFormChange}>
                      <option value="available">Available</option>
                      <option value="occupied">Occupied</option>
                    </select>
                  </div>
                  <div className="lf-field lf-span-2">
                    <label>Description</label>
                    <textarea name="description" value={form.description} onChange={handleFormChange} rows={3} placeholder="Describe the property, nearby landmarks, rules, etc." />
                  </div>
                </div>
              </div>

              {/* ── Location ── */}
              <div className="lf-section">
                <h4 className="lf-section-title">Location</h4>
                <div className="lf-grid-2">
                  <div className="lf-field lf-span-2">
                    <label>Street Address</label>
                    <input name="location" value={form.location} onChange={handleFormChange} placeholder="123 Rizal Street" />
                  </div>
                  <div className="lf-field">
                    <label>City / Municipality *</label>
                    <input name="city" value={form.city} onChange={handleFormChange} placeholder="Baguio City" />
                  </div>
                  <div className="lf-field">
                    <label>Province / State</label>
                    <input name="state" value={form.state} onChange={handleFormChange} placeholder="Benguet" />
                  </div>
                </div>
              </div>

              {/* ── Pricing & Specs ── */}
              <div className="lf-section">
                <h4 className="lf-section-title">Pricing & Specifications</h4>
                <div className="lf-grid-3">
                  <div className="lf-field">
                    <label>Monthly Rent (₱) *</label>
                    <input name="price" type="number" min="0" value={form.price} onChange={handleFormChange} placeholder="3500" />
                  </div>
                  <div className="lf-field">
                    <label>Bedrooms</label>
                    <input name="bedrooms" type="number" min="1" max="20" value={form.bedrooms} onChange={handleFormChange} />
                  </div>
                  <div className="lf-field">
                    <label>Bathrooms</label>
                    <input name="bathrooms" type="number" min="1" max="20" value={form.bathrooms} onChange={handleFormChange} />
                  </div>
                  <div className="lf-field">
                    <label>Area (sqft)</label>
                    <input name="areaSqft" type="number" min="0" value={form.areaSqft} onChange={handleFormChange} placeholder="400" />
                  </div>
                  <div className="lf-field">
                    <label>Year Built</label>
                    <input name="yearBuilt" type="number" min="1900" max="2030" value={form.yearBuilt} onChange={handleFormChange} placeholder="2018" />
                  </div>
                </div>
              </div>

              {/* ── Amenities ── */}
              <div className="lf-section">
                <h4 className="lf-section-title">Amenities & Features</h4>
                <div className="lf-checkbox-grid">
                  {[
                    { name: "hasParking", label: "🅿️ Parking" },
                    { name: "hasGym",     label: "🏋️ Gym" },
                    { name: "hasPool",    label: "🏊 Pool" },
                    { name: "hasGarden",  label: "🌿 Garden" },
                    { name: "hasBalcony", label: "🏡 Balcony" },
                    { name: "hasWifi",    label: "📶 WiFi" },
                    { name: "hasMeals",   label: "🍽️ Meals" },
                    { name: "petFriendly",label: "🐾 Pet-Friendly" },
                  ].map(({ name, label }) => (
                    <label key={name} className="lf-checkbox">
                      <input type="checkbox" name={name} checked={!!form[name]} onChange={handleFormChange} />
                      <span>{label}</span>
                    </label>
                  ))}
                </div>
              </div>

            </div>{/* end modal-body */}

            <div className="modal-footer">
              <button className="btn-cancel" onClick={closeForm} disabled={saving}>Cancel</button>
              <button className="btn-send" onClick={handleSaveListing} disabled={saving}>
                {saving ? "Saving…" : editId ? "Save Changes" : "Add Listing"}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ════════════════════════════════════════
          REPLY MODAL
      ════════════════════════════════════════ */}
      {replyModal && (
        <div className="modal-overlay" onClick={() => setReplyModal(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h2>Reply to {replyModal.fromName}</h2>
                <p>Re: {replyModal.propertyTitle}</p>
              </div>
              <button className="close-btn" onClick={() => setReplyModal(null)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="reply-original-msg">
                <strong>Original message</strong>
                <p>{replyModal.text}</p>
              </div>
              <label className="modal-label">Your Reply</label>
              <textarea value={replyText} onChange={(e) => setReplyText(e.target.value)} rows={5} placeholder="Type your reply…" disabled={replying} />
            </div>
            <div className="modal-footer">
              <button className="btn-cancel" onClick={() => setReplyModal(null)}>Cancel</button>
              <button className="btn-send" onClick={handleSendReply} disabled={replying || !replyText.trim()}>
                {replying ? "Sending…" : "Send Reply"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════
          DELETE CONFIRM MODAL
      ════════════════════════════════════════ */}
      {deleteConfirm !== null && (
        <div className="modal-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="modal-content delete-confirm-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h2>Delete Listing?</h2>
                <p>This action cannot be undone.</p>
              </div>
              <button className="close-btn" onClick={() => setDeleteConfirm(null)}>✕</button>
            </div>
            <div className="modal-body">
              <p style={{ fontSize: "15px", color: "var(--color-text-secondary)", lineHeight: 1.6 }}>
                Are you sure you want to permanently delete this listing? Tenants will no longer be able to view or book it.
              </p>
            </div>
            <div className="modal-footer">
              <button className="btn-cancel" onClick={() => setDeleteConfirm(null)}>Cancel</button>
              <button className="btn-delete-confirm" onClick={() => handleDelete(deleteConfirm)}>
                🗑 Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminDashboard;
