import { Link, useNavigate } from "react-router-dom";
import cover1 from "../images/cover-1.png";

// Menu page - the main navigation hub after login
// isLoggedIn is passed from App so we can warn users about protected pages
function Menu({ isLoggedIn }) {
  const navigate = useNavigate();

  const menuItems = [
    {
      id: 1,
      title: "Browse Listings",
      description: "Explore all available boarding houses across the Philippines",
      icon: "🏠",
      link: "/browse",
      color: "#14b8a6",
      requiresLogin: false,  // Anyone can browse
    },
    {
      id: 2,
      title: "Conversations",
      description: "View your message history with property owners",
      icon: "💬",
      link: "/conversations",
      color: "#3b82f6",
      requiresLogin: true,   // Must be logged in to see messages
    },
    {
      id: 3,
      title: "About",
      description: "Learn more about VacanSee and our mission",
      icon: "ℹ️",
      link: "/about",
      color: "#06b6d4",
      requiresLogin: false,
    },
    {
      id: 4,
      title: "Dashboard",
      description: "View your bookings and account statistics",
      icon: "📊",
      link: "/dashboard",
      color: "#0891b2",
      requiresLogin: true,   // Must be logged in to see dashboard
    },
  ];

  // Handle clicking a menu item that requires login
  const handleMenuClick = (e, item) => {
    if (item.requiresLogin && !isLoggedIn) {
      e.preventDefault(); // Stop navigation
      alert(`You must be logged in to access "${item.title}". Please login first.`);
      navigate("/login");
    }
  };

  return (
    <div className="menu-page" style={{ backgroundImage: `url(${cover1})` }}>
      <div className="menu-hero">
        <p>Manage your boarding house search with ease</p>
      </div>

      <div className="container">
        <div className="menu-grid">
          {menuItems.map((item) => (
            <Link
              key={item.id}
              to={item.link}
              className="menu-card"
              style={{ borderTopColor: item.color }}
              onClick={(e) => handleMenuClick(e, item)}
            >
              <div className="menu-icon">{item.icon}</div>
              <h3>{item.title}</h3>
              <p>{item.description}</p>
              {/* Show a lock icon if login is required and user is not logged in */}
              {item.requiresLogin && !isLoggedIn && (
                <span style={{ fontSize: "12px", color: "#999", display: "block", marginTop: "5px" }}>
                  🔒 Login required
                </span>
              )}
              <span className="menu-arrow">→</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Menu;