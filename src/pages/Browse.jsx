import { useState, useEffect } from "react";
import Card from "../components/Card";
import cover2 from "../images/cover-2.png";
import { getAllListings, loadPropertiesFromBackend } from "../data/appData";

function Browse() {
  const [allListings, setAllListings] = useState([]);
  const [loading, setLoading]         = useState(true);
  const [searchTerm, setSearchTerm]   = useState("");
  const [sortPrice, setSortPrice]     = useState("");
  const [filterType, setFilterType]   = useState("");
  const [filterBedrooms, setFilterBedrooms] = useState("");
  const [viewMode, setViewMode]       = useState("grid");

  // Always fetch fresh from backend when page mounts
  useEffect(() => {
    const fetchListings = async () => {
      setLoading(true);
      await loadPropertiesFromBackend();   // updates vs_properties cache
      setAllListings(getAllListings());    // read the updated cache
      setLoading(false);
    };
    fetchListings();
  }, []);

  const propertyTypes = [...new Set(allListings.map((p) => p.propertyType).filter(Boolean))];

  let results = allListings.filter((item) => {
    const q = searchTerm.toLowerCase();
    return (
      item.title.toLowerCase().includes(q) ||
      (item.city || item.location || "").toLowerCase().includes(q)
    );
  });

  if (filterType)     results = results.filter((p) => p.propertyType === filterType);
  if (filterBedrooms) results = results.filter((p) => Number(p.bedrooms) >= parseInt(filterBedrooms));

  if (sortPrice === "low-high") results = [...results].sort((a, b) => (a.price || 0) - (b.price || 0));
  else if (sortPrice === "high-low") results = [...results].sort((a, b) => (b.price || 0) - (a.price || 0));

  const resetFilters = () => { setSearchTerm(""); setSortPrice(""); setFilterType(""); setFilterBedrooms(""); };
  const hasFilters = searchTerm || sortPrice || filterType || filterBedrooms;

  return (
    <div className="browse-page">
      <div className="browse-header" style={{ backgroundImage: `url(${cover2})` }}>
        <div className="browse-header-overlay">
          <h1>Browse Boarding Houses</h1>
          <p>Discover {allListings.length} verified properties across the Philippines</p>
        </div>
      </div>

      <div className="browse-body">
        <aside className="browse-sidebar">
          <div className="sidebar-box">
            <h3>Search</h3>
            <input type="text" placeholder="Title or city..." className="sidebar-input" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
          <div className="sidebar-box">
            <h3>Property Type</h3>
            <select className="sidebar-input" value={filterType} onChange={(e) => setFilterType(e.target.value)}>
              <option value="">All Types</option>
              {propertyTypes.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
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
            <h3>Sort by Price</h3>
            <select className="sidebar-input" value={sortPrice} onChange={(e) => setSortPrice(e.target.value)}>
              <option value="">Default</option>
              <option value="low-high">Low to High</option>
              <option value="high-low">High to Low</option>
            </select>
          </div>
          {hasFilters && <button className="clear-filters-btn" onClick={resetFilters}>Clear Filters</button>}
        </aside>

        <main className="browse-main">
          <div className="browse-results-header">
            <p className="results-count">
              <strong>{results.length}</strong> {results.length === 1 ? "property" : "properties"} found
            </p>
            <div className="view-toggle">
              <button className={viewMode === "grid" ? "active" : ""} onClick={() => setViewMode("grid")}>Grid</button>
              <button className={viewMode === "list" ? "active" : ""} onClick={() => setViewMode("list")}>List</button>
            </div>
          </div>

          {loading ? (
            <div style={{ padding: "60px", textAlign: "center", color: "var(--color-text-muted)" }}>Loading properties...</div>
          ) : results.length === 0 ? (
            <div className="no-results-box">
              <p>No properties found matching your filters.</p>
              <button onClick={resetFilters}>Clear Filters</button>
            </div>
          ) : (
            <div className={viewMode === "grid" ? "cards" : "cards-list"}>
              {results.map((item) => (
                <Card key={item.id} id={item.id} title={item.title}
                  location={item.city || item.location} price={item.price}
                  bedrooms={item.bedrooms} bathrooms={item.bathrooms}
                  propertyType={item.propertyType} status={item.status}
                  featuredImage={item.featuredImage} />
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default Browse;
