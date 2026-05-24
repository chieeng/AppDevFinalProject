import { useState, useEffect } from "react";
import Card from "../components/Card";
import cover2 from "../images/cover-2.png";
import { getAllListings, loadPropertiesFromBackend } from "../data/appData";

function Browse() {
  const isAdmin = localStorage.getItem("userRole") === "ADMIN";

  const [allListings, setAllListings] = useState([]);
  const [loading, setLoading]         = useState(true);
  const [searchTerm, setSearchTerm]   = useState("");
  const [sortPrice, setSortPrice]     = useState("");
  const [filterType, setFilterType]   = useState("");
  const [filterBedrooms, setFilterBedrooms] = useState("");
  const [minPrice, setMinPrice]       = useState("");
  const [maxPrice, setMaxPrice]       = useState("");
  const [filterAmenity, setFilterAmenity] = useState("");
  const [viewMode, setViewMode]       = useState("grid");
  const [adminStatusFilter, setAdminStatusFilter] = useState("all"); // admin-only filter

  useEffect(() => {
    const fetchListings = async () => {
      setLoading(true);
      await loadPropertiesFromBackend();
      setAllListings(getAllListings());
      setLoading(false);
    };
    fetchListings();
  }, []);

  const propertyTypes = ["Boarding House", "Bed Space", "Dormitory"];

  const amenityOptions = [
    { value: "hasWifi",    label: "📶 WiFi" },
    { value: "hasMeals",   label: "🍽️ Meals Included" },
    { value: "hasParking", label: "🅿️ Parking" },
    { value: "hasGym",     label: "🏋️ Gym" },
    { value: "hasPool",    label: "🏊 Pool" },
    { value: "hasGarden",  label: "🌿 Garden" },
    { value: "hasBalcony", label: "🏡 Balcony" },
    { value: "petFriendly",label: "🐾 Pet Friendly" },
  ];

  // Admin sees everything; public sees only approved listings
  const visibleListings = isAdmin
    ? (adminStatusFilter === "all"
        ? allListings
        : allListings.filter((p) => {
            if (adminStatusFilter === "pending")  return p.approvalStatus === "pending";
            if (adminStatusFilter === "rejected") return p.approvalStatus === "rejected";
            return !p.approvalStatus || p.approvalStatus === "approved";
          }))
    : allListings.filter((p) => (p.approvalStatus || "approved") === "approved");

  const publicListings = isAdmin ? allListings : allListings.filter((p) => (p.approvalStatus || "approved") === "approved");

  let results = visibleListings.filter((item) => {
    const q = searchTerm.toLowerCase();
    const matchesSearch =
      item.title.toLowerCase().includes(q) ||
      (item.city || item.location || "").toLowerCase().includes(q) ||
      (item.state || "").toLowerCase().includes(q);
    const matchesMin    = !minPrice || (item.price || 0) >= Number(minPrice);
    const matchesMax    = !maxPrice || (item.price || 0) <= Number(maxPrice);
    const matchesType   = !filterType || item.propertyType === filterType;
    const matchesBeds   = !filterBedrooms || Number(item.bedrooms) >= parseInt(filterBedrooms);
    const matchesAmenity = !filterAmenity || !!item[filterAmenity];
    return matchesSearch && matchesMin && matchesMax && matchesType && matchesBeds && matchesAmenity;
  });

  if (sortPrice === "low-high") results = [...results].sort((a, b) => (a.price || 0) - (b.price || 0));
  else if (sortPrice === "high-low") results = [...results].sort((a, b) => (b.price || 0) - (a.price || 0));

  const resetFilters = () => {
    setSearchTerm("");
    setSortPrice("");
    setFilterType("");
    setFilterBedrooms("");
    setMinPrice("");
    setMaxPrice("");
    setFilterAmenity("");
  };

  const hasFilters = searchTerm || sortPrice || filterType || filterBedrooms || minPrice || maxPrice || filterAmenity;

  return (
    <div className="browse-page">
      <div className="browse-header" style={{ backgroundImage: `url(${cover2})` }}>
        <div className="browse-header-overlay">
          <h1>Browse Boarding Houses</h1>
          <p>
            {isAdmin
              ? `Admin view — ${allListings.length} total listings`
              : `Discover ${publicListings.length} verified properties across the Philippines`}
          </p>
        </div>
      </div>

      {/* Admin-only status filter bar */}
      {isAdmin && (
        <div className="browse-admin-bar">
          <span className="browse-admin-label">🔑 Admin View:</span>
          {[
            { key: "all",      label: `All (${allListings.length})` },
            { key: "approved", label: `Approved (${allListings.filter((p) => !p.approvalStatus || p.approvalStatus === "approved").length})` },
            { key: "pending",  label: `Pending (${allListings.filter((p) => p.approvalStatus === "pending").length})` },
            { key: "rejected", label: `Rejected (${allListings.filter((p) => p.approvalStatus === "rejected").length})` },
          ].map((f) => (
            <button
              key={f.key}
              className={`browse-admin-filter-btn ${adminStatusFilter === f.key ? "active" : ""}`}
              onClick={() => setAdminStatusFilter(f.key)}
            >
              {f.label}
            </button>
          ))}
        </div>
      )}

      <div className="browse-body">
        <aside className="browse-sidebar">

          <div className="sidebar-box">
            <h3>Search</h3>
            <input
              type="text"
              placeholder="Title, city or province…"
              className="sidebar-input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="sidebar-box">
            <h3>Property Type</h3>
            <select className="sidebar-input" value={filterType} onChange={(e) => setFilterType(e.target.value)}>
              <option value="">All Types</option>
              {propertyTypes.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          <div className="sidebar-box">
            <h3>Price Range (₱ / mo)</h3>
            <div className="price-range-row">
              <input
                type="number"
                min="0"
                placeholder="Min"
                className="sidebar-input price-range-input"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
              />
              <span className="price-range-sep">–</span>
              <input
                type="number"
                min="0"
                placeholder="Max"
                className="sidebar-input price-range-input"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
              />
            </div>
          </div>

          <div className="sidebar-box">
            <h3>Bedrooms</h3>
            <select className="sidebar-input" value={filterBedrooms} onChange={(e) => setFilterBedrooms(e.target.value)}>
              <option value="">Any</option>
              <option value="1">1+ Bedroom</option>
              <option value="2">2+ Bedrooms</option>
              <option value="3">3+ Bedrooms</option>
              <option value="4">4+ Bedrooms</option>
            </select>
          </div>

          <div className="sidebar-box">
            <h3>Amenities</h3>
            <select className="sidebar-input" value={filterAmenity} onChange={(e) => setFilterAmenity(e.target.value)}>
              <option value="">Any Amenity</option>
              {amenityOptions.map((a) => (
                <option key={a.value} value={a.value}>{a.label}</option>
              ))}
            </select>
          </div>

          <div className="sidebar-box">
            <h3>Sort by Price</h3>
            <select className="sidebar-input" value={sortPrice} onChange={(e) => setSortPrice(e.target.value)}>
              <option value="">Default</option>
              <option value="low-high">Low to High</option>
              <option value="high-low">High to Low</option>
            </select>
          </div>

          {hasFilters && (
            <button className="clear-filters-btn" onClick={resetFilters}>✕ Clear All Filters</button>
          )}
        </aside>

        <main className="browse-main">
          <div className="browse-results-header">
            <p className="results-count">
              <strong>{results.length}</strong> {results.length === 1 ? "property" : "properties"} found
            </p>
            <div className="view-toggle">
              <button className={viewMode === "grid" ? "active" : ""} onClick={() => setViewMode("grid")}>⊞ Grid</button>
              <button className={viewMode === "list" ? "active" : ""} onClick={() => setViewMode("list")}>☰ List</button>
            </div>
          </div>

          {loading ? (
            <div className="browse-loading">
              <div className="browse-spinner" />
              <p>Loading properties…</p>
            </div>
          ) : results.length === 0 ? (
            <div className="no-results-box">
              <p>No properties match your filters.</p>
              <button onClick={resetFilters}>Clear Filters</button>
            </div>
          ) : (
            <div className={viewMode === "grid" ? "cards" : "cards-list"}>
              {results.map((item) => (
                <Card
                  key={item.id}
                  id={item.id}
                  title={item.title}
                  location={item.city || item.location}
                  price={item.price}
                  bedrooms={item.bedrooms}
                  bathrooms={item.bathrooms}
                  propertyType={item.propertyType}
                  status={item.status}
                  featuredImage={item.featuredImage}
                  approvalStatus={isAdmin ? item.approvalStatus : undefined}
                />
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default Browse;
