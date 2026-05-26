# VacanSee — UI to Code Map

Every visible section in the browser mapped to its source file and exact line number.

---

## App Shell — `src/App.jsx`

| UI Element | Lines |
|---|---|
| Imports + role sync logic | 1–57 |
| Route definitions (all pages) | 62–96 |
| `<Navbar>` rendered | 61 |
| `<Footer>` rendered | 97 |
| `<ChatBox>` floating widget rendered | 98 |

---

## Navbar — `src/components/Navbar.jsx`

| UI Element | Lines |
|---|---|
| `handleLogout` function | 34–38 |
| **Admin navbar** (logo + theme toggle + Logout button) | 41–59 |
| **Owner navbar** (logo + Home/Browse links + My Dashboard + profile dropdown) | 62–107 |
| **Tenant / public navbar** (full nav links) | 109–176 |
| Nav links (Home, Browse, Search, About, Contact) | 118–124 |
| Dark mode toggle button | 129–131 |
| Dashboard shortcut button (logged-in tenant) | 136 |
| Profile avatar + dropdown (logged-in tenant) | 139–164 |
| Log In / Sign Up buttons (logged-out) | 168–170 |

---

## Footer — `src/components/Footer.jsx`

| UI Element | Lines |
|---|---|
| Entire footer (columns: About, Links, Contact) | 1–end |

---

## ChatBox Floating Widget — `src/components/ChatBox.jsx`

| UI Element | Lines |
|---|---|
| `refreshMessagesSync` (role-aware cache read) | 33–42 |
| Thread grouping logic | 56–77 |
| **ThreadList** component (inbox view) | 117–159 |
| — Empty state | 119–128 |
| — Thread item row (title, preview, date, unread dot) | 130–155 |
| **ThreadView** component (single conversation) | 162–249 |
| — Owner view (tenant bubble → owner reply bubble) | 173–196 |
| — Tenant view (own bubble → admin/owner reply bubble) | 198–221 |
| — Reply textarea + Send button (tenant only) | 228–246 |
| Floating toggle button (💬) | 254–256 |
| ChatBox container + header | 259–293 |
| Back arrow (returns to thread list) | 264–270 |
| Body routing: NotLoggedIn / ThreadView / ThreadList | 296–302 |

---

## Card Component — `src/components/Card.jsx`

| UI Element | Lines |
|---|---|
| Image wrapper (position + overflow) | 38–45 |
| Property photo `<img>` | 47–59 |
| Bottom gradient overlay | 62–67 |
| Heart / Save button (top-left) | 70–92 |
| Availability badge — Available / Occupied (top-right) | 94–108 |
| Property type badge (bottom-left) | 110–126 |
| Approval status badge — Pending / Rejected (bottom-right, admin only) | 128–144 |
| Text content card (title, location, beds/baths, price, View Details button) | 148–167 |

---

## Home Page — `src/pages/Home.jsx`

| UI Section | Lines |
|---|---|
| `<Hero />` component | 68 |
| Stats section (1,200+ tenants, 500+ properties, etc.) | 70–82 |
| Featured Boarding Houses section header | 84–89 |
| Filter tabs (All / With WiFi / With Meals / etc.) | 90–96 |
| Property cards grid (up to 6) | 97–121 |
| View All Properties link | 119–121 |
| Amenities strip ("What You Get") | 125–140 |
| How VacanSee Works (4-step section) | 142–159 |
| Bottom CTA section (Search + Create Account) | 161–170 |

---

## Browse Page — `src/pages/Browse.jsx`

| UI Section | Lines |
|---|---|
| Page header banner (title + listing count) | 88–97 |
| **Admin-only status filter bar** (All / Approved / Pending / Rejected) | 99–118 |
| Sidebar — Search text input | 123–131 |
| Sidebar — Property Type dropdown | 134–140 |
| Sidebar — Price Range (min/max inputs) | 142–163 |
| Sidebar — Bedrooms dropdown | 165–174 |
| Sidebar — Amenities dropdown | 176–184 |
| Sidebar — Sort by Price dropdown | 186–193 |
| Clear All Filters button | 195–197 |
| Results header (count + Grid/List toggle) | 201–209 |
| Loading spinner | 211–215 |
| No-results empty state | 216–220 |
| Property cards grid | 222–239 |

