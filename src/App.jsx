import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useState, useEffect } from "react";

import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import ChatBox from "./components/ChatBox";

import Home from "./pages/Home";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Browse from "./pages/Browse";
import Search from "./pages/Search";
import Saved from "./pages/Saved";
import Messages from "./pages/Messages";
import Conversations from "./pages/Conversations";
import Profile from "./pages/Profile";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import AdminDashboard from "./pages/AdminDashboard";
import ListingDetails from "./pages/ListingDetails";

import { loadPropertiesFromBackend } from "./data/appData";

import "./App.css";

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAdmin, setIsAdmin]       = useState(false);

  useEffect(() => {
    // Restore login state
    if (localStorage.getItem("isLoggedIn") === "true") {
      setIsLoggedIn(true);
      const role = localStorage.getItem("userRole");
      setIsAdmin(role === "admin" || role === "landlord");
    }

    // Load real property IDs from backend into localStorage cache.
    // This makes booking and messaging work with real DB IDs.
    loadPropertiesFromBackend();
  }, []);

  const handleSetLoggedIn = (val) => {
    setIsLoggedIn(val);
    const role = localStorage.getItem("userRole");
    setIsAdmin(val && (role === "admin" || role === "landlord"));
  };

  return (
    <Router>
      <Navbar isLoggedIn={isLoggedIn} setIsLoggedIn={handleSetLoggedIn} isAdmin={isAdmin} />
      <Routes>
        <Route path="/"            element={<Home />} />
        <Route path="/about"       element={<About />} />
        <Route path="/contact"     element={<Contact />} />
        <Route path="/browse"      element={<Browse />} />
        <Route path="/search"      element={<Search />} />
        <Route path="/saved"       element={<Saved />} />
        <Route path="/login"       element={<Login setIsLoggedIn={handleSetLoggedIn} />} />
        <Route path="/register"    element={<Register setIsLoggedIn={handleSetLoggedIn} />} />
        <Route path="/dashboard"   element={isLoggedIn && !isAdmin ? <Dashboard /> : <Navigate to={isAdmin ? "/admin" : "/login"} />} />
        <Route path="/admin"       element={isAdmin ? <AdminDashboard /> : <Navigate to="/login" />} />
        <Route path="/messages"    element={isLoggedIn ? <Messages />    : <Navigate to="/login" />} />
        <Route path="/conversations" element={isLoggedIn ? <Conversations /> : <Navigate to="/login" />} />
        <Route path="/profile"     element={isLoggedIn ? <Profile />     : <Navigate to="/login" />} />
        <Route path="/listing/:id" element={<ListingDetails isLoggedIn={isLoggedIn} />} />
        <Route path="/menu"        element={<Navigate to="/" />} />
      </Routes>
      <Footer />
      <ChatBox />
    </Router>
  );
}

export default App;
