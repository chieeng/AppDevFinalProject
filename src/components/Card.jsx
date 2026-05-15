import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { toggleSaved, getSavedIds } from "../data/adminData";
import listing1 from "../images/listing-1.jpg";
import listing2 from "../images/listing-2.jpg";
import listing3 from "../images/listing-3.png";

function Card({ id, title, location, price, bedrooms, bathrooms, propertyType, status, featuredImage }) {
  const navigate = useNavigate();
  const [isSaved, setIsSaved] = useState(() => getSavedIds().includes(id));

  const imgs = [listing1, listing2, listing3];
  const img  = featuredImage || imgs[parseInt(String(id).slice(-1)) % imgs.length];
  const isAvailable = !status || status === "available";

  const handleSave = (e) => {
    e.stopPropagation();
    setIsSaved(toggleSaved(id).includes(id));
  };

  return (
    <div className="card" onClick={() => navigate(`/listing/${id}`)}>

      {/*
        IMAGE SECTION — all positioning done inline to avoid ANY CSS override.
        position:relative + overflow:hidden here, not on .card, so the badges
        are clipped to the image box and the heart cannot escape upward.
      */}
      <div style={{
        position: "relative",
        width: "100%",
        height: "190px",
        overflow: "hidden",
        display: "block",
        flexShrink: 0,
      }}>
        {/* Photo */}
        <img
          src={img}
          alt={title}
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            objectPosition: "center",
            display: "block",
          }}
        />

        {/* Bottom gradient */}
        <div style={{
          position: "absolute",
          inset: 0,
          background: "linear-gradient(180deg, transparent 55%, rgba(0,0,0,0.28) 100%)",
          pointerEvents: "none",
        }} />

        {/* ❤️ Heart — top LEFT */}
        <button
          onClick={handleSave}
          title={isSaved ? "Remove from saved" : "Save"}
          style={{
            position: "absolute",
            top: "8px",
            left: "8px",
            zIndex: 10,
            width: "26px",
            height: "26px",
            borderRadius: "50%",
            background: isSaved ? "#fff0f0" : "rgba(255,255,255,0.92)",
            border: "none",
            cursor: "pointer",
            fontSize: "13px",
            lineHeight: "26px",
            textAlign: "center",
            padding: 0,
            boxShadow: "0 1px 4px rgba(0,0,0,0.25)",
          }}
        >
          {isSaved ? "❤️" : "🤍"}
        </button>

        {/* Availability — top RIGHT */}
        <span style={{
          position: "absolute",
          top: "8px",
          right: "8px",
          zIndex: 10,
          padding: "3px 8px",
          borderRadius: "999px",
          fontSize: "11px",
          fontWeight: 700,
          background: isAvailable ? "rgba(5,150,105,0.88)" : "rgba(220,38,38,0.85)",
          color: "#fff",
        }}>
          ● {isAvailable ? "Available" : "Occupied"}
        </span>

        {/* Type badge — bottom LEFT */}
        {propertyType && (
          <span style={{
            position: "absolute",
            bottom: "8px",
            left: "8px",
            zIndex: 10,
            background: "rgba(0,0,0,0.55)",
            color: "#fff",
            fontSize: "11px",
            fontWeight: 700,
            padding: "3px 8px",
            borderRadius: "999px",
          }}>
            {propertyType}
          </span>
        )}
      </div>

      {/* TEXT */}
      <div className="card-content">
        <h3>{title}</h3>
        <p className="location">{location}</p>
        {(bedrooms || bathrooms) && (
          <div className="card-stats">
            {bedrooms  && <span>🛏 {bedrooms} bed</span>}
            {bathrooms && <span>🚿 {bathrooms} bath</span>}
          </div>
        )}
        <p className="price">
          ₱{price ? price.toLocaleString() : "0"}
          <span>/mo</span>
        </p>
        <button
          className="card-btn"
          onClick={(e) => { e.stopPropagation(); navigate(`/listing/${id}`); }}
        >
          View Details →
        </button>
      </div>

    </div>
  );
}

export default Card;
