import { useState } from "react";
import { useNavigate } from "react-router-dom";

// SearchBar inside the Hero section
// When user submits, it navigates to /search with the query pre-filled via URL params
function SearchBar() {
  const [location, setLocation] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const navigate = useNavigate();

  const handleSearch = () => {
    // Build query string and send to Search page
    const params = new URLSearchParams();
    if (location) params.set("location", location);
    if (maxPrice) params.set("maxPrice", maxPrice);
    navigate(`/search?${params.toString()}`);
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") handleSearch();
  };

  return (
    <div className="search-box">
      <input
        placeholder="City or location..."
        value={location}
        onChange={(e) => setLocation(e.target.value)}
        onKeyPress={handleKeyPress}
      />
      <select value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)}>
        <option value="">Any Budget</option>
        <option value="1500">Under ₱1,500</option>
        <option value="2500">Under ₱2,500</option>
        <option value="4000">Under ₱4,000</option>
        <option value="6000">Under ₱6,000</option>
      </select>
      <button onClick={handleSearch}>🔍 Search</button>
    </div>
  );
}

export default SearchBar;
