import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import Card from "../components/Card";
import { getAllListings, loadPropertiesFromBackend } from "../data/appData";
import cover3 from "../images/cover-3.png";

function Search() {
  const isAdmin = localStorage.getItem("userRole") === "ADMIN";

  const [searchParams] = useSearchParams();
  const [allProperties, setAllProperties] = useState([]);
  const [loading, setLoading]             = useState(true);
  const [searchTerm, setSearchTerm]       = useState(searchParams.get("location") || "");
  const [sortOrder, setSortOrder]         = useState("");
  const [filterType, setFilterType]       = useState("");
  const [maxPrice, setMaxPrice]           = useState(searchParams.get("maxPrice") || "");

  useEffect(() => {
    const fetch_ = async () => {
      setLoading(true);
      await loadPropertiesFromBackend();
      setAllProperties(getAllListings());
      setLoading(false);
    };
    fetch_();
  }, []);

  const propertyTypes = ["Boarding House", "Bed Space", "Dormitory"];

  // Admin sees all listings; public sees only approved
  const visibleProperties = isAdmin
    ? allProperties
    : allProperties.filter((p) => (p.approvalStatus || "approved") === "approved");

  let filtered = visibleProperties.filter((p) => {
    const q = searchTerm.toLowerCase();
    return p.title.toLowerCase().includes(q) || (p.city || p.location || "").toLowerCase().includes(q);
  });
  if (filterType) filtered = filtered.filter((p) => p.propertyType === filterType);
  if (maxPrice)   filtered = filtered.filter((p) => (p.price || 0) <= parseInt(maxPrice));

  const sorted = [...filtered].sort((a, b) => {
    if (sortOrder === "low") return (a.price || 0) - (b.price || 0);
    if (sortOrder === "high") return (b.price || 0) - (a.price || 0);
    return 0;
  });

  const resetFilters = () => { setSearchTerm(""); setSortOrder(""); setFilterType(""); setMaxPrice(""); };
  const hasFilters = searchTerm || filterType || maxPrice || sortOrder;

  return (
    <div className="search-page">
      <div className="search-header" style={{ backgroundImage: `url(${cover3})` }}>
        <h1>Search Properties</h1>
        <p>Find your perfect boarding house</p>
      </div>

      <div className="search-controls">
        <input type="text" placeholder="Search by title or city..." className="search-input" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        <select className="search-input" value={filterType} onChange={(e) => setFilterType(e.target.value)}>
          <option value="">All Types</option>
          {propertyTypes.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
        <select className="search-input" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)}>
          <option value="">Any Price</option>
          <option value="1500">Under ₱1,500</option>
          <option value="2500">Under ₱2,500</option>
          <option value="4000">Under ₱4,000</option>
          <option value="6000">Under ₱6,000</option>
          <option value="10000">Under ₱10,000</option>
        </select>
        <select className="search-input" value={sortOrder} onChange={(e) => setSortOrder(e.target.value)}>
          <option value="">Sort by Price</option>
          <option value="low">Low to High</option>
          <option value="high">High to Low</option>
        </select>
        {hasFilters && <button className="clear-filters-btn" onClick={resetFilters}>Clear</button>}
      </div>

      <div className="search-results">
        {loading ? (
          <div className="browse-loading">
            <div className="browse-spinner" />
            <p>Loading properties…</p>
          </div>
        ) : (
          <>
            <h2>
              {sorted.length} {sorted.length === 1 ? "property" : "properties"} found
              {searchTerm && <span style={{ fontWeight: 400, fontSize: "15px", marginLeft: "8px", color: "#64748b" }}>for "{searchTerm}"</span>}
              {isAdmin && <span style={{ fontWeight: 500, fontSize: "13px", marginLeft: "10px", color: "#d97706", background: "#fffbeb", border: "1px solid #fde68a", borderRadius: "999px", padding: "2px 10px" }}>Admin view — all statuses</span>}
            </h2>
            {sorted.length === 0 ? (
              <div className="no-results-box">
                <p>No properties match your search.</p>
                <button onClick={resetFilters}>Clear Filters</button>
              </div>
            ) : (
              <div className="cards">
                {sorted.map((p) => (
                  <Card key={p.id} id={p.id} title={p.title}
                    location={p.city || p.location} price={p.price}
                    bedrooms={p.bedrooms} bathrooms={p.bathrooms}
                    propertyType={p.propertyType} status={p.status}
                    featuredImage={p.featuredImage}
                    approvalStatus={isAdmin ? p.approvalStatus : undefined}
                    ownerName={p.ownerName} />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default Search;
