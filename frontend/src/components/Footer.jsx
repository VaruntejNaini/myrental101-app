// src/components/Footer.jsx
import React, { useState } from "react";
import "./Footer.css";

const footerColumns = [
  {
    heading: "Company",
    links: ["Careers", "Press & News", "Our Vision", "Blog"],
  },
  {
    heading: "Explore",
    links: ["Office Spaces", "Short-term Stays", "Marketplace", "New Listings"],
  },
  {
    heading: "Support",
    links: ["Safety Center", "Community Forum", "Cancellation Policy", "Help Center"],
  },
  {
    heading: "Legal",
    links: ["Privacy Policy", "Accessibility", "Licenses", "Terms of Service"],
  },
];

const languages = ["English (US)", "Hindi", "Telugu", "Tamil", "Kannada"];
const currencies = ["$ USD", "₹ INR", "€ EUR", "£ GBP"];

export default function Footer({ brand = "Rentit" }) {
  const [lang, setLang] = useState("English (US)");
  const [currency, setCurrency] = useState("$ USD");

  return (
    <footer className="footer-v2">
      {/* Link columns */}
      <div className="footer-v2__columns">
        {footerColumns.map((col) => (
          <div key={col.heading} className="footer-v2__col">
            <h4 className="footer-v2__col-heading">{col.heading}</h4>
            <ul className="footer-v2__col-list">
              {col.links.map((link) => (
                <li key={link}>
                  <a href="#" className="footer-v2__col-link">{link}</a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Centered Brand */}
      <div className="footer-v2__brand-center">
        <div className="footer-v2__logo-wrap">
          <div className="footer-v2__logo-icon">R</div>
          <span className="footer-v2__logo-name">{brand}</span>
        </div>
      </div>

      {/* Language & Currency Selectors */}
      <div className="footer-v2__selectors">
        <div className="footer-v2__select-wrap">
          <span className="footer-v2__select-icon">🌐</span>
          <select
            value={lang}
            onChange={(e) => setLang(e.target.value)}
            className="footer-v2__select"
            aria-label="Language"
          >
            {languages.map((l) => (
              <option key={l} value={l}>{l}</option>
            ))}
          </select>
          <span className="footer-v2__chevron">▾</span>
        </div>
        <div className="footer-v2__select-wrap">
          <span className="footer-v2__select-icon">$</span>
          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            className="footer-v2__select"
            aria-label="Currency"
          >
            {currencies.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <span className="footer-v2__chevron">▾</span>
        </div>
      </div>

      {/* Divider */}
      <div className="footer-v2__divider" />

      {/* Bottom bar */}
      <div className="footer-v2__bottom">
        <div className="footer-v2__legal-links">
          <a href="#" className="footer-v2__legal-link">Privacy Policy</a>
          <span className="footer-v2__dot">•</span>
          <a href="#" className="footer-v2__legal-link">Terms of Service</a>
          <span className="footer-v2__dot">•</span>
          <a href="#" className="footer-v2__legal-link">Sitemap</a>
        </div>
        <p className="footer-v2__copyright">
          © {new Date().getFullYear()} {brand} Technologies Inc. • Crafted for modern living.
        </p>
      </div>
    </footer>
  );
}
