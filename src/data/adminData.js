// ============================================================
// adminData.js  — Admin-facing data layer
//
// All functions try the real Spring Boot API first (port 8000).
// Falls back to localStorage when backend is offline.
// ============================================================

const API = "http://localhost:8000/api";

// ── internal helpers ─────────────────────────
const tryFetch = async (url, opts = {}) => {
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...opts,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `HTTP ${res.status}`);
  }
  return res.json();
};

const lsGet = (key) => JSON.parse(localStorage.getItem(key) || "[]");
const lsSet = (key, val) => localStorage.setItem(key, JSON.stringify(val));

// ============================================================
// MESSAGES / INQUIRIES
// Backend shape: { id, property{id,title,...}, inquirer{id,...},
//   subject, message, email, phone, status, adminReply, replyDate,
//   isRead, createdAt }
// Local cache shape (flattened):
//   { id, from, fromName, fromEmail, propertyId, propertyTitle,
//     text, date, read, reply, replyDate }
// ============================================================

// Normalize a backend Inquiry to the frontend shape
const normInquiry = (inq) => ({
  id:            inq.id,
  from:          String(inq.inquirer?.id || inq.from || ""),
  fromName:      inq.inquirer?.fullName  || inq.fromName  || "Anonymous",
  fromEmail:     inq.email || inq.fromEmail || inq.inquirer?.email || "",
  propertyId:    inq.property?.id   || inq.propertyId,
  propertyTitle: inq.property?.title || inq.propertyTitle || `Property #${inq.property?.id || inq.propertyId}`,
  text:          inq.message  || inq.text,
  date:          inq.createdAt || inq.date || new Date().toISOString(),
  read:          inq.isRead   ?? inq.read ?? false,
  reply:         inq.adminReply || inq.reply || null,
  replyDate:     inq.replyDate  || null,
});

export async function getMessages() {
  try {
    const data = await tryFetch(`${API}/inquiries`);
    const normalized = data.map(normInquiry);
    lsSet("vs_messages", normalized);
    return normalized;
  } catch {
    return lsGet("vs_messages");
  }
}

// Fetch inquiries sent by a specific user — used by ChatBox
export async function getUserMessages(userId) {
  try {
    const data = await tryFetch(`${API}/inquiries/user/${userId}`);
    const normalized = Array.isArray(data) ? data.map(normInquiry) : [];
    // Merge into the shared cache so getMessagesSync() stays fresh
    const existing = lsGet("vs_messages").filter((m) => String(m.from) !== String(userId));
    lsSet("vs_messages", [...existing, ...normalized]);
    return normalized;
  } catch {
    return lsGet("vs_messages").filter((m) => String(m.from) === String(userId));
  }
}

export function getMessagesSync() {
  return lsGet("vs_messages");
}

export async function addMessage(msg) {
  // msg: { from, fromName, fromEmail, propertyId, propertyTitle, text }
  const userEmail = msg.fromEmail || localStorage.getItem("userEmail") || "noemail@vacansee.com";

  try {
    const body = {
      property:  { id: Number(msg.propertyId) },
      inquirer:  { id: Number(msg.from) },
      subject:   `Inquiry about ${msg.propertyTitle}`,
      message:   msg.text,
      email:     userEmail,   // required field in backend Inquiry model
      phone:     "",
    };

    console.log("Sending inquiry to backend:", body);
    const saved = await tryFetch(`${API}/inquiries`, {
      method: "POST",
      body: JSON.stringify(body),
    });
    console.log("Inquiry saved to DB:", saved);
    const norm = normInquiry(saved);
    const cache = lsGet("vs_messages");
    lsSet("vs_messages", [...cache, norm]);
    return norm;
  } catch (err) {
    console.error("Inquiry POST failed:", err.message);
    // Fallback: save locally so the user's message list still shows it
    const norm = {
      id:            Date.now(),
      from:          String(msg.from),
      fromName:      msg.fromName,
      fromEmail:     userEmail,
      propertyId:    msg.propertyId,
      propertyTitle: msg.propertyTitle,
      text:          msg.text,
      date:          new Date().toISOString(),
      read:          false,
      reply:         null,
      replyDate:     null,
    };
    const cache = lsGet("vs_messages");
    lsSet("vs_messages", [...cache, norm]);
    return norm;
  }
}