---

## Search Page — `src/pages/Search.jsx`

| UI Section | Lines |
|---|---|
| Page header banner (cover3 image + title) | 53–56 |
| Controls bar (text input, type filter, price filter, sort) | 58–78 |
| Results count + "Admin view" badge | 88–92 |
| No-results empty state | 93–97 |
| Property cards grid | 99–108 |

---

## Listing Details Page — `src/pages/ListingDetails.jsx`

| UI Section | Lines |
|---|---|
| Review submit handler | 68–96 |
| Booking conflict check (front-end) | 106–140 |
| `addBooking` call | 142–159 |
| Hero / cover image with Save button | 224–231 |
| **Left panel** — availability badge + title + location + price | 238–253 |
| Left panel — bedrooms / bathrooms / type / year meta row | 255–260 |
| Left panel — Description | 262–265 |
| Left panel — Amenities grid | 267–278 |
| Left panel — Property Info table (ID, city, province, area, listed) | 280–289 |
| Left panel — **Reviews & Ratings section** | 292–364 |
| — Average rating display | 297–308 |
| — Existing reviews list | 311–329 |
| — Write a review form (logged-in only) | 332–363 |
| **Right panel** — Booking form (step: form) | 369–416 |
| — Move-in date input | 377–383 |
| — Number of months input | 385–392 |
| — Total price display | 394–399 |
| — Booking error message | 401–405 |
| — Confirm Booking button | 407–414 |
| Right panel — Step: message (after booking success) | 418–463 |
| — Success banner | 422–424 |
| — Message textarea + Send / Skip buttons | 431–461 |
| Right panel — Step: done (redirecting) | 465–474 |
| Safety note (shown only on form step) | 479–484 |

---

## Login Page — `src/pages/Login.jsx`

| UI Section | Lines |
|---|---|
| Auth card container | 45–97 |
| 🏠 logo + Welcome Back heading + subtitle | 48–50 |
| Demo credentials toggle button | 53–58 |
| Demo credentials hint box (expanded) | 60–66 |
| Error message | 68 |
| Email input | 70–77 |
| Password input | 78–85 |
| Log In button | 87–89 |
| Sign up link | 91–93 |

---

## Register Page — `src/pages/Register.jsx`

| UI Section | Lines |
|---|---|
| Auth card container | 81–194 |
| Error / success messages | 88–89 |
| Role selector heading | 92 |
| Role selector grid — Tenant card | 95–107 |
| Role selector grid — Owner card | 109–122 |
| Full Name input | 126–134 |
| Email input | 135–143 |
| Password input | 144–152 |
| Confirm Password input | 153–161 |
| Owner extra note (shown only when OWNER selected) | 164–171 |
| Submit button (label changes by role) | 174–186 |
| Log in link | 188–190 |

---

## Tenant Dashboard — `src/pages/Dashboard.jsx`

| UI Section | Lines |
|---|---|
| Welcome banner (username + Find a Room / Saved buttons) | 60–74 |
| Stats row (My Bookings / Pending / Confirmed / Saved) | 77–88 |
| My Booking Requests section header | 90–94 |
| Loading / empty state | 96–104 |
| Booking rows (title, move-in, months, total, status pill, Cancel button) | 106–146 |
| Saved Properties preview (up to 3 cards) | 150–172 |
| Quick Links grid (Search / Browse / Messages / Profile) | 174–189 |

---

## Admin Dashboard — `src/pages/AdminDashboard.jsx`

