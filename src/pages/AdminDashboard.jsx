import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
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

  const [loading, setLoading]       = useState(true);
  const [syncing, setSyncing]       = useState(false);
  const [syncResult, setSyncResult] = useState("");

  // ── Users state ──
  const [users, setUsers]                   = useState([]);
  const [userDeleteConfirm, setUserDeleteConfirm] = useState(null);
  const [editRoleUser, setEditRoleUser]     = useState(null);
  const [roleUpdating, setRoleUpdating]     = useState(false);

  // ── Owner requests state ──
  const [ownerRequests, setOwnerRequests]   = useState([]);
  const [permitModal, setPermitModal]       = useState(null); // user object whose permit is being viewed

  useEffect(() => {
    if (localStorage.getItem("userRole") !== "ADMIN") { navigate("/login"); return; }
    loadAll();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await fetch("http://localhost:8000/api/admin/users");
      return res.ok ? await res.json() : [];
    } catch { return []; }
  };

  const fetchOwnerRequests = async () => {
    try {
      const res = await fetch("http://localhost:8000/api/admin/owner-requests");
      return res.ok ? await res.json() : [];
    } catch { return []; }
  };

  const loadAll = async () => {
    setLoading(true);
    const [backendListings, b, u, or] = await Promise.all([
      getAdminListings(),
      getBookings(),
      fetchUsers(),
      fetchOwnerRequests(),
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
    setUsers(u);
    setOwnerRequests(or);
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

  // ── Force expiry sync ────────────────────────
  const handleSyncStatus = async () => {
    setSyncing(true);
    setSyncResult("");
    try {
      const res = await fetch("http://localhost:8000/api/admin/sync-status", { method: "POST" });
      const data = await res.json();
      setSyncResult(data.message || "Done.");
      await loadAll(); // refresh listings to reflect any reverted statuses
    } catch {
      setSyncResult("Could not reach backend.");
    } finally {
      setSyncing(false);
      setTimeout(() => setSyncResult(""), 5000);
    }
  };

  // ── Listing approval action ──────────────────
  const handleApproval = async (id, approvalStatus) => {
    await setListingApproval(id, approvalStatus);
    loadAll();
  };

  // ── User actions ─────────────────────────────
  const handleUpdateRole = async (userId, newRole) => {
    setRoleUpdating(true);
    try {
      await fetch(`http://localhost:8000/api/admin/users/${userId}/role`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });
      setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, role: newRole } : u));
    } finally {
      setEditRoleUser(null);
      setRoleUpdating(false);
    }
  };

  const handleDeleteUser = async (userId) => {
    await fetch(`http://localhost:8000/api/admin/users/${userId}`, { method: "DELETE" });
    setUserDeleteConfirm(null);
    setUsers((prev) => prev.filter((u) => u.id !== userId));
  };

  const handleOwnerRequest = async (userId, accountStatus) => {
    await fetch(`http://localhost:8000/api/admin/users/${userId}/account-status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ accountStatus }),
    });
    setOwnerRequests((prev) => prev.filter((u) => u.id !== userId));
    // Refresh full user list so the Users tab stays in sync
    fetchUsers().then(setUsers);
  };

  // ── Derived counts ───────────────────────────
  const pendingApprovalCount = listings.filter((l) => l.approvalStatus === "pending").length;
  const pendingCount  = bookings.filter((b) => b.status === "pending").length;
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
            <button
              className="admin-refresh-btn"
              onClick={handleSyncStatus}
              disabled={syncing}
              title="Force-check all confirmed bookings and revert expired ones to available"
            >
              {syncing ? "Syncing…" : "🔄 Sync Status"}
            </button>
            {syncResult && (
              <span style={{ fontSize: "12px", color: "#fff", opacity: 0.85 }}>{syncResult}</span>
            )}
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
          <button className={`admin-tab ${tab === "users" ? "active" : ""}`} onClick={() => setTab("users")}>
            👥 Users <span className="tab-count">{users.length}</span>
          </button>
          <button className={`admin-tab ${tab === "requests" ? "active" : ""}`} onClick={() => setTab("requests")}>
            📋 Owner Requests
            {ownerRequests.length > 0 && <span className="tab-badge">{ownerRequests.length}</span>}
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
                          {l.approvalStatus === "pending" ? (
                            <div className="alc-approval-actions">
                              <span className="alc-approval-label">Owner submission — review required:</span>
                              <button className="alc-btn approve" onClick={() => handleApproval(l.id, "approved")}>✓ Approve</button>
                              <button className="alc-btn reject"  onClick={() => handleApproval(l.id, "rejected")}>✕ Reject</button>
                            </div>
                          ) : (
                            <div className="alc-actions">
                              <button className="alc-btn edit" onClick={() => openEdit(l)}>✏️ Edit</button>
                              <button className="alc-btn delete" onClick={() => setDeleteConfirm(l.id)}>🗑 Delete</button>
                            </div>
                          )}
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
                USERS TAB
            ════════════════════════════════════ */}
            {tab === "users" && (
              <div className="admin-section">
                <div className="admin-section-header">
                  <h2>User Accounts</h2>
                  <p className="admin-section-sub">{users.length} registered account{users.length !== 1 ? "s" : ""}</p>
                </div>

                {users.length === 0 ? (
                  <div className="admin-empty">
                    <div className="empty-icon">👥</div>
                    <h3>No users found</h3>
                    <p>Registered accounts will appear here.</p>
                  </div>
                ) : (
                  <div className="users-table-wrap">
                    <table className="users-table">
                      <thead>
                        <tr>
                          <th>#</th>
                          <th>Name</th>
                          <th>Email</th>
                          <th>Role</th>
                          <th>Joined</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {users.map((u) => {
                          const roleBg = u.role === "ADMIN"  ? { bg: "#fef2f2", color: "#dc2626", border: "#fecaca" }
                                       : u.role === "OWNER"  ? { bg: "#eff6ff", color: "#2563eb", border: "#bfdbfe" }
                                       : { bg: "#f0fdf4", color: "#16a34a", border: "#bbf7d0" };
                          const isEditing = editRoleUser?.id === u.id;
                          return (
                            <tr key={u.id}>
                              <td className="ut-id">#{u.id}</td>
                              <td className="ut-name">
                                <span className="ut-avatar">{(u.fullName || "U")[0].toUpperCase()}</span>
                                {u.fullName || "—"}
                              </td>
                              <td className="ut-email">{u.email}</td>
                              <td className="ut-role">
                                {isEditing ? (
                                  <div className="ut-role-edit">
                                    <select
                                      defaultValue={u.role}
                                      onChange={(e) => setEditRoleUser({ id: u.id, role: e.target.value })}
                                      disabled={roleUpdating}
                                    >
                                      <option value="TENANT">TENANT</option>
                                      <option value="OWNER">OWNER</option>
                                      <option value="ADMIN">ADMIN</option>
                                    </select>
                                    <button
                                      className="ut-btn save"
                                      onClick={() => handleUpdateRole(u.id, editRoleUser.role || u.role)}
                                      disabled={roleUpdating}
                                    >
                                      {roleUpdating ? "…" : "Save"}
                                    </button>
                                    <button className="ut-btn cancel" onClick={() => setEditRoleUser(null)} disabled={roleUpdating}>✕</button>
                                  </div>
                                ) : (
                                  <span
                                    className="ut-role-pill"
                                    style={{ background: roleBg.bg, color: roleBg.color, border: `1px solid ${roleBg.border}` }}
                                  >
                                    {u.role}
                                  </span>
                                )}
                              </td>
                              <td className="ut-joined">
                                {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : "—"}
                              </td>
                              <td className="ut-actions">
                                {!isEditing && (
                                  <button
                                    className="ut-btn edit"
                                    onClick={() => setEditRoleUser({ id: u.id, role: u.role })}
                                  >
                                    ✏️ Edit Role
                                  </button>
                                )}
                                <button
                                  className="ut-btn delete"
                                  onClick={() => setUserDeleteConfirm(u)}
                                >
                                  🗑 Delete
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
            {/* ════════════════════════════════════
                OWNER REQUESTS TAB
            ════════════════════════════════════ */}
            {tab === "requests" && (
              <div className="admin-section">
                <div className="admin-section-header">
                  <h2>Owner Account Requests</h2>
                  <p className="admin-section-sub">
                    {ownerRequests.length === 0
                      ? "No pending applications."
                      : `${ownerRequests.length} application${ownerRequests.length !== 1 ? "s" : ""} waiting for review`}
                  </p>
                </div>

                {ownerRequests.length === 0 ? (
                  <div className="admin-empty">
                    <div className="empty-icon">✅</div>
                    <h3>All caught up!</h3>
                    <p>No pending owner account applications.</p>
                  </div>
                ) : (
                  <div className="owner-requests-grid">
                    {ownerRequests.map((req) => (
                      <div key={req.id} className="owner-request-card">
                        <div className="orc-header">
                          <div className="orc-avatar">{(req.fullName || "O")[0].toUpperCase()}</div>
                          <div className="orc-info">
                            <div className="orc-name">{req.fullName}</div>
                            <div className="orc-email">{req.email}</div>
                            <div className="orc-date">
                              Applied: {req.createdAt ? new Date(req.createdAt).toLocaleDateString() : "—"}
                            </div>
                          </div>
                          <span className="orc-status-pill">⏳ Pending</span>
                        </div>

                        <div className="orc-permit-section">
                          <p className="orc-permit-label">Business Permit</p>
                          {req.businessPermitImage ? (
                            <div className="orc-permit-thumb-wrap">
                              <img
                                src={req.businessPermitImage}
                                alt="Business permit"
                                className="orc-permit-thumb"
                                onClick={() => setPermitModal(req)}
                              />
                              <button className="orc-view-btn" onClick={() => setPermitModal(req)}>
                                🔍 View Full Image
                              </button>
                            </div>
                          ) : (
                            <p className="orc-no-permit">No permit image uploaded.</p>
                          )}
                        </div>

                        <div className="orc-actions">
                          <button
                            className="orc-btn approve"
                            onClick={() => handleOwnerRequest(req.id, "active")}
                          >
                            ✓ Approve
                          </button>
                          <button
                            className="orc-btn reject"
                            onClick={() => handleOwnerRequest(req.id, "rejected")}
                          >
                            ✕ Reject
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
      {/* ════════════════════════════════════════
          PERMIT FULL-IMAGE MODAL
      ════════════════════════════════════════ */}
      {permitModal && (
        <div className="modal-overlay" onClick={() => setPermitModal(null)}>
          <div className="modal-content permit-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h2>Business Permit</h2>
                <p>{permitModal.fullName} — {permitModal.email}</p>
              </div>
              <button className="close-btn" onClick={() => setPermitModal(null)}>✕</button>
            </div>
            <div className="modal-body" style={{ textAlign: "center", padding: "16px" }}>
              <img
                src={permitModal.businessPermitImage}
                alt="Business permit"
                style={{ maxWidth: "100%", maxHeight: "60vh", objectFit: "contain", borderRadius: "8px" }}
              />
            </div>
            <div className="modal-footer">
              <button className="btn-cancel" onClick={() => setPermitModal(null)}>Close</button>
              <button className="bca-btn approve" onClick={() => { handleOwnerRequest(permitModal.id, "active"); setPermitModal(null); }}>✓ Approve</button>
              <button className="bca-btn reject"  onClick={() => { handleOwnerRequest(permitModal.id, "rejected"); setPermitModal(null); }}>✕ Reject</button>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════
          DELETE USER CONFIRM MODAL
      ════════════════════════════════════════ */}
      {userDeleteConfirm !== null && (
        <div className="modal-overlay" onClick={() => setUserDeleteConfirm(null)}>
          <div className="modal-content delete-confirm-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h2>Delete Account?</h2>
                <p>This action cannot be undone.</p>
              </div>
              <button className="close-btn" onClick={() => setUserDeleteConfirm(null)}>✕</button>
            </div>
            <div className="modal-body">
              <p style={{ fontSize: "15px", color: "var(--color-text-secondary)", lineHeight: 1.6 }}>
                Are you sure you want to permanently delete the account for{" "}
                <strong>{userDeleteConfirm.fullName}</strong> ({userDeleteConfirm.email})?
                All their data including bookings and messages may be affected.
              </p>
            </div>
            <div className="modal-footer">
              <button className="btn-cancel" onClick={() => setUserDeleteConfirm(null)}>Cancel</button>
              <button className="btn-delete-confirm" onClick={() => handleDeleteUser(userDeleteConfirm.id)}>
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