export async function replyToMessage(id, replyText) {
  try {
    await tryFetch(`${API}/inquiries/${id}/reply`, {
      method: "PATCH",
      body: JSON.stringify({ reply: replyText }),
    });
  } catch {}
  // Always update cache
  const msgs = lsGet("vs_messages");
  lsSet("vs_messages", msgs.map((m) =>
    m.id === id
      ? { ...m, reply: replyText, replyDate: new Date().toISOString(), read: true }
      : m
  ));
}

export async function markMessageRead(id) {
  try {
    await tryFetch(`${API}/inquiries/${id}/read`, { method: "PATCH" });
  } catch {}
  const msgs = lsGet("vs_messages");
  lsSet("vs_messages", msgs.map((m) => (m.id === id ? { ...m, read: true } : m)));
}

export function getUnreadCount() {
  return lsGet("vs_messages").filter((m) => !m.read).length;
}

// ============================================================
// BOOKINGS
// Backend shape: { id, property{id,title,...}, user{id,...},
//   checkInDate, checkOutDate, numberOfGuests, totalPrice,
//   status, notes, createdAt }
// Local cache shape (flattened):
//   { id, userId, userName, userEmail, propertyId, propertyTitle,
//     price, checkIn, months, total, status, date }
// ============================================================

// Backend now returns BookingDTO with flat fields (userId, userName, propertyTitle, etc.)
// Also handle localStorage shape (same flat fields) as a fallback
const normBooking = (b) => ({
  id:            b.id,
  userId:        String(b.userId   || b.user?.id    || ""),
  userName:      b.userName        || b.user?.fullName || "User",
  userEmail:     b.userEmail       || b.user?.email   || "",
  propertyId:    b.propertyId      || b.property?.id,
  propertyTitle: b.propertyTitle   || b.property?.title || `Property #${b.propertyId || b.property?.id}`,
  price:         Number(b.propertyPrice || b.property?.price || b.price || 0),
  checkIn:       b.checkInDate     || b.checkIn,
  months:        calcMonths(b.checkInDate || b.checkIn, b.checkOutDate),
  total:         Number(b.totalPrice || b.total || 0),
  status:        b.status,
  date:          b.createdAt       || b.date || new Date().toISOString(),
  notes:         b.notes           || "",
});

function calcMonths(checkIn, checkOut) {
  if (!checkIn || !checkOut) return 1;
  const a = new Date(checkIn), b = new Date(checkOut);
  return Math.max(1, Math.round((b - a) / (1000 * 60 * 60 * 24 * 30)));
}

export async function getBookings() {
  try {
    const data = await tryFetch(`${API}/bookings`);
    // data is now BookingDTO[] with flat fields
    const normalized = Array.isArray(data) ? data.map(normBooking) : [];
    lsSet("vs_bookings", normalized);
    return normalized;
  } catch (err) {
    console.warn("Could not fetch bookings from backend:", err.message);
    return lsGet("vs_bookings");
  }
}

export async function getBookingsByUser(userId) {
  try {
    const data = await tryFetch(`${API}/bookings/user/${userId}`);
    const normalized = Array.isArray(data) ? data.map(normBooking) : [];
    return normalized;
  } catch {
    return lsGet("vs_bookings").filter((b) => String(b.userId) === String(userId));
  }
}

