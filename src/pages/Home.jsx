import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import Hero from "../components/Hero";
import Card from "../components/Card";
import { getAllListings, loadPropertiesFromBackend } from "../data/appData";

function Home() {
  const [allProperties, setAllProperties] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch_ = async () => {
      setLoading(true);
      await loadPropertiesFromBackend();
      setAllProperties(getAllListings());
      setLoading(false);
    };
    fetch_();
  }, []);

  // Only approved listings are shown publicly
  const approvedProperties = allProperties.filter(
    (p) => (p.approvalStatus || "approved") === "approved"
  );

  // Stats derived from real data
  const totalListings   = approvedProperties.length;
  const availableNow    = approvedProperties.filter((p) => p.status === "available").length;
  const citiesCovered   = new Set(approvedProperties.map((p) => p.city).filter(Boolean)).size;
  const uniqueOwners    = new Set(approvedProperties.map((p) => p.ownerId).filter(Boolean)).size;

  const stats = [
    { icon: "🏠", number: totalListings,  label: "Total Listings"    },
    { icon: "✅", number: availableNow,   label: "Available Now"     },
    { icon: "📍", number: citiesCovered,  label: "Cities Covered"    },
    { icon: "👤", number: uniqueOwners,   label: "Property Owners"   },
  ];

  const steps = [
    { number: "01", icon: "🔍", title: "Search",  description: "Browse verified boarding houses filtered by location, budget, and amenities." },
    { number: "02", icon: "💬", title: "Inquire", description: "Message the owner or admin directly with your questions and preferred move-in date." },
    { number: "03", icon: "📅", title: "Book",    description: "Submit a booking request. The owner reviews and confirms within 24 hours." },
    { number: "04", icon: "🏠", title: "Move In", description: "Get your confirmation and move in on your chosen date." },
  ];

  const amenities = [
    { icon: "🚿", label: "Private Bathroom" },
    { icon: "📶", label: "WiFi Included"    },
    { icon: "🅿️", label: "Parking Space"   },
    { icon: "🏋️", label: "Gym Access"      },
    { icon: "🍽️", label: "Meals Available" },
    { icon: "🔒", label: "24/7 Security"   },
    { icon: "🐾", label: "Pet Friendly"    },
    { icon: "🎓", label: "Near Schools"    },
  ];

  return (
    <div>
      <Hero />

      {/* ── Stats floating over hero bottom ── */}
      <div className="stats-section">
        <div className="container">
          <div className="stats-grid">
            {stats.map((s, i) => (
              <div key={i} className="stat-card">
                <div className="stat-icon-wrap">
                  <span>{s.icon}</span>
                </div>
                <strong className="stat-number">{loading ? "—" : s.number}</strong>
                <span className="stat-label">{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Featured listings (no filter tabs) ── */}
      <section className="featured">
        <div className="container">
          <div className="section-header">
            <h2>Featured Boarding Houses</h2>
            <p>Browse the latest verified properties on VacanSee</p>
          </div>

          {loading ? (
            <div className="browse-loading">
              <div className="browse-spinner" />
              <p>Loading properties…</p>
            </div>
          ) : approvedProperties.length === 0 ? (
            <div style={{ padding: "48px 0", textAlign: "center", color: "var(--color-text-muted)" }}>
              <div style={{ fontSize: "40px", marginBottom: "12px" }}>🏠</div>
              <p style={{ fontSize: "15px" }}>No listings available yet. Check back soon!</p>
            </div>
          ) : (
            <div className="cards">
              {approvedProperties.slice(0, 6).map((p) => (
                <Card key={p.id} id={p.id} title={p.title}
                  location={p.city || p.location} price={p.price}
                  bedrooms={p.bedrooms} bathrooms={p.bathrooms}
                  propertyType={p.propertyType} status={p.status}
                  featuredImage={p.featuredImage} ownerName={p.ownerName} />
              ))}
            </div>
          )}

          <div className="view-all-btn">
            <Link to="/browse">View All Properties →</Link>
          </div>
        </div>
      </section>

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

      <section className="cta-section">
        <div className="container">
          <h2>Ready to Find Your Perfect Stay?</h2>
          <p>Browse real listings from verified property owners across the Philippines</p>
          <div className="cta-buttons">
            <Link to="/browse" className="cta-btn primary">Search Properties</Link>
            {localStorage.getItem("isLoggedIn") !== "true" && (
              <Link to="/register" className="cta-btn secondary">Create Account</Link>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

export default Home;
