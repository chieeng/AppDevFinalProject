import { useState } from "react";
import cover3 from "../images/cover-3.png";

// Contact page - simple inquiry form + contact info
// No external service needed, just validates and shows success
function Contact() {
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = () => {
    if (!form.name || !form.email || !form.message) {
      setError("Please fill in Name, Email, and Message.");
      return;
    }
    setError("");
    setSubmitted(true);
    setForm({ name: "", email: "", subject: "", message: "" });
    setTimeout(() => setSubmitted(false), 4000);
  };

  const contactInfo = [
    { icon: "📍", label: "Address", value: "123 Session Road, Baguio City, Philippines" },
    { icon: "📞", label: "Phone", value: "+63 912 345 6789" },
    { icon: "✉️", label: "Email", value: "support@vacansee.com" },
    { icon: "🕒", label: "Hours", value: "Mon–Fri 9AM–6PM, Sat 10AM–4PM" },
  ];

  return (
    <div className="contact-page">

      {/* HEADER */}
      <div className="contact-page-header" style={{ backgroundImage: `url(${cover3})` }}>
        <div className="contact-header-overlay">
          <h1>Get in Touch</h1>
          <p>Have a question? We would love to hear from you.</p>
        </div>
      </div>

      <div className="container contact-body">

        {/* LEFT - contact info */}
        <div className="contact-info-panel">
          <h2>Contact Information</h2>
          <p>Reach out to our team and we will get back to you within 24 hours.</p>

          <div className="contact-info-list">
            {contactInfo.map((item, i) => (
              <div key={i} className="contact-info-item">
                <div className="ci-icon">{item.icon}</div>
                <div>
                  <div className="ci-label">{item.label}</div>
                  <div className="ci-value">{item.value}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT - form */}
        <div className="contact-form-panel">
          <h2>Send a Message</h2>

          {submitted && (
            <div className="contact-success">
              ✅ Thank you! Your message has been received. We will get back to you soon.
            </div>
          )}

          {error && <div className="error-message">{error}</div>}

          <div className="contact-form-grid">
            <div className="form-group">
              <label>Your Name *</label>
              <input name="name" type="text" placeholder="Juan dela Cruz" value={form.name} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label>Email Address *</label>
              <input name="email" type="email" placeholder="juan@email.com" value={form.email} onChange={handleChange} />
            </div>
          </div>

          <div className="form-group">
            <label>Subject</label>
            <input name="subject" type="text" placeholder="What is this about?" value={form.subject} onChange={handleChange} />
          </div>

          <div className="form-group">
            <label>Message *</label>
            <textarea name="message" placeholder="Write your message here..." rows={5} value={form.message} onChange={handleChange} />
          </div>

          <button className="btn-continue" onClick={handleSubmit}>
            Send Message
          </button>
        </div>

      </div>
    </div>
  );
}

export default Contact;
