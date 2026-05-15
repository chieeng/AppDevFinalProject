import { Link } from "react-router-dom";
import { useState } from "react";
import Hero from "../components/Hero";
import Card from "../components/Card";
import { getAllListings } from "../data/appData";

function Home() {
  const [activeFilter, setActiveFilter] = useState("All");
  const allProperties = getAllListings();

  // Boarding-house-appropriate quick filters
  const filters = [
    { label: "All",          check: () => true },
    { label: "With WiFi",    check: (p) => p.hasWifi || p.hasInternet },
    { label: "With Meals",   check: (p) => p.hasMeals || p.mealsIncluded },
    { label: "With Parking", check: (p) => p.hasParking },
    { label: "With Gym",     check: (p) => p.hasGym },
    { label: "Pet Friendly", check: (p) => p.petFriendly },
  ];

  const activeCheckFn = filters.find((f) => f.label === activeFilter)?.check || (() => true);

  const filtered = activeFilter === "All"
    ? allProperties.slice(0, 6)
    : allProperties.filter(activeCheckFn).slice(0, 6);

  const stats = [
    { number: "1,200+", label: "Happy Tenants",      icon: "😊" },
    { number: "500+",   label: "Verified Properties", icon: "🏠" },
    { number: "50+",    label: "Cities Covered",      icon: "📍" },
    { number: "4.9★",  label: "Average Rating",       icon: "⭐" },
  ];

  const steps = [
    { number: "01", icon: "🔍", title: "Search",  description: "Browse verified boarding houses filtered by location, budget, and amenities." },
    { number: "02", icon: "💬", title: "Inquire", description: "Message the admin directly with your questions and preferred move-in date." },
    { number: "03", icon: "📅", title: "Book",    description: "Submit a booking request. Admin reviews and confirms within 24 hours." },
    { number: "04", icon: "🏠", title: "Move In", description: "Get your confirmation and move in on your chosen date." },
  ];

  const amenities = [
    { icon: "🚿", label: "Private Bathroom" },
    { icon: "📶", label: "WiFi Included" },
    { icon: "🅿️", label: "Parking Space" },
    { icon: "🏋️", label: "Gym Access" },
    { icon: "🍽️", label: "Meals Available" },
    { icon: "🔒", label: "24/7 Security" },
    { icon: "🐾", label: "Pet Friendly" },
    { icon: "🎓", label: "Near Schools" },
  ];

  return (
    <div>
      <Hero />

      {/* STATS STRIP */}
      <div className="stats-section">
        <div className="container">
          <div className="stats-grid">
            {stats.map((s, i) => (
              <div key={i} className="stat-item">
                <span className="stat-icon-emoji">{s.icon}</span>
                <h3>{s.number}</h3>
                <p>{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* FEATURED LISTINGS */}
      <section className="featured">
        <div className="container">
          <div className="section-header">
            <h2>Featured Boarding Houses</h2>
            <p>Handpicked properties loved by our tenants</p>
          </div>

          {/* BOARDING HOUSE QUICK FILTERS */}
          <div className="filter-tabs">
            {filters.map((f) => (
              <button
                key={f.label}
                className={`filter-tab ${activeFilter === f.label ? "active" : ""}`}
                onClick={() => setActiveFilter(f.label)}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div className="cards">
            {filtered.length === 0 ? (
              <p style={{ padding: "40px", textAlign: "center", gridColumn: "1/-1", color: "var(--color-text-muted)" }}>
                No properties match this filter right now.
              </p>
            ) : (
              filtered.map((p) => (
                <Card key={p.id} id={p.id} title={p.title}
                  location={p.city || p.location} price={p.price}
                  bedrooms={p.bedrooms} bathrooms={p.bathrooms}
                  propertyType={p.propertyType} status={p.status} featuredImage={p.featuredImage} />
              ))
            )}
          </div>

          <div className="view-all-btn">
            <Link to="/browse">View All Properties →</Link>
          </div>
        </div>
      </section>

      {/* AMENITIES */}
      <section className="amenities-strip">
        <div className="container">
          <div className="section-header">
            <h2>What You Get</h2>
            <p>Common amenities found across our listings</p>
          </div>
          <div className="amenities-grid">
            {amenities.map((item, i) => (
              <div key={i} className="amenity-item">
                <span className="amenity-icon">{item.icon}</span>
                <span>{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="how-it-works">
        <div className="container">
          <div className="section-header">
            <h2>How VacanSee Works</h2>
            <p>From search to move-in in 4 simple steps</p>
          </div>
          <div className="steps-grid">
            {steps.map((step, i) => (
              <div key={i} className="step-card">
                <div className="step-number">{step.number}</div>
                <div className="step-icon-big">{step.icon}</div>
                <h3>{step.title}</h3>
                <p>{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="cta-section">
        <div className="container">
          <h2>Ready to Find Your Perfect Stay?</h2>
          <p>Join thousands of happy tenants who found their boarding house on VacanSee</p>
          <div className="cta-buttons">
            <Link to="/search" className="cta-btn primary">Search Properties</Link>
            <Link to="/register" className="cta-btn secondary">Create Account</Link>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Home;
