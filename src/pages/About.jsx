import cover2 from "../images/cover-2.png";
import { Link } from "react-router-dom";

function About() {
  const values = [
    { icon: "🔒", title: "Verified Listings", desc: "Every property is manually reviewed so you can trust what you see." },
    { icon: "💬", title: "Direct Communication", desc: "Message owners directly — no middlemen, no delays, no hidden fees." },
    { icon: "📅", title: "Easy Booking", desc: "Reserve a room in minutes. Pick your date, confirm, and you are set." },
    { icon: "🤝", title: "Tenant Protection", desc: "Our policies protect both tenants and owners for a fair rental experience." },
  ];

  const team = [
    { name: "Jian Brenz C. Becera", role: "Lead Developer", emoji: "👨‍💻" },
    { name: "VacanSee Team", role: "Product and Design", emoji: "🎨" },
  ];

  return (
    <div className="about-page">
      <div className="about-header" style={{ backgroundImage: `url(${cover2})` }}>
        <div className="about-header-overlay">
          <h1>About VacanSee</h1>
          <p>Your trusted platform for finding comfortable boarding houses in the Philippines.</p>
        </div>
      </div>

      <section className="about-section container">
        <div className="about-mission">
          <div className="about-mission-text">
            <h2>Our Mission</h2>
            <p>
              VacanSee was built to make finding a boarding house in the Philippines simple, transparent, and stress-free.
              Whether you are a student looking for a room near your university or a young professional relocating to a new city,
              we connect you directly with verified property owners so you can move in with confidence.
            </p>
            <p style={{ marginTop: "16px" }}>
              We believe everyone deserves a safe, comfortable place to call home — and finding one should not be complicated.
            </p>
            <Link to="/browse" className="about-cta-btn">Browse Listings</Link>
          </div>
          <div className="about-stats-column">
            <div className="about-stat"><h3>1,200+</h3><p>Happy Tenants</p></div>
            <div className="about-stat"><h3>500+</h3><p>Properties Listed</p></div>
            <div className="about-stat"><h3>50+</h3><p>Cities Covered</p></div>
            <div className="about-stat"><h3>4.9★</h3><p>Average Rating</p></div>
          </div>
        </div>
      </section>

      <section className="about-values">
        <div className="container">
          <div className="section-header">
            <h2>Why Choose VacanSee?</h2>
            <p>What sets us apart from other rental platforms</p>
          </div>
          <div className="values-grid">
            {values.map((v, i) => (
              <div key={i} className="value-card">
                <div className="value-icon">{v.icon}</div>
                <h3>{v.title}</h3>
                <p>{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="about-team container">
        <div className="section-header">
          <h2>The Team</h2>
          <p>Built with care by BSIT-3 students</p>
        </div>
        <div className="team-grid">
          {team.map((member, i) => (
            <div key={i} className="team-card">
              <div className="team-avatar">{member.emoji}</div>
              <h3>{member.name}</h3>
              <p>{member.role}</p>
            </div>
          ))}
        </div>
        <p className="about-course-note">Course: Bachelor of Science in Information Technology — 3rd Year</p>
      </section>
    </div>
  );
}

export default About;
