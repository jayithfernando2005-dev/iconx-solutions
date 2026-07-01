import React, { useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import "./tradein.css";
import { motion } from "framer-motion";
import iphoneImg from "../images/iphone.png";
import Hero from "../images/galaxy-s26-ultra.jpg";
import Watch from "../images/Series10.webp";
import airpod from "../images/airpods-4.jpg";
import macbook from "../images/MacBookProM5.webp";
import iphone from "../images/AppleiPhone17ProMax.jpg";
import ipad from "../images/AppleiPadProM5.webp";
import Serie from "../images/17PM.png";
import apple17pm from "../images/I17.jpg";
import apple17 from "../images/17.jpg";
import apple16 from "../images/16.jpg";
import apple17air from "../images/Air17.jpg";
import macBook from "../images/render_5.jpg";
import macbookair from "../images/macbookair.jpg";
import macbookpro from "../images/macbookpro.jpg";
import imac from "../images/imac.jpg";
import macmini from "../images/mac_mini.jpg";
import all from "../images/erasebg-transformed.png";
import icon from "../images/pocket-3-1.webp";
import jbl from "../images/onlyjbl.avif";
import service from "../images/ugreen.webp";
import airpodsImg from "../images/Airpods-Pro-3-Release.jpg";
import iwatch from "../images/iwatch11.jpg";

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

export default function TradeInPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("iPhone");
  const [showModal, setShowModal] = useState(false);

  const tabs = useMemo(
    () => [
      { name: "Smartphones", img: iphone },
      { name: "Tablets", img: ipad },
      { name: "MacBook", img: macbook },
      { name: "Earphones", img: airpod },
      { name: "Smartwatches", img: Watch },
    ],
    [],
  );

  const baseArrivalProducts = useMemo(
    () => [
      { name: "iPhone 17 Pro & Max", img: apple17pm },
      { name: "iPhone 17 Air", img: apple17air },
      { name: "iPhone 17", img: apple17 },
      { name: "iPhone 16", img: apple16 },
    ],
    [],
  );

  const arrivalProducts = [...baseArrivalProducts, ...baseArrivalProducts];

  const baseMacArrivalProducts = [
    { name: "Macbook Pro", img: macbookpro },
    { name: "Macbook", img: macbookair },
    { name: "iMac", img: imac },
    { name: "Mac Mini", img: macmini },
  ];

  const macArrivalProducts = [
    ...baseMacArrivalProducts,
    ...baseMacArrivalProducts,
  ];

  const categorySliderRef = useRef(null);

  const scrollCategoryCards = (direction) => {
    if (!categorySliderRef.current) return;

    const slider = categorySliderRef.current;
    const cardWidth = slider.clientWidth;

    slider.scrollBy({
      left: direction === "left" ? -cardWidth : cardWidth,
      behavior: "smooth",
    });
  };

  return (
    <>
      <Header />

      <section className="contact-cta-section full-hero">
        <motion.div
          className="contact-cta-inner"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
        >
          <img src={Hero} alt="Google Pixel Banner" className="hero-image" />
          <div className="hero-overlay-light" />
          <div className="trade-hero-text">
            <FadeUp delay={0.15}>
              <h1 className="hero-title">Samsung Galaxy S26 Ultra</h1>
            </FadeUp>

            <FadeUp delay={0.25}>
              <p className="hero-subtitle">
                Experience next-level innovation with powerful performance and
                seamless design.
              </p>
            </FadeUp>

            <FadeUp delay={0.35}>
              <button className="hero-btn">Pre-order</button>
            </FadeUp>
          </div>
        </motion.div>
      </section>

      <section className="featured-section-a">
        <div className="featured-container-a">
          <FadeUp delay={0.1}>
            <h2 className="featured-title-a">SWITCH</h2>
          </FadeUp>
        </div>
      </section>

      <div className="trade-wrap">
        <section className="trade-hero">
          <FadeUp delay={0.15}>
            <span className="trade-hero-title-small">Upgrade Your Device</span>
          </FadeUp>

          <FadeUp delay={0.25}>
            <div className="category-slider-wrap">
              <button
                className="category-arrow left"
                onClick={() => scrollCategoryCards("left")}
                aria-label="Previous category"
              ></button>

              <div className="trade-cards-section">
                <div className="trade-tabs-grid" ref={categorySliderRef}>
                  {tabs.map((t) => (
                    <div
                      key={t.name}
                      className={`trade-tab-card ${activeTab === t.name ? "active" : ""}`}
                      onClick={() => setActiveTab(t.name)}
                      role="button"
                      tabIndex={0}
                    >
                      <div className="trade-tab-icon">
                        {t.img ? (
                          <img src={t.img} alt={t.name} />
                        ) : (
                          <div className="icon-placeholder" />
                        )}
                      </div>
                      <div className="trade-tab-text">{t.name}</div>
                    </div>
                  ))}
                </div>
              </div>

              <button
                className="category-arrow right"
                onClick={() => scrollCategoryCards("right")}
                aria-label="Next category"
              >
                ›
              </button>
            </div>
          </FadeUp>
        </section>

        {activeTab === "Smartphones" && (
          <FadeUp delay={0.2}>
            <div className="offer-card">
              <div>
                <h2 className="offer-title">
                  Get offers up to <strong>Rs.65,000</strong>
                </h2>
                <table className="offer-list">
                  <thead>
                    <tr>
                      <th>Your device</th>
                      <th style={{ textAlign: "right" }}>
                        Estimated trade-in value
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>iPhone 16 Pro Max</td>
                      <td style={{ textAlign: "right", fontWeight: 700 }}>
                        Up to Rs.65,000
                      </td>
                    </tr>
                    <tr>
                      <td>iPhone 16 Pro</td>
                      <td style={{ textAlign: "right", fontWeight: 700 }}>
                        Up to Rs.50,000
                      </td>
                    </tr>
                    <tr>
                      <td>iPhone 16 Plus</td>
                      <td style={{ textAlign: "right", fontWeight: 700 }}>
                        Up to Rs.45,000
                      </td>
                    </tr>
                    <tr>
                      <td>iPhone 16</td>
                      <td style={{ textAlign: "right", fontWeight: 700 }}>
                        Up to Rs.43,500
                      </td>
                    </tr>
                  </tbody>
                </table>
                <button
                  className="trade-primary-btn big-btn"
                  onClick={() => setShowModal(true)}
                >
                  Check Switch Value
                </button>
              </div>
              <div className="offer-image">
                <img src={iphoneImg} alt="iPhone" />
              </div>
            </div>
          </FadeUp>
        )}

        <section className="section section-gray new-arrivals-section">
          <FadeUp delay={0.22}>
            <div className="new-arrivals-header">
              <h2 className="section-title">Latest Arrivals</h2>
            </div>
          </FadeUp>

          <FadeUp delay={0.3}>
            <div className="new-arrivals-layout">
              <div className="arrival-promo-card">
                <div className="arrival-promo-content">
                  <p className="arrival-small-text">iPhone 17 Series</p>
                  <h3>Discover the latest arrivals.</h3>
                  <button
                    type="button"
                    className="arrival-shop-btn"
                    onClick={() => navigate("/apple")}
                  >
                    Shop Now
                  </button>
                </div>
                <div className="arrival-promo-image">
                  <img src={Serie} alt="iPhone 17 Series" />
                </div>
              </div>

              <div className="arrival-slider-wrap iphone-slider-viewport">
                <div className="arrival-slider iphone-slider-track">
                  {arrivalProducts.map((product, index) => (
                    <div
                      className="arrival-product-card iphone-slide-card"
                      key={`${product.name}-${index}`}
                    >
                      <div className="arrival-product-image">
                        <img src={product.img} alt={product.name} />
                      </div>
                      <h4>{product.name}</h4>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </FadeUp>
        </section>

        <section className="ab2-section">
          <FadeUp delay={0.25}>
            <div className="ab2-wrapper">
              <div className="ab2-left">
                <img src={airpodsImg} alt="AirPods Pro" className="ab2-img" />
              </div>
              <div className="ab2-right">
                <h2 className="gradient-text-new">AirPods Pro 3</h2>
                <p className="ab2-desc">
                  Experience the next generation of sound. The all-new AirPods
                  Pro feature Apple's most advanced H3 chip, delivering up to 2x
                  stronger Active Noise Cancellation than ever before. With
                  Adaptive Audio that seamlessly blends your environment,
                  crystal clear voice isolation, and a custom-fit design built
                  for all day comfort and these are not just earbuds, they are a
                  statement. Up to 36 hours of total battery life, lossless
                  audio over Wi-Fi, and real-time head tracking for immersive
                  Spatial Audio. The future of listening is here.
                </p>
              </div>
            </div>
          </FadeUp>
        </section>

        <section className="accessories-banner-section-switch">
          <FadeUp delay={0.25}>
            <div className="accessories-banner-switch">
              <div className="accessories-banner-content-a">
                <h2 className="gradient-text">All Accessories</h2>
                <p>
                  Explore our curated collection of premium cases, chargers,
                  AirPods, Apple Watches, and AirTags. All hand picked to
                  complement your Apple lifestyle perfectly.
                </p>

                <div className="accessories-banner-buttons-switch">
                  <button
                    className="accessory-pill-btn-switch"
                    onClick={() => navigate("/accessories")}
                  >
                    Watches
                  </button>
                  <button
                    className="accessory-pill-btn-switch"
                    onClick={() => navigate("/accessories")}
                  >
                    AirPods
                  </button>
                  <button
                    className="accessory-pill-btn-switch"
                    onClick={() => navigate("/accessories")}
                  >
                    Airtags
                  </button>
                  <button
                    className="accessory-pill-btn-switch"
                    onClick={() => navigate("/accessories")}
                  >
                    Cases
                  </button>
                </div>
              </div>

              <div className="accessories-banner-image">
                <img src={all} alt="Apple Accessories" />
              </div>
            </div>
          </FadeUp>
        </section>

        <section className="ab3-section">
          <FadeUp delay={0.25}>
            <div className="ab3-wrapper">
              <div className="ab3-left">
                <img src={iwatch} alt="AirPods Pro" className="ab3-img" />
              </div>
              <div className="ab3-right">
                <h2 className="gradient-text-new3">Apple Watch Series 11</h2>
                <p className="ab3-desc">
                  Introducing Apple Watch Series 11 the most advanced Apple
                  Watch ever made. With a redesigned Always on Retina display,
                  next-generation health sensors including blood glucose
                  monitoring, and a titanium build that's both lighter and
                  stronger than before. Track your sleep, heart, and fitness
                  with unmatched precision. Up to 36 hours of battery life,
                  crash detection, and emergency SOS. Because your health
                  deserves nothing less than the best.
                </p>
              </div>
            </div>
          </FadeUp>
        </section>

        <section className="section section-gray new-arrivals-section mac-arrivals-section">
          <FadeUp delay={0.22}>
            <div className="new-arrivals-header">
              <h2 className="section-title">Mac Arrivals</h2>
            </div>
          </FadeUp>

          <FadeUp delay={0.3}>
            <div className="new-arrivals-layout right-promo-layout">
              <div className="arrival-slider-wrap mac-slider-viewport">
                <div className="arrival-slider mac-slider-track">
                  {macArrivalProducts.map((product, index) => (
                    <div
                      className="arrival-product-card mac-slide-card"
                      key={`${product.name}-${index}`}
                    >
                      <div className="arrival-product-image-a">
                        <img src={product.img} alt={product.name} />
                      </div>
                      <h4>{product.name}</h4>
                    </div>
                  ))}
                </div>
              </div>

              <div className="arrival-promo-card mac-promo-card">
                <div className="arrival-promo-content">
                  <p className="arrival-small-text">Mac Series</p>
                  <h3>Discover the latest arrivals.</h3>
                  <button
                    type="button"
                    className="arrival-shop-btn"
                    onClick={() => navigate("/apple")}
                  >
                    Shop Now
                  </button>
                </div>
                <div className="arrival-promo-image">
                  <img src={macBook} alt="Mac Series" />
                </div>
              </div>
            </div>
          </FadeUp>
        </section>

        <section className="trade-end-cards-section">
          <div className="trade-end-cards-grid">
            <FadeUp delay={0.18}>
              <div className="hover-card">
                <img src={service} alt="Service Center" />
                <div className="hover-card-content">
                  <h3>Accessories</h3>
                  <button onClick={() => navigate("/accessories")}>
                    Explore
                  </button>
                </div>
              </div>
            </FadeUp>

            <FadeUp delay={0.26}>
              <div className="hover-card">
                <img src={jbl} alt="Speakers" />
                <div className="hover-card-content">
                  <h3>Speakers</h3>
                  <button onClick={() => navigate("/products/list")}>
                    Explore
                  </button>
                </div>
              </div>
            </FadeUp>

            <FadeUp delay={0.34}>
              <div className="hover-card">
                <img src={icon} alt="Our Stores" />
                <div className="hover-card-content">
                  <h3>Camera</h3>
                  <button onClick={() => navigate("/about")}>Explore</button>
                </div>
              </div>
            </FadeUp>
          </div>
        </section>

        {showModal && (
          <div className="modal-overlay" onClick={() => setShowModal(false)}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <button
                  className="modal-close"
                  onClick={() => setShowModal(false)}
                >
                  ✕
                </button>
              </div>

              <div className="modal-body">
                <h2>Select your device type</h2>

                <div
                  className="device-option"
                  onClick={() => {
                    setShowModal(false);
                    navigate("/trade-in/calculate");
                  }}
                >
                  <div className="device-left">
                    <span className="device-name">Smartphone</span>
                  </div>
                  <span className="device-up-to">Up to Rs.65,000</span>
                </div>

                <div className="device-option">
                  <div className="device-left">
                    <span className="device-name">Tablet</span>
                  </div>
                  <span className="device-up-to">Up to Rs.67,000</span>
                </div>

                <div className="device-option">
                  <div className="device-left">
                    <span className="device-name">Computer</span>
                  </div>
                  <span className="device-up-to">Up to Rs.20,900</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <Footer />
    </>
  );
}
