import cover1 from "../images/cover-1.png";

function Hero() {
  return (
    <div className="hero" style={{ backgroundImage: `url(${cover1})` }}>
      <div className="hero-overlay">
        <p className="hero-eyebrow">Trusted by 1,200+ tenants in the Philippines</p>
        <h1>Find Your Perfect Boarding House</h1>
        <p className="hero-sub">Browse verified boarding houses across the Philippines.</p>
      </div>
    </div>
  );
}

export default Hero;
