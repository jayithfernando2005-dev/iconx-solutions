import React, { useState } from "react";
import { motion } from "framer-motion";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination } from "swiper/modules";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/navigation";
import Header from "../components/Header.js";
import Footer from "../components/Footer.js";
import { db } from "../firebase";
import "./Contact.css";
import contact from "../images/Texas.jpg";

const FadeUp = ({ children, delay = 0, className = "" }) => (
  <motion.div
    initial={{ opacity: 0, y: 60, scale: 0.97 }}
    whileInView={{ opacity: 1, y: 0, scale: 1 }}
    viewport={{ once: true, margin: "-40px" }}
    transition={{
      duration: 0.85,
      delay,
      ease: [0.22, 1, 0.36, 1],
    }}
    className={className}
  >
    {children}
  </motion.div>
);

const TESTIMONIALS = [
  {
    name: "Kasun Perera",
    role: "Business Owner",
    quote:
      "Bought my iPhone 16 Pro Max here. The staff were incredibly knowledgeable and the price was better than Colombo.",
    stars: 5,
    avatar: "KP",
  },
  {
    name: "Dilini Fernando",
    role: "University Student",
    quote:
      "The trade-in deal I got for my old phone was amazing. Got a brand new iPad for almost nothing after the exchange!",
    stars: 5,
    avatar: "DF",
  },
  {
    name: "Roshan Silva",
    role: "Photographer",
    quote:
      "Genuine Apple products, fast service, and they even helped me transfer all my data. This is how buying Apple should feel.",
    stars: 5,
    avatar: "RS",
  },
  {
    name: "Amaya Bandara",
    role: "Teacher",
    quote:
      "The finance plan made it so easy to afford a MacBook. The team walked me through everything patiently.",
    stars: 5,
    avatar: "AB",
  },
  {
    name: "Tharaka Jayawardena",
    role: "Software Engineer",
    quote:
      "Ordered online, got it same day. The packaging was perfect and the product was 100% genuine. Perfect experience!",
    stars: 5,
    avatar: "TJ",
  },
];