export async function addBooking(booking) {
  const propertyId = Number(booking.propertyId);
  const userId     = Number(booking.userId);

  if (!propertyId || isNaN(propertyId)) {
    throw new Error("Invalid property ID: " + booking.propertyId);
  }
  if (!userId || isNaN(userId)) {
    throw new Error("Invalid user ID — please log out and log in again.");
  }

  const checkInDate = booking.checkIn;
  const d = new Date(checkInDate);
  d.setDate(d.getDate() + (booking.months || 1) * 30);
  const checkOutDate = d.toISOString().split("T")[0];

  const body = {
    property:       { id: propertyId },
    user:           { id: userId },
    checkInDate,
    checkOutDate,
    numberOfGuests: 1,
    totalPrice:     Number(booking.total) || 0,
    status:         "pending",
    notes:          `Booking for ${booking.months} month(s)`,
  };

  console.log("Sending booking to backend:", body);

  let saved = null;
  let fromBackend = false;

  try {
    saved = await tryFetch(`${API}/bookings`, {
      method: "POST",
      body: JSON.stringify(body),
    });
    fromBackend = true;
    console.log("Booking saved to DB:", saved);
  } catch (err) {
    console.error("Booking POST failed:", err.message);
    // Re-throw explicit server rejections (4xx) so the UI shows the real error
    // (e.g. 409 booking conflict, 404 property not found).
    // For network failures ("Failed to fetch") and 5xx server errors, fall back to localStorage.
    if (err.message && /^HTTP 4/.test(err.message)) throw err;
    // HTTP 5xx / network down — save locally as fallback
  }

  const norm = fromBackend ? normBooking(saved) : {
    id:            Date.now(),
    userId:        String(userId),
    userName:      booking.userName || "User",
    userEmail:     booking.userEmail || "",
    propertyId:    propertyId,
    propertyTitle: booking.propertyTitle,
    price:         Number(booking.price) || 0,
    checkIn:       checkInDate,
    months:        booking.months || 1,
    total:         Number(booking.total) || 0,
    status:        "pending",
    date:          new Date().toISOString(),
    notes:         body.notes,
  };

  const cache = lsGet("vs_bookings");
  lsSet("vs_bookings", [...cache, norm]);
  return norm;
}

export async function updateBookingStatus(id, status) {
  try {
    await tryFetch(`${API}/bookings/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
  } catch {}
  const bookings = lsGet("vs_bookings");
  lsSet("vs_bookings", bookings.map((b) => (b.id === id ? { ...b, status } : b)));
}

export async function cancelBooking(id) {
  try {
    await tryFetch(`${API}/bookings/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status: "cancelled" }),
    });
  } catch {}
  const bookings = lsGet("vs_bookings");
  lsSet("vs_bookings", bookings.map((b) => (b.id === id ? { ...b, status: "cancelled" } : b)));
}

// ============================================================
// ADMIN-MANAGED LISTINGS
// Backend: POST /api/properties  — requires ownerId (=admin's DB id)
// ============================================================

