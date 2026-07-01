import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import appleImg from "../images/seventeen.jpg";
import androidImg from "../images/galaxy-s26-features-kv.jpg";
import audioImg from "../images/Sony.webp";
import accessoriesImg from "../images/osmo.avif";
import "./ProductCategories.css";
import { motion } from "framer-motion";

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

const categoryCards = [
  {
    id: "apple",
    title: "Apple",
    subtitle: "iPhone, iPad & Mac",
    count: "124 products",
    image: appleImg,
    heroTagline: "Crafted for those who demand the best.",
    path: "/products/list?segment=apple",
  },
  {
    id: "android",
    title: "Android",
    subtitle: "Samsung, Xiaomi & more",
    count: "98 products",
    image: androidImg,
    heroTagline: "Unleash what Android is truly capable of.",
    path: "/products/list?segment=android",
  },
  {
    id: "audio-speakers",
    title: "Audio",
    subtitle: "Speakers, headphones & earbuds",
    count: "68 products",
    image: audioImg,
    heroTagline: "Music the way it was meant to be heard.",
    path: "/products/list?segment=audio",
  },
  {
    id: "accessories",
    title: "Accessories",
    subtitle: "Cases, chargers & more",
    count: "203 products",
    image: accessoriesImg,
    heroTagline: "Precision accessories for the discerning eye.",
    path: "/products/list?segment=accessories",
  },
];

const ProductCategories = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [transitioning, setTransitioning] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, []);

  const switchCategory = (index) => {
    if (index === activeIndex || transitioning) return;
    setTransitioning(true);
    setActiveIndex(index);
    setTimeout(() => setTransitioning(false), 500);
  };

  const active = categoryCards[activeIndex];

  return (
    <motion.div
      className="pc-page"
      key={location.pathname}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
    >
      <Header />

      <main className="pc-main">

        {/* ── Hero — background is fixed, only text/button animate ── */}
        <div className={`pc-hero ${transitioning ? "pc-hero--fade" : ""}`}>
          <div
            className="pc-hero__bg"
            style={{ backgroundImage: `url(${active.image})` }}
          />
          <div className="pc-hero__overlay" />

          <div className="pc-hero__content">
            {/* Title */}
            <FadeUp delay={0.1}>
              <h1 className="pc-hero__title">{active.title}</h1>
            </FadeUp>

            {/* Tagline */}
            <FadeUp delay={0.22}>
              <p className="pc-hero__tagline">{active.heroTagline}</p>
            </FadeUp>

            {/* CTA button */}
            <FadeUp delay={0.34}>
              <button
                className="pc-hero__cta"
                onClick={() => navigate(active.path)}
              >
                Shop now
              </button>
            </FadeUp>
          </div>

          {/* Dot indicators */}
          <div className="pc-hero__counter">
            {categoryCards.map((_, i) => (
              <button
                key={i}
                className={`pc-hero__dot ${i === activeIndex ? "active" : ""}`}
                onClick={() => switchCategory(i)}
                aria-label={`Go to ${categoryCards[i].title}`}
              />
            ))}
          </div>
        </div>

        {/* ── Browse label ── */}
        <FadeUp delay={0.1}>
          <div className="pc-tabs-wrapper">
            <span className="pc-tabs-label">Collection</span>
          </div>
        </FadeUp>

        <FadeUp delay={0.1}>
          <div className="pc-tabs-wrapper">
            <span className="pc-tabs-label-down">Explore Collections</span>
          </div>
        </FadeUp>

        {/* ── Cards — staggered fade up ── */}
        <div className="pc-cards">
          {categoryCards.map((cat, i) => (
            <FadeUp key={cat.id} delay={i * 0.12} className="pc-card-wrap">
              <button
                className={`pc-card ${i === activeIndex ? "pc-card--active" : ""}`}
                onMouseEnter={() => switchCategory(i)}
                onClick={() => navigate(cat.path)}
                aria-label={`Shop ${cat.title}`}
              >
                <div
                  className="pc-card__img"
                  style={{ backgroundImage: `url(${cat.image})` }}
                />
                <div className="pc-card__overlay" />
                <div className="pc-card__info">
                  <span className="pc-card__title">{cat.title}</span>
                  <span className="pc-card__sub">{cat.subtitle}</span>
                </div>
              </button>
            </FadeUp>
          ))}
        </div>

      </main>

      <Footer />
    </motion.div>
  );
};

export default ProductCategories;