| UI Section | Lines |
|---|---|
| Header bar (title + stats pills) | 216–242 |
| — Listings count pill | 223 |
| — Pending approval pill | 224–226 |
| — Pending bookings pill | 227 |
| — Unread messages pill | 228 |
| — 🔄 Sync Status button | 229–236 |
| — Sync result message | 237–239 |
| **Tab bar** (Listings / Bookings / Messages) | 247–260 |
| **LISTINGS tab** | 270–408 |
| — Pending Approval banner (owner submissions) | 281–319 |
| — Approve / Reject buttons on pending cards | 306–309 |
| — Edit / Delete buttons on pending cards | 312–313 |
| — Listing filter tabs (All / Pending / Approved / Rejected) | 322–340 |
| — All listings grid | 341–408 |
| **BOOKINGS tab** | 413–463 |
| — Booking filter pills (All/Pending/Confirmed/Completed/Rejected/Cancelled) | 417–424 |
| — Booking cards (property, tenant, dates, total, status, Approve/Reject) | 433–460 |
| **MESSAGES tab** | 468–511 |
| — Message cards with Reply button | 468–511 |
| **Add / Edit Listing modal** | 516–666 |
| **Reply to Message modal** | 667–697 |
| **Delete Listing confirmation modal** | 698–end |

---

## Owner Dashboard — `src/pages/OwnerDashboard.jsx`

| UI Section | Lines |
|---|---|
| Header bar (title + stats: Listings / Bookings / Pending / Confirmed / Unread Msgs) | 190–219 |
| **Tab bar** (My Listings / Bookings / Messages) | 222–238 |
| **LISTINGS tab** | 245–428 |
| — Section header + Refresh / Add New Listing buttons | 247–259 |
| — Pending notice banner | 262–266 |
| — Add / Edit Listing form card (inline, not a modal) | 269–407 |
| — Listing cards (title, status, Edit / Delete buttons) | 392–428 |
| **BOOKINGS tab** | 429–516 |
| — Booking filter pills (All/Pending/Confirmed/Completed/Rejected/Cancelled) | 433–443 |
| — Booking cards (property, tenant, check-in, check-out, total, Approve/Reject) | 452–513 |
| **MESSAGES tab** | 517–569 |
| — Inquiry cards (tenant message → owner reply bubble) | 529–565 |
| — Reply / Edit Reply button | 557–562 |
| **Reply modal** | 570–end |

---

## Messages Page — `src/pages/Messages.jsx`

| UI Section | Lines |
|---|---|
| Page header (My Messages) | 44–50 |
| Loading / empty state | 53–61 |
| Message card list | 63–103 |
| — Status pill (✅ Replied / ⏳ Pending based on reply presence) | 74–77 |
| — Your message bubble | 83–86 |
| — Owner/Admin reply bubble | 88–95 |
| — Awaiting reply indicator | 96–98 |

---

## Conversations Page — `src/pages/Conversations.jsx`

| UI Section | Lines |
|---|---|
| Page header (My Booking History) | 31–37 |
| Loading / empty state | 41–48 |
| Booking thread cards | 51–113 |
| — Status pill (Pending/Confirmed/Completed/Rejected/Cancelled) | 59–69 |
| — Move-in / Duration / Total booking details bubble | 75–82 |
| — Confirmed bubble ("prepare for move-in") | 84–88 |
| — Completed bubble ("rental period has ended") | 90–95 |
| — Rejected bubble | 96–100 |
| — Cancelled bubble | 102–106 |
| — Awaiting review indicator (pending) | 108–110 |

---

## Profile Page — `src/pages/Profile.jsx`

| UI Section | Lines |
|---|---|
| Profile banner (avatar initial, name, email, quick stats) | 38–54 |
| Personal Information card (name input, email readonly, account ID) | 59–91 |
| Notification Settings card (Email / SMS / Newsletter toggles) | 93–128 |
| My Activity card (links to Bookings, Saved, Messages) | 130–156 |

---

## Saved Page — `src/pages/Saved.jsx`

| UI Section | Lines |
|---|---|
| Page header (Saved Listings) | 20–25 |
| Empty state (no saved listings) | 28–34 |
| Saved count + Clear All button | 37–40 |
| Saved property cards grid | 41–48 |

---

## About Page — `src/pages/About.jsx`

| UI Section | Lines |
|---|---|
| Hero banner (cover2 image + title) | 19–24 |
| Mission section (text + Browse Listings link) | 26–39 |
| Stats column (1,200+ / 500+ / 50+ / 4.9★) | 40–45 |
| Values grid ("Why Choose VacanSee?") | 49–65 |
| Team section + course note | 67–82 |