export async function getAdminListings() {
  try {
    const res = await fetch(`${API}/properties?page=0&size=1000`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const list = Array.isArray(data) ? data : (data.content || []);
    const normalized = list.map((p) => ({
      ...p,
      price:          Number(p.price) || 0,
      approvalStatus: p.approvalStatus || "approved",
    }));
    lsSet("vs_admin_listings", normalized);
    return normalized;
  } catch (err) {
    console.warn("getAdminListings backend error:", err.message);
    // Merge vs_admin_listings with vs_properties so owner-submitted listings
    // (which are written to vs_properties by addOwnerListing) are never missed
    const adminCache = lsGet("vs_admin_listings");
    const propsCache = lsGet("vs_properties");
    const adminIds = new Set(adminCache.map((l) => Number(l.id)));
    const extra = propsCache.filter((l) => l.id && !adminIds.has(Number(l.id)));
    return [...adminCache, ...extra];
  }
}

export async function addListing(listing) {
  // Get the admin's real DB userId (stored when they logged in via backend)
  const rawId = localStorage.getItem("userId");
  const ownerId = Number(rawId);

  if (!ownerId || isNaN(ownerId)) {
    throw new Error(
      "Cannot add listing: your session userId is invalid (" + rawId + "). " +
      "Please log out and log in again so your real database ID is stored."
    );
  }

  const payload = {
    title:        listing.title,
    description:  listing.description || "",
    price:        parseFloat(listing.price) || 0,
    propertyType: "Boarding House",
    status:       listing.status || "available",
    location:     listing.location || "",
    city:         listing.city || "",
    state:        listing.state || "",
    country:      "Philippines",
    bedrooms:     parseInt(listing.bedrooms)  || 1,
    bathrooms:    parseInt(listing.bathrooms) || 1,
    areaSqft:     listing.areaSqft  ? parseFloat(listing.areaSqft)  : null,
    yearBuilt:    listing.yearBuilt ? parseInt(listing.yearBuilt)   : null,
    hasParking:   !!listing.hasParking,
    hasGym:       !!listing.hasGym,
    hasPool:      !!listing.hasPool,
    hasGarden:    !!listing.hasGarden,
    hasBalcony:   !!listing.hasBalcony,
    hasWifi:      !!listing.hasWifi,
    hasMeals:     !!listing.hasMeals,
    petFriendly:  !!listing.petFriendly,
    featuredImage: listing.featuredImage || null,
    ownerId,
  };

  console.log("addListing → ownerId:", ownerId, "payload:", payload);

  try {
    const res = await fetch(`${API}/properties`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(payload),
    });

    const data = await res.json();
    console.log("addListing response:", res.status, data);

    if (!res.ok) {
      throw new Error(data.message || `Server error ${res.status}`);
    }

    const normalized = { ...data, price: Number(data.price) || 0 };

    // Update admin's own listing cache
    const cache = JSON.parse(localStorage.getItem("vs_admin_listings") || "[]");
    localStorage.setItem("vs_admin_listings", JSON.stringify([...cache, normalized]));

    // CRITICAL: Also refresh the main vs_properties cache that getAllListings() reads.
    // Without this, Browse/Search/Home won't show the new listing until page refresh.
    const propsCache = JSON.parse(localStorage.getItem("vs_properties") || "[]");
    localStorage.setItem("vs_properties", JSON.stringify([...propsCache, normalized]));

    return normalized;

  } catch (err) {
    console.error("addListing failed:", err.message);
    // Save locally so it shows in the list — mark as not yet in DB
    const temp = { ...payload, id: Date.now(), createdAt: new Date().toISOString(), _localOnly: true };
    const cache = JSON.parse(localStorage.getItem("vs_admin_listings") || "[]");
    localStorage.setItem("vs_admin_listings", JSON.stringify([...cache, temp]));
    throw err;  // re-throw so AdminDashboard shows the real error
  }
}

export async function updateListing(id, listing) {
  try {
    await tryFetch(`${API}/properties/${id}`, {
      method: "PUT",
      body: JSON.stringify({ ...listing, price: parseFloat(listing.price) || 0 }),
    });
  } catch (err) { console.warn("updateListing:", err.message); }

  // Update BOTH caches so Browse/Search/Home reflect the change immediately
  const updateBoth = (key) => {
    const c = JSON.parse(localStorage.getItem(key) || "[]");
    localStorage.setItem(key, JSON.stringify(
      c.map((l) => Number(l.id) === Number(id) ? { ...l, ...listing, price: Number(listing.price)||0 } : l)
    ));
  };
  updateBoth("vs_admin_listings");
  updateBoth("vs_properties");

  // Re-sync from backend
  try {
    const res  = await fetch(`${API}/properties?page=0&size=500`);
    if (res.ok) {
      const data = await res.json();
      const list = (Array.isArray(data) ? data : (data.content || [])).map(p => ({...p, price: Number(p.price)||0}));
      localStorage.setItem("vs_properties", JSON.stringify(list));
    }
  } catch {}
}

