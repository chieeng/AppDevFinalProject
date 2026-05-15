import SearchBar from "./SearchBar";
import cover1 from "../images/cover-1.png";

// Hero - the big banner on the home page with the search bar
function Hero() {
  return (
    <div className="hero" style={{ backgroundImage: `url(${cover1})` }}>
      <div className="hero-overlay">
        <p className="hero-eyebrow">Trusted by 1,200+ tenants in the Philippines</p>
        <h1>Find Your Perfect Boarding House</h1>
        <p className="hero-sub">Search by location and budget to discover comfortable, verified properties near you.</p>
        <SearchBar />
      </div>
    </div>
  );
}

export default Hero;
