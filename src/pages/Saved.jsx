import { useState } from "react";
import { Link } from "react-router-dom";
import Card from "../components/Card";
import { getAllListings } from "../data/appData";
import { getSavedIds, toggleSaved } from "../data/adminData";

function Saved() {
  const [savedIds, setSavedIds] = useState(() => getSavedIds());

  const allListings = getAllListings();
  const savedListings = allListings.filter((p) => savedIds.includes(p.id));

  const handleClearAll = () => {
    localStorage.setItem("savedListings", "[]");
    setSavedIds([]);
  };

  return (
    <div className="messages-page">
      <div className="inner-page-header">
        <div className="container">
          <h1>Saved Listings</h1>
          <p>Properties you have bookmarked for later</p>
        </div>
      </div>

      <div className="container" style={{ paddingTop: "36px", paddingBottom: "80px" }}>
        {savedListings.length === 0 ? (
          <div className="empty-state-box">
            <div className="empty-icon">🏠</div>
            <h2>No Saved Listings Yet</h2>
            <p>Click the ❤️ heart icon on the top-left of any listing card to save it here.</p>
            <Link to="/browse" className="empty-cta-btn">Browse Properties</Link>
          </div>
        ) : (
          <>
            <div className="saved-header-row">
              <p><strong>{savedListings.length}</strong> saved {savedListings.length === 1 ? "property" : "properties"}</p>
              <button className="clear-saved-btn" onClick={handleClearAll}>Clear All</button>
            </div>
            <div className="cards">
              {savedListings.map((p) => (
                <Card key={p.id} id={p.id} title={p.title}
                  location={p.city || p.location} price={p.price}
                  bedrooms={p.bedrooms} bathrooms={p.bathrooms}
                  propertyType={p.propertyType} status={p.status} featuredImage={p.featuredImage} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default Saved;