export async function deleteListing(id) {
  try {
    await tryFetch(`${API}/properties/${id}`, { method: "DELETE" });
  } catch (err) { console.warn("deleteListing:", err.message); }

  // Remove from BOTH caches
  const removeFrom = (key) => {
    const c = JSON.parse(localStorage.getItem(key) || "[]");
    localStorage.setItem(key, JSON.stringify(c.filter((l) => Number(l.id) !== Number(id))));
  };
  removeFrom("vs_admin_listings");
  removeFrom("vs_properties");

  // Re-sync from backend
  try {
    const res  = await fetch(`${API}/properties?page=0&size=500`);
    if (res.ok) {
      const data = await res.json();
      const list = (Array.isArray(data) ? data : (data.content || [])).map(p => ({...p, price: Number(p.price)||0}));
      localStorage.setItem("vs_properties", JSON.stringify(list));
    }
  } catch {}
}

// ============================================================
// OWNER-SCOPED DATA FUNCTIONS
// These wrap the owner-specific backend endpoints so owners
// only see their own listings, bookings, and inquiries.
// ============================================================

export async function getOwnerListings(ownerId) {
  try {
    const data = await tryFetch(`${API}/properties/owner/${ownerId}`);
    const list = Array.isArray(data) ? data : (data.content || []);
    const normalized = list.map((p) => ({ ...p, price: Number(p.price) || 0 }));
    lsSet("vs_owner_listings", normalized);
    return normalized;
  } catch (err) {
    console.warn("getOwnerListings error:", err.message);
    return lsGet("vs_owner_listings").filter((l) => String(l.ownerId) === String(ownerId));
  }
}

export async function getOwnerBookings(ownerId) {
  try {
    const data = await tryFetch(`${API}/bookings/owner/${ownerId}`);
    const normalized = Array.isArray(data) ? data.map(normBooking) : [];
    lsSet("vs_owner_bookings", normalized);
    return normalized;
  } catch (err) {
    console.warn("getOwnerBookings error:", err.message);
    return lsGet("vs_owner_bookings");
  }
}

export async function getOwnerInquiries(ownerId) {
  try {
    const data = await tryFetch(`${API}/inquiries/owner/${ownerId}`);
    const normalized = Array.isArray(data) ? data.map(normInquiry) : [];
    lsSet("vs_owner_inquiries", normalized);
    return normalized;
  } catch (err) {
    console.warn("getOwnerInquiries error:", err.message);
    return lsGet("vs_owner_inquiries");
  }
}

// Owner adds a listing — same as admin but scoped to their own userId
export async function addOwnerListing(listing, ownerId) {
  const payload = {
    title:          listing.title,
    description:    listing.description || "",
    price:          parseFloat(listing.price) || 0,
    propertyType:   listing.propertyType || "Boarding House",
    status:         listing.status || "available",
    approvalStatus: "pending",  // must be approved by admin before going public
    location:     listing.location || "",
    city:         listing.city || "",
    state:        listing.state || "",
    country:      "Philippines",
    bedrooms:     parseInt(listing.bedrooms)  || 1,
    bathrooms:    parseInt(listing.bathrooms) || 1,
    areaSqft:     listing.areaSqft  ? parseFloat(listing.areaSqft)  : null,
    yearBuilt:    listing.yearBuilt ? parseInt(listing.yearBuilt)   : null,
    hasParking:   !!listing.hasParking,
    hasGym:       !!listing.hasGym,
    hasPool:      !!listing.hasPool,
    hasGarden:    !!listing.hasGarden,
    hasBalcony:   !!listing.hasBalcony,
    hasWifi:      !!listing.hasWifi,
    hasMeals:     !!listing.hasMeals,
    petFriendly:  !!listing.petFriendly,
    featuredImage: listing.featuredImage || null,
    ownerId,
  };

  const res = await fetch(`${API}/properties`, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || `Server error ${res.status}`);
  const normalized = { ...data, price: Number(data.price) || 0 };

  // Keep all three caches in sync so admin can see new listings immediately
  const ownerCache = lsGet("vs_owner_listings");
  lsSet("vs_owner_listings", [...ownerCache, normalized]);
  const propsCache = lsGet("vs_properties");
  lsSet("vs_properties", [...propsCache, normalized]);
  const adminCache = lsGet("vs_admin_listings");
  lsSet("vs_admin_listings", [...adminCache, normalized]);
  return normalized;
}