---

## Contact Page — `src/pages/Contact.jsx`

| UI Section | Lines |
|---|---|
| Hero banner (cover3 image + "Get in Touch") | 35–40 |
| Left panel — Contact info list (address, phone, email, hours) | 45–59 |
| Right panel — Contact form (name, email, subject, message) | 63–97 |
| Success message (shown after submit) | 66–69 |
| Send Message button | 95–97 |

---

## Data Layer — `src/data/`

| Function | File | Purpose |
|---|---|---|
| `getAllListings()` | `appData.js` | Returns public approved properties from `vs_properties` cache |
| `loadPropertiesFromBackend()` | `appData.js` | Fetches all properties from backend, updates `vs_properties` |
| `getListingById(id)` | `appData.js` | Single listing lookup |
| `addBooking()` | `adminData.js` | POSTs booking; re-throws HTTP 4xx (including 409 conflict) |
| `getBookingsByUser(userId)` | `adminData.js` | Fetches tenant's booking list (used for conflict check) |
| `cancelBooking(id)` | `adminData.js` | Tenant cancels a pending booking |
| `updateBookingStatus(id, status)` | `adminData.js` | Admin confirms/rejects; calls `syncPropertyStatus` |
| `updateOwnerBookingStatus(id, status)` | `adminData.js` | Owner confirms/rejects; calls `syncPropertyStatus` |
| `syncPropertyStatus(propId, prevStatus, newStatus)` | `adminData.js` | Keeps `vs_properties`, `vs_owner_listings`, `vs_admin_listings` in sync |
| `setListingApproval(id, status)` | `adminData.js` | Admin approves/rejects a listing; always updates localStorage |
| `getAdminListings()` | `adminData.js` | All listings for admin view |
| `getOwnerListings(ownerId)` | `adminData.js` | Owner's own listings |
| `addOwnerListing(data, ownerId)` | `adminData.js` | Owner submits new listing (sets `approvalStatus: "pending"`) |
| `getSavedIds()` / `toggleSaved()` | `adminData.js` | Read/write `savedListings` in localStorage |
| `getMessages()` / `getOwnerInquiries()` | `adminData.js` | Fetch messages for admin / owner |
| `addMessage()` | `adminData.js` | Tenant sends inquiry after booking |
| `replyToMessage()` / `replyToOwnerMessage()` | `adminData.js` | Admin / Owner sends reply |

---

## Backend Endpoints — Spring Boot (port 8000)

| Endpoint | Method | Purpose |
|---|---|---|
| `/api/properties` | GET | All listings |
| `/api/properties/{id}` | GET / PUT / DELETE | Single listing CRUD |
| `/api/bookings` | POST | Create booking (server-side 409 if dates overlap confirmed booking) |
| `/api/bookings/user/{userId}` | GET | Tenant's bookings |
| `/api/bookings/{id}/status` | PUT | Update booking status (auto-syncs property occupied/available) |
| `/api/admin/sync-status` | POST | Manual trigger: revert expired bookings → available |
| `/api/inquiries` | GET / POST | Messages / inquiries |
| `/api/inquiries/user/{userId}` | GET | Tenant's sent inquiries |
| `/api/inquiries/{id}/reply` | PUT | Admin/Owner reply |
| `/api/reviews` | POST | Submit a property review |
| `/api/reviews/property/{id}` | GET | All reviews for a listing |
| `/api/users` | GET / POST | User management |

---

## Automatic Status Scheduler

**File:** `src/main/java/com/vacanSee/scheduler/PropertyStatusScheduler.java`

Runs every **60 seconds** (fires immediately on startup via `initialDelay = 0`).
Finds any booking where `status = 'confirmed'` and `checkOutDate <= today`,
marks the booking `"completed"`, and sets the property back to `"available"`.

Manual trigger: **POST** `/api/admin/sync-status`
Connected to the **🔄 Sync Status** button in Admin Dashboard (line 229).
