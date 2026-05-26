import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useState, useEffect } from "react";

import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import ChatBox from "./components/ChatBox";

import Home from "./pages/Home";
import About from "./pages/About";
import Browse from "./pages/Browse";
import Profile from "./pages/Profile";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import AdminDashboard from "./pages/AdminDashboard";
import OwnerDashboard from "./pages/OwnerDashboard";
import ListingDetails from "./pages/ListingDetails";

import { loadPropertiesFromBackend } from "./data/appData";

import "./App.css";

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(localStorage.getItem("isLoggedIn") === "true");
  const [isAdmin, setIsAdmin]       = useState(localStorage.getItem("userRole") === "ADMIN");
  const [isOwner, setIsOwner]       = useState(localStorage.getItem("userRole") === "OWNER");

  const syncRoles = () => {
    const role = localStorage.getItem("userRole");
    setIsAdmin(role === "ADMIN");
    setIsOwner(role === "OWNER");
  };

  useEffect(() => {
    // Migrate stale lowercase roles written by the old auth system
    const storedRole = localStorage.getItem("userRole");
    if (storedRole === "admin") localStorage.setItem("userRole", "ADMIN");
    if (storedRole === "user")  localStorage.setItem("userRole", "TENANT");

    if (localStorage.getItem("isLoggedIn") === "true") {
      setIsLoggedIn(true);
      syncRoles();
    }
    // Evict any stale mock listings (ids 1-6 with no ownerName) left from an older build.
    const cached = JSON.parse(localStorage.getItem("vs_properties") || "[]");
    const looksLikeMock = cached.length > 0 && cached.every((p) => !p.ownerName && Number(p.id) <= 6);
    if (looksLikeMock) localStorage.removeItem("vs_properties");

    // Strip any base64 images already sitting in localStorage caches to reclaim quota.
    ["vs_properties", "vs_admin_listings", "vs_owner_listings"].forEach((key) => {
      try {
        const items = JSON.parse(localStorage.getItem(key) || "[]");
        if (items.some((p) => p.featuredImage)) {
          localStorage.setItem(key, JSON.stringify(items.map((p) => ({ ...p, featuredImage: null }))));
        }
      } catch {}
    });

    // Load real listings from backend into localStorage cache.
    loadPropertiesFromBackend();
  }, []);

  const handleSetLoggedIn = (val) => {
    setIsLoggedIn(val);
    if (val) syncRoles();
    else { setIsAdmin(false); setIsOwner(false); }
  };

  return (
    <Router>
      <Navbar isLoggedIn={isLoggedIn} setIsLoggedIn={handleSetLoggedIn} isAdmin={isAdmin} isOwner={isOwner} />
      <Routes>
        <Route path="/"            element={<Home />} />
        <Route path="/about"       element={<About />} />
        <Route path="/browse"      element={<Browse />} />
        <Route path="/login"       element={<Login setIsLoggedIn={handleSetLoggedIn} />} />
        <Route path="/register"    element={<Register setIsLoggedIn={handleSetLoggedIn} />} />

        {/* TENANT dashboard — redirect admins and owners away */}
        <Route path="/dashboard"
          element={
            isLoggedIn && !isAdmin && !isOwner
              ? <Dashboard />
              : <Navigate to={isAdmin ? "/admin" : isOwner ? "/owner-dashboard" : "/login"} />
          }
        />

        {/* ADMIN dashboard */}
        <Route path="/admin"
          element={isAdmin ? <AdminDashboard /> : <Navigate to="/login" />}
        />

        {/* OWNER dashboard */}
        <Route path="/owner-dashboard"
          element={isOwner ? <OwnerDashboard /> : <Navigate to="/login" />}
        />

        <Route path="/profile"       element={isLoggedIn ? <Profile />       : <Navigate to="/login" />} />
        <Route path="/listing/:id"   element={<ListingDetails isLoggedIn={isLoggedIn} />} />
        <Route path="/menu"          element={<Navigate to="/" />} />
      </Routes>
      <Footer />
      <ChatBox />
    </Router>
  );
}

export default App;