// Owner updates their own listing — passes requesterId for ownership validation
export async function updateOwnerListing(id, listing, ownerId) {
  await tryFetch(`${API}/properties/${id}?requesterId=${ownerId}`, {
    method: "PUT",
    body: JSON.stringify({
      ...listing,
      price:     parseFloat(listing.price)    || 0,
      bedrooms:  parseInt(listing.bedrooms)   || 1,
      bathrooms: parseInt(listing.bathrooms)  || 1,
      areaSqft:  listing.areaSqft  ? parseFloat(listing.areaSqft)  : null,
      yearBuilt: listing.yearBuilt ? parseInt(listing.yearBuilt)   : null,
    }),
  });

  const updateCache = (key) => {
    const c = lsGet(key);
    lsSet(key, c.map((l) =>
      Number(l.id) === Number(id) ? { ...l, ...listing, price: Number(listing.price) || 0 } : l
    ));
  };
  updateCache("vs_owner_listings");
  updateCache("vs_properties");
}

// Owner deletes their own listing — passes requesterId for ownership validation
export async function deleteOwnerListing(id, ownerId) {
  await tryFetch(`${API}/properties/${id}?requesterId=${ownerId}`, { method: "DELETE" });

  const removeFrom = (key) => {
    const c = lsGet(key);
    lsSet(key, c.filter((l) => Number(l.id) !== Number(id)));
  };
  removeFrom("vs_owner_listings");
  removeFrom("vs_properties");
}

// Owner approves/rejects a booking for their own property
export async function updateOwnerBookingStatus(bookingId, status, ownerId) {
  await tryFetch(`${API}/bookings/${bookingId}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status, requesterId: ownerId }),
  });
  const bookings = lsGet("vs_owner_bookings");
  lsSet("vs_owner_bookings", bookings.map((b) => (b.id === bookingId ? { ...b, status } : b)));
}

// Owner replies to an inquiry about their property
export async function replyToOwnerMessage(inquiryId, replyText) {
  await tryFetch(`${API}/inquiries/${inquiryId}/reply`, {
    method: "PATCH",
    body: JSON.stringify({ reply: replyText }),
  });
  const msgs = lsGet("vs_owner_inquiries");
  lsSet("vs_owner_inquiries", msgs.map((m) =>
    m.id === inquiryId
      ? { ...m, reply: replyText, replyDate: new Date().toISOString(), read: true }
      : m
  ));
}

// Admin approves or rejects an owner-submitted listing
export async function setListingApproval(id, approvalStatus) {
  try {
    await tryFetch(`${API}/properties/${id}/approval`, {
      method: "PATCH",
      body: JSON.stringify({ approvalStatus }),
    });
  } catch (err) {
    console.warn("setListingApproval backend error:", err.message);
    // Still update the local caches below so the UI reflects the action
  }
  const update = (key) => {
    const c = lsGet(key);
    lsSet(key, c.map((l) => Number(l.id) === Number(id) ? { ...l, approvalStatus } : l));
  };
  update("vs_admin_listings");
  update("vs_properties");
  update("vs_owner_listings"); // keep owner's cache in sync so they see correct status on refresh
}

// ============================================================
// SAVED / FAVORITES  — uses favoriteService for real backend,
// localStorage as local cache
// ============================================================

export function getSavedIds() {
  return JSON.parse(localStorage.getItem("savedListings") || "[]");
}

export function toggleSaved(propertyId) {
  const ids = getSavedIds();
  const updated = ids.includes(propertyId)
    ? ids.filter((id) => id !== propertyId)
    : [...ids, propertyId];
  localStorage.setItem("savedListings", JSON.stringify(updated));
  return updated;
}
