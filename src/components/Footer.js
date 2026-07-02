import React from "react";
import { Link } from "react-router-dom";
import "./Footer.css";
import { FaFacebook, FaInstagram, FaTwitter, FaWhatsapp } from "react-icons/fa";
import iconxLogo from "../images/logo.png";
import axonLogo from "../images/erasebg-transformed (1).png"; // adjust path/filename to match your file

const IconXLogo = () => (
  <div className="footer-logo-wrap" aria-label="IconX Mobile Store">
    <img src={iconxLogo} alt="IconX logo" className="footer-logo-image" />
  </div>
);

const Footer = () => {
  return (
    <footer className="footer">

      {/* ── Brand Column ── */}
      <div>
        <div className="footer-logo">
          <IconXLogo />
        </div>

        <p className="footer-description">
          Experience the future of mobile technology with IconX. From flagship smartphones to essential accessories. We combine quality products & exceptional service to deliver an outstanding customer experience.
        </p>

        <p className="footer-social-label">Follow us</p>
        <div className="social-icons">
          <a href="https://wa.me/94777181818" aria-label="WhatsApp" target="_blank" rel="noreferrer"><FaWhatsapp /></a>
          <a href="https://www.facebook.com/" aria-label="Facebook"  target="_blank" rel="noreferrer"><FaFacebook /></a>
          <a href="https://www.instagram.com/" aria-label="Instagram" target="_blank" rel="noreferrer"><FaInstagram /></a>
          <a href="https://twitter.com/" aria-label="Twitter"   target="_blank" rel="noreferrer"><FaTwitter /></a>
        </div>
      </div>

      {/* ── Quick Navigation ── */}
      <div className="footer-section">
        <h4>Quick Navigation</h4>
        <ul>
          <li><Link to="/home">Discover</Link></li>
          <li><Link to="/products">Collection</Link></li>
          <li><Link to="/trade-in">Switch</Link></li>
          <li><Link to="/contact">Support</Link></li>
          <li><Link to="/about">Company</Link></li>
        </ul>
      </div>

      {/* ── Categories ── */}
      <div className="footer-section">
        <h4>Categories</h4>
        <ul>
          <li><a href="/apple">Apple</a></li>
          <li><a href="/samsung">Samsung</a></li>
          <li><a href="/pixel">Pixel</a></li>
          <li><a href="/oneplus">One Plus</a></li>
          <li><a href="/redmi">Redmi</a></li>
        </ul>
      </div>

      {/* ── Contact + Map ── */}
      <div className="footer-section">
        <h4>Contact Us</h4>
        <div className="footer-contact">

          <div className="footer-contact-item">
            <span className="footer-contact-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0118 0z"/>
                <circle cx="12" cy="10" r="3"/>
              </svg>
            </span>
            <span>958 Galle Rd, Kalutara 12000</span>
          </div>

          <div className="footer-contact-item">
            <span className="footer-contact-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                <polyline points="22,6 12,13 2,6"/>
              </svg>
            </span>
            <a href="mailto:info@iconx.lk">Info@Iconx.LK</a>
          </div>

          <div className="footer-contact-item">
            <span className="footer-contact-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.8 19.79 19.79 0 01.11 1.19 2 2 0 012.11 1h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 8.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/>
              </svg>
            </span>
            <a href="tel:+94777181818">077 718 1818</a>
          </div>

        </div>

        <div className="footer-map">
          <iframe
            title="IconX Location"
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d63310.123456789!2d79.955!3d6.583!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3ae2f123456789ab%3A0xabcdef123456789!2s958%20Galle%20Rd%2C%20Kalutara%2012000!5e0!3m2!1sen!2slk!4v1700000000000!5m2!1sen!2slk"
            width="100%"
            height="180"
            style={{ border: 0 }}
            allowFullScreen=""
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
      </div>

      {/* ── Bottom Bar ── */}
     <div className="footer-bottom">
  <span>All Rights Reserved ©  <span className="footer-bottom-sep">|</span> 
  <span className="footer-bottom-credit">
    Designed & Developed by <img
      src={axonLogo}
      alt="Axon"
      className="footer-bottom-axon-logo"
    />
  </span>
  </span>
</div>

    </footer>
  );
};

export default Footer;