const ContactForm = () => {
  const [form, setForm] = useState({
    name: "",
    phone: "",
    subject: "",
    message: "",
  });

  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const blockExtraDigits = (e, value, maxLength) => {
    const allowedKeys = [
      "Backspace",
      "Delete",
      "ArrowLeft",
      "ArrowRight",
      "ArrowUp",
      "ArrowDown",
      "Tab",
      "Home",
      "End",
    ];

    if (allowedKeys.includes(e.key) || e.ctrlKey || e.metaKey) return;

    if (!/^[0-9]$/.test(e.key)) {
      e.preventDefault();
      return;
    }

    if (value.length >= maxLength) {
      e.preventDefault();
    }
  };

  const validateForm = () => {
    const nameRegex = /^[A-Za-z\s]+$/;

    if (!form.name.trim()) {
      return "Full name is required.";
    }

    if (!nameRegex.test(form.name.trim())) {
      return "Full name should contain only letters.";
    }

    if (!form.phone.trim()) {
      return "Phone number is required.";
    }

    if (!/^\d{10}$/.test(form.phone)) {
      return "Phone number must be exactly 10 digits.";
    }

    if (!(form.phone.startsWith("07") || form.phone.startsWith("94"))) {
      return "Phone number must start with 07 or 94.";
    }

    if (!form.subject.trim()) {
      return "Subject is required.";
    }

    if (form.subject.trim().length < 3) {
      return "Subject must be at least 3 characters long.";
    }

    if (!form.message.trim()) {
      return "Message is required.";
    }

    if (form.message.trim().length < 10) {
      return "Message must be at least 10 characters long.";
    }

    return "";
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "phone") {
      const onlyNumbers = value.replace(/\D/g, "").slice(0, 10);
      setForm({ ...form, phone: onlyNumbers });
      return;
    }

    setForm({ ...form, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const validationError = validateForm();

    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    setError("");

    try {
      await addDoc(collection(db, "customerReviews"), {
        name: form.name.trim(),
        phone: form.phone.trim(),
        subject: form.subject.trim(),
        message: form.message.trim(),
        status: "new",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      setSent(true);
      setForm({ name: "", phone: "", subject: "", message: "" });
    } catch (err) {
      console.error("Contact form save failed:", err);
      setError("We couldn't send your message right now. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <motion.div
        className="form-success"
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6 }}
      >
        <div className="success-icon">✓</div>
        <h3>Message Received!</h3>
        <p>
          We'll get back to you within 24 hours. You can also reach us instantly
          on WhatsApp.
        </p>
        <a href="https://wa.me/94777181818" className="btn-primary">
          Continue on WhatsApp →
        </a>
      </motion.div>
    );
  }

  return (
    <form className="contact-form" onSubmit={handleSubmit} noValidate>
      <div className="form-row">
        <div className="form-group">
          <label htmlFor="name">Full Name</label>
          <input
            id="name"
            name="name"
            type="text"
            placeholder="Kasun Perera"
            value={form.name}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="phone">Phone Number</label>
          <input
            id="phone"
            name="phone"
            type="text"
            inputMode="numeric"
            maxLength={10}
            placeholder="077 XXX XXXX"
            value={form.phone}
            onKeyDown={(e) => blockExtraDigits(e, form.phone, 10)}
            onPaste={(e) => {
              e.preventDefault();
              const pasted = e.clipboardData
                .getData("text")
                .replace(/\D/g, "")
                .slice(0, 10);

              setForm({ ...form, phone: pasted });
            }}
            onChange={handleChange}
            required
          />
        </div>
      </div>

      <div className="form-group">
        <label htmlFor="subject">Subject</label>
        <input
          id="subject"
          name="subject"
          type="text"
          placeholder="What can we help you with?"
          value={form.subject}
          onChange={handleChange}
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="message">Message</label>
        <textarea
          id="message"
          name="message"
          rows={5}
          placeholder="Tell us what you're looking for…"
          value={form.message}
          onChange={handleChange}
          required
        />
      </div>

      {error && (
        <p style={{ color: "#b91c1c", marginTop: "-4px", marginBottom: "12px" }}>
          {error}
        </p>
      )}

      <motion.button
        type="submit"
        className="btn-submit"
        disabled={loading}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        {loading ? (
          <span className="btn-loading">
            <span className="spinner" />
            Sending…
          </span>
        ) : (
          "Send Message"
        )}
      </motion.button>
    </form>
  );
};

const Contact = () => (
  <div className="contact-page">
    <Header />

    <section className="contact-cta-section full-hero">
      <motion.div
        className="contact-cta-inner"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
      >
        <img src={contact} alt="Google Pixel Banner" className="hero-image" />
        <div className="hero-overlay-light" />

        <div className="hero-content">
          <FadeUp delay={0.15}>
            <h2 className="hero-title">Where Innovation Meets Experience</h2>
          </FadeUp>

          <FadeUp delay={0.25}>
            <p className="hero-subtitle">
              Experience the future of Android with cutting-edge performance.
            </p>
          </FadeUp>

          <FadeUp delay={0.35}>
            <div className="hero-actions">
              <a href="tel:0777181818" className="btn-submit-a">
                Call Now
              </a>
            </div>
          </FadeUp>
        </div>
      </motion.div>
    </section>

    <section className="featured-section">
      <div className="featured-container">
        <FadeUp delay={0.1}>
          <h2 className="featured-title-contact">CONTACT US</h2>
        </FadeUp>
      </div>
    </section>

    <section className="contact-wrapper">
      <div className="container">
        <div className="contact-combined-box">
          <div className="contact-left">
            <FadeUp delay={0.15}>
              <h2 className="gradient-text">Contact Us</h2>
            </FadeUp>

            <FadeUp delay={0.22}>
              <p className="section-sub">
                Fill in the form and we'll get back to you within 24 hours.
              </p>
            </FadeUp>

            <FadeUp delay={0.3}>
              <ContactForm />
            </FadeUp>
          </div>

          <div className="contact-divider"></div>

          <div className="contact-right">
            <FadeUp delay={0.2}>
              <h2 className="gradient-text">Visit Our Store</h2>
            </FadeUp>

            <FadeUp delay={0.28}>
              <p className="section-sub">
                Everything you need to know before visiting our store.
              </p>
            </FadeUp>

            <FadeUp delay={0.36}>
              <h3 className="hours-title">Hours of Operation</h3>
            </FadeUp>

            <FadeUp delay={0.44}>
              <div className="store-hours-list">
                {[
                  "Monday",
                  "Tuesday",
                  "Wednesday",
                  "Thursday",
                  "Friday",
                  "Saturday",
                  "Sunday",
                ].map((day) => (
                  <div key={day} className="store-hours-row">
                    <span>{day}</span>
                    <span>10.00 AM – 7.30 PM</span>
                  </div>
                ))}
              </div>
            </FadeUp>
          </div>
        </div>
      </div>
    </section>

    <section className="divider-section">
      <FadeUp delay={0.5} className="map-side">
        <div className="map-embed-wrap">
          <iframe
            title="IconX Location"
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d63371.59883073927!2d79.9575!3d6.5854!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3ae226c3a3b1cd5f%3A0xb0a21ff6b0e1c08e!2sKalutara%2C%20Sri%20Lanka!5e0!3m2!1sen!2slk!4v1700000000000"
            width="100%"
            height="100%"
            style={{ border: 0, borderRadius: "16px" }}
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
      </FadeUp>
    </section>

    <section className="testimonials-section">
      <div className="container testimonials-container">
        <FadeUp delay={0.6}>
          <div className="section-label-a">Customer Reviews</div>
          <h2 className="gradient-text">
            Your Satisfaction, <span className="accent">Our Reputation</span>
          </h2>
        </FadeUp>

        <FadeUp delay={0.7}>
          <Swiper
            modules={[Autoplay, Pagination]}
            pagination={{ clickable: true }}
            autoplay={{ delay: 4500, disableOnInteraction: false }}
            spaceBetween={24}
            breakpoints={{
              0: { slidesPerView: 1 },
              768: { slidesPerView: 2 },
              1100: { slidesPerView: 3 },
            }}
            className="testimonials-swiper"
          >
            {TESTIMONIALS.map((t, i) => (
              <SwiperSlide key={i}>
                <div className="testimonial-card">
                  <div className="t-stars">{"★".repeat(t.stars)}</div>
                  <blockquote>"{t.quote}"</blockquote>
                  <div className="t-author">
                    <div className="t-avatar">{t.avatar}</div>
                    <div>
                      <div className="t-name">{t.name}</div>
                      <div className="t-role">{t.role}</div>
                    </div>
                  </div>
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
        </FadeUp>
      </div>
    </section>

    <Footer />
  </div>
);

export default Contact;