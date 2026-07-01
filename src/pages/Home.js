import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header.js";
import Footer from "../components/Footer.js";
import "./home.css";
import xiaomi from "../images/xiaomi15.jpg";
import air from "../images/17promax.avif";
import samsung from "../images/s25.jpg";
import oneplus from "../images/oneplus15.webp";
import google from "../images/google10.jpg";
import macbook from "../images/mac.webp";
import Product1 from "../images/Product1.jpg";
import Product3 from "../images/Product3.jpg";
import Product4 from "../images/Product4.webp";
import Product5 from "../images/Product5.png";
import Product6 from "../images/Product6.jpg";
import Product7 from "../images/Product7.jpg";
import Product8 from "../images/Product8.jpg";
import Product9 from "../images/Product9.jpg";
import Product10 from "../images/Product10.jpg";
import Product11 from "../images/Product11.jpg";
import Product12 from "../images/Product12.jpg";
import Product13 from "../images/Product13.webp";
import Product14 from "../images/Product14.png";
import Product16 from "../images/Product16.jpg";
import Product17 from "../images/Product17.webp";
import Product18 from "../images/Product18.avif";
import Product19 from "../images/Product19.jpg";
import Product20 from "../images/Product20.avif";
import accessories from "../images/Accessories1.png";
import speakers from "../images/Speaker.jpg";
import earbuds from "../images/Earphone.jpg";
import koko from "../images/koko.png";
import customer1 from "../images/Customer1.jpeg";
import customer2 from "../images/Customer2.jpeg";
import customer3 from "../images/Customer3.jpeg";
import customer4 from "../images/Customer4.jpeg";
import customer5 from "../images/Customer5.jpeg";
import customer6 from "../images/Customer6.jpeg";
import customer7 from "../images/Csutomer7.jpeg";
import customer8 from "../images/Customer8.jpeg";
import Pro from "../images/Pro2.avif";
import Promax from "../images/leftear.png";

const customerCards = [
  { id: 1, name: null, image: customer1, text: "Loved the service.", product: "iPhone 17" },
  { id: 2, name: null, image: customer2, text: "Great service, very helpful.", product: "iPhone 16" },
  { id: 3, name: null, image: customer3, text: "Premium products at Affordable Prices.", product: "JBL Mini Speaker" },
  { id: 4, name: null, image: customer4, text: "Best customer service, Very friendly staff.", product: "iPhone 12 Pro Max" },
  { id: 5, name: null, image: customer5, text: "Authentic products, Best customer service.", product: "iPhone 17 Pro Max" },
  { id: 6, name: null, image: customer6, text: "Best store in the island.", product: "iPhone 16 Pro Max" },
  { id: 7, name: null, image: customer7, text: "Excellent product quality.", product: "Macbook Air" },
  { id: 8, name: null, image: customer8, text: "Best service at best price.", product: "iPhone 11 Pro Max" },
];

const sliderCards = [
  {
    id: 1,
    name: "Apple",
    image: air,
  },
  {
    id: 2,
    name: "Samsung",
    image: samsung,
  },
  {
    id: 3,
    name: "Xiaomi",
    image: xiaomi,
  },
  {
    id: 4,
    name: "OnePlus",
    image: oneplus,
  },
  {
    id: 5,
    name: "Google",
    image: google,
  },
  {
    id: 6,
    name: "MacBook",
    image: macbook,
  },
];

const Home = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const fadeItems = document.querySelectorAll("[data-fade-up]");

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.12,
        rootMargin: "0px 0px -40px 0px",
      }
    );

    fadeItems.forEach((item) => observer.observe(item));

    return () => observer.disconnect();
  }, []);

  return (
    <div className="home-container">
      <Header />

      <section className="youtube-banner-section" data-fade-up style={{ "--fade-delay": "0ms" }}>
        <div className="youtube-banner-wrapper">
          <iframe
            className="youtube-banner-video"
            src="https://www.youtube.com/embed/M0au92yebLQ?autoplay=1&mute=1&loop=1&playlist=M0au92yebLQ&controls=0&rel=0&modestbranding=1&playsinline=1"
            title="Banner Video"
            frameBorder="0"
            allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
            allowFullScreen
          ></iframe>
        </div>
      </section>

      <section className="featured-slider-section" data-fade-up style={{ "--fade-delay": "0ms" }}>
        <div className="featured-slider-header" data-fade-up style={{ "--fade-delay": "80ms" }}>
          <p className="featured-subtitle">Featured Collection</p>
          <span className="pc-tabs-label-down-home">Discover Brands</span>
        </div>
        <div className="featured-slider-track-wrap" data-fade-up style={{ "--fade-delay": "140ms" }}>
          <div className="featured-slider-track">
            {[...sliderCards, ...sliderCards].map((card, index) => (
              <div
                className="featured-slide-card"
                key={`${card.id}-${index}`}
                data-fade-up
                style={{ "--fade-delay": `${(index % sliderCards.length) * 80}ms` }}
              >
                <img src={card.image} alt={card.name} />
                <div className="featured-card-overlay">
                  <h3>{card.name}</h3>
                  <span className="featured-card-arrow">→</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="products-showcase-section" data-fade-up style={{ "--fade-delay": "0ms" }}>
        <div className="products-showcase-header" data-fade-up style={{ "--fade-delay": "60ms" }}>
          <h2>Featured Products</h2>
          <button className="more-products-btn" onClick={() => navigate("/products")}>
            View Products
          </button>
        </div>
        <div className="products-showcase-grid">
          <div className="product-showcase-card" data-fade-up style={{ "--fade-delay": "0ms" }}>
            <div className="product-showcase-image-wrap">
              <img src={Product1} alt="iPhone 17 Pro Max" />
            </div>
            <div className="product-colors">
              <span className="color-dot black"></span>
              <span className="color-dot blue"></span>
              <span className="color-dot silver"></span>
              <span className="color-dot white"></span>
            </div>
            <h3>iPhone 17 Pro Max</h3>
            <p className="product-series">iPhone 17 Series</p>
            <p className="product-price">රු364,999</p>
            <p className="product-installment">
              or 3 x රු121,666.33 with
              <img src={koko} alt="koko" className="koko-logo" />
            </p>
          </div>

          <div className="product-showcase-card" data-fade-up style={{ "--fade-delay": "80ms" }}>
            <div className="product-showcase-image-wrap">
              <img src={Product1} alt="iPhone 17 Pro" />
            </div>
            <div className="product-colors">
              <span className="color-dot black"></span>
              <span className="color-dot white"></span>
            </div>
            <h3>iPhone 17 Pro</h3>
            <p className="product-series">iPhone 17 Series</p>
            <p className="product-price">රු178,900</p>
            <p className="product-installment">
              or 3 x රු59,633.33 with
              <img src={koko} alt="koko" className="koko-logo" />
            </p>
          </div>

          <div className="product-showcase-card" data-fade-up style={{ "--fade-delay": "160ms" }}>
            <div className="product-showcase-image-wrap">
              <img src={Product5} alt="iPhone 17 Air" />
            </div>
            <div className="product-colors">
              <span className="color-dot black"></span>
              <span className="color-dot pink"></span>
              <span className="color-dot white"></span>
              <span className="color-dot teal"></span>
              <span className="color-dot bluebright"></span>
            </div>
            <h3>iPhone 17 Air</h3>
            <p className="product-series">iPhone 17 Series</p>
            <p className="product-price">රු244,999</p>
            <p className="product-installment">
              or 3 x රු81,666.33 with
              <img src={koko} alt="koko" className="koko-logo" />
            </p>
          </div>

          <div className="product-showcase-card" data-fade-up style={{ "--fade-delay": "240ms" }}>
            <div className="product-showcase-image-wrap">
              <img src={Product3} alt="iPhone 16" />
            </div>
            <div className="product-colors">
              <span className="color-dot black"></span>
              <span className="color-dot navy"></span>
              <span className="color-dot white"></span>
              <span className="color-dot yellow"></span>
            </div>
            <h3>iPhone 16</h3>
            <p className="product-series">iPhone 16 Series</p>
            <p className="product-price">රු308,999</p>
            <p className="product-installment">
              or 3 x රු102,999.67 with
              <img src={koko} alt="koko" className="koko-logo" />
            </p>
          </div>

          <div className="product-showcase-card" data-fade-up style={{ "--fade-delay": "320ms" }}>
            <div className="product-showcase-image-wrap">
              <img src={Product4} alt="iPhone 15" />
            </div>
            <div className="product-colors">
              <span className="color-dot silver"></span>
              <span className="color-dot gold"></span>
              <span className="color-dot navy"></span>
            </div>
            <h3>iPhone 15</h3>
            <p className="product-series">iPhone 15 Series</p>
            <p className="product-price">රු424,999</p>
            <p className="product-installment">
              or 3 x රු141,666.33 with
              <img src={koko} alt="koko" className="koko-logo" />
            </p>
          </div>
        </div>
      </section>

      <section className="products-showcase-section" data-fade-up style={{ "--fade-delay": "0ms" }}>
        <div className="products-showcase-header" data-fade-up style={{ "--fade-delay": "60ms" }}>
          <h2>Android Products</h2>
          <button className="more-products-btn" onClick={() => navigate("/products")}>
            View Products
          </button>
        </div>
        <div className="products-showcase-grid">
          <div className="product-showcase-card" data-fade-up style={{ "--fade-delay": "0ms" }}>
            <div className="product-showcase-image-wrap">
              <img src={Product6} alt="Galaxy S25 Ultra" />
            </div>
            <div className="product-colors">
              <span className="color-dot black"></span>
              <span className="color-dot silver"></span>
              <span className="color-dot blue"></span>
            </div>
            <h3>Galaxy S25 Ultra</h3>
            <p className="product-series">Samsung Galaxy Series</p>
            <p className="product-price">රු379,999</p>
            <p className="product-installment">
              or 3 x රු126,666.33 with
              <img src={koko} alt="koko" className="koko-logo" />
            </p>
          </div>

          <div className="product-showcase-card" data-fade-up style={{ "--fade-delay": "80ms" }}>
            <div className="product-showcase-image-wrap">
              <img src={Product7} alt="Xiaomi 15" />
            </div>
            <div className="product-colors">
              <span className="color-dot black"></span>
              <span className="color-dot white"></span>
              <span className="color-dot green"></span>
            </div>
            <h3>Xiaomi 15</h3>
            <p className="product-series">Xiaomi Series</p>
            <p className="product-price">රු259,999</p>
            <p className="product-installment">
              or 3 x රු86,666.33 with
              <img src={koko} alt="koko" className="koko-logo" />
            </p>
          </div>

          <div className="product-showcase-card" data-fade-up style={{ "--fade-delay": "160ms" }}>
            <div className="product-showcase-image-wrap">
              <img src={Product8} alt="OnePlus 15" />
            </div>
            <div className="product-colors">
              <span className="color-dot black"></span>
              <span className="color-dot green"></span>
            </div>
            <h3>OnePlus 15</h3>
            <p className="product-series">OnePlus Series</p>
            <p className="product-price">රු229,999</p>
            <p className="product-installment">
              or 3 x රු76,666.33 with
              <img src={koko} alt="koko" className="koko-logo" />
            </p>
          </div>

          <div className="product-showcase-card" data-fade-up style={{ "--fade-delay": "240ms" }}>
            <div className="product-showcase-image-wrap">
              <img src={Product9} alt="Google Pixel 10" />
            </div>
            <div className="product-colors">
              <span className="color-dot black"></span>
              <span className="color-dot blue"></span>
              <span className="color-dot white"></span>
            </div>
            <h3>Google Pixel 10</h3>
            <p className="product-series">Google Pixel Series</p>
            <p className="product-price">රු249,999</p>
            <p className="product-installment">
              or 3 x රු83,333.33 with
              <img src={koko} alt="koko" className="koko-logo" />
            </p>
          </div>

          <div className="product-showcase-card" data-fade-up style={{ "--fade-delay": "320ms" }}>
            <div className="product-showcase-image-wrap">
              <img src={Product10} alt="Redmi Note 15" />
            </div>
            <div className="product-colors">
              <span className="color-dot black"></span>
              <span className="color-dot gold"></span>
            </div>
            <h3>Redmi Note 15</h3>
            <p className="product-series">Redmi Series</p>
            <p className="product-price">රු199,999</p>
            <p className="product-installment">
              or 3 x රු66,666.33 with
              <img src={koko} alt="koko" className="koko-logo" />
            </p>
          </div>
        </div>
      </section>

      <section className="tradein-banner" data-fade-up style={{ "--fade-delay": "0ms" }}>
        <div className="tradein-content" data-fade-up style={{ "--fade-delay": "100ms" }}>
          <h2>Upgrade with Switch</h2>
          <p className="tradein-text">
            Switch to your new device and save on your next upgrade.
          </p>
          <a href="/trade-in" className="tradein-btn">
            Check switch value
          </a>
        </div>
      </section>

      <section className="products-showcase-section" data-fade-up style={{ "--fade-delay": "0ms" }}>
        <div className="products-showcase-header" data-fade-up style={{ "--fade-delay": "60ms" }}>
          <h2>Browse iPads</h2>
          <button className="more-products-btn" onClick={() => navigate("/products")}>
            View Products
          </button>
        </div>
        <div className="products-showcase-grid">
          <div className="product-showcase-card" data-fade-up style={{ "--fade-delay": "0ms" }}>
            <div className="product-showcase-image-wrap">
              <img src={Product16} alt="iPad Pro M5" />
            </div>
            <div className="product-colors">
              <span className="color-dot black"></span>
              <span className="color-dot silver"></span>
            </div>
            <h3>iPad Pro M5</h3>
            <p className="product-series">iPad Pro</p>
            <p className="product-price">රු299,999</p>
            <p className="product-installment">
              or 3 x රු99,999.67 with
              <img src={koko} alt="koko" className="koko-logo" />
            </p>
          </div>

          <div className="product-showcase-card" data-fade-up style={{ "--fade-delay": "80ms" }}>
            <div className="product-showcase-image-wrap">
              <img src={Product17} alt="iPad Pro M4" />
            </div>
            <div className="product-colors">
              <span className="color-dot blue"></span>
              <span className="color-dot purple"></span>
              <span className="color-dot silver"></span>
            </div>
            <h3>iPad Pro M4</h3>
            <p className="product-series">iPad Pro</p>
            <p className="product-price">රු219,999</p>
            <p className="product-installment">
              or 3 x රු73,333.00 with
              <img src={koko} alt="koko" className="koko-logo" />
            </p>
          </div>

          <div className="product-showcase-card" data-fade-up style={{ "--fade-delay": "160ms" }}>
            <div className="product-showcase-image-wrap">
              <img src={Product18} alt="iPad Pro M2" />
            </div>
            <div className="product-colors">
              <span className="color-dot black"></span>
              <span className="color-dot pink"></span>
              <span className="color-dot silver"></span>
            </div>
            <h3>iPad Pro M2</h3>
            <p className="product-series">iPad Pro</p>
            <p className="product-price">රු179,999</p>
            <p className="product-installment">
              or 3 x රු59,999.67 with
              <img src={koko} alt="koko" className="koko-logo" />
            </p>
          </div>

          <div className="product-showcase-card" data-fade-up style={{ "--fade-delay": "240ms" }}>
            <div className="product-showcase-image-wrap">
              <img src={Product19} alt="iPad Mini" />
            </div>
            <div className="product-colors">
              <span className="color-dot blue"></span>
              <span className="color-dot yellow"></span>
              <span className="color-dot pink"></span>
              <span className="color-dot silver"></span>
            </div>
            <h3>iPad Mini</h3>
            <p className="product-series">iPad Mini</p>
            <p className="product-price">රු159,999</p>
            <p className="product-installment">
              or 3 x රු53,333.00 with
              <img src={koko} alt="koko" className="koko-logo" />
            </p>
          </div>

          <div className="product-showcase-card" data-fade-up style={{ "--fade-delay": "320ms" }}>
            <div className="product-showcase-image-wrap">
              <img src={Product20} alt="iPad Air M2" />
            </div>
            <div className="product-colors">
              <span className="color-dot black"></span>
              <span className="color-dot silver"></span>
              <span className="color-dot purple"></span>
            </div>
            <h3>iPad Air M2</h3>
            <p className="product-series">iPad Air</p>
            <p className="product-price">රු249,999</p>
            <p className="product-installment">
              or 3 x රු83,333.00 with
              <img src={koko} alt="koko" className="koko-logo" />
            </p>
          </div>
        </div>
      </section>

      <section className="products-showcase-section" data-fade-up style={{ "--fade-delay": "0ms" }}>
        <div className="products-showcase-header" data-fade-up style={{ "--fade-delay": "60ms" }}>
          <h2>Browse Macs</h2>
          <button className="more-products-btn" onClick={() => navigate("/products")} >
            View Products
          </button>
        </div>
        <div className="products-showcase-grid">
          <div className="product-showcase-card" data-fade-up style={{ "--fade-delay": "0ms" }}>
            <div className="product-showcase-image-wrap">
              <img src={Product11} alt="iMac M1" />
            </div>
            <div className="product-colors">
              <span className="color-dot orange"></span>
              <span className="color-dot black"></span>
            </div>
            <h3>iMac M1</h3>
            <p className="product-series">iMac</p>
            <p className="product-price">රු189,999</p>
            <p className="product-installment">
              or 3 x රු63,333.00 with
              <img src={koko} alt="koko" className="koko-logo" />
            </p>
          </div>

          <div className="product-showcase-card" data-fade-up style={{ "--fade-delay": "80ms" }}>
            <div className="product-showcase-image-wrap">
              <img src={Product12} alt="iMac M3" />
            </div>
            <div className="product-colors">
              <span className="color-dot pink"></span>
              <span className="color-dot silver"></span>
              <span className="color-dot black"></span>
            </div>
            <h3>iMac M3</h3>
            <p className="product-series">iMac</p>
            <p className="product-price">රු149,999</p>
            <p className="product-installment">
              or 3 x රු49,999.67 with
              <img src={koko} alt="koko" className="koko-logo" />
            </p>
          </div>

          <div className="product-showcase-card" data-fade-up style={{ "--fade-delay": "160ms" }}>
            <div className="product-showcase-image-wrap">
              <img src={Product13} alt="iMac M4" />
            </div>
            <div className="product-colors">
              <span className="color-dot silver"></span>
              <span className="color-dot black"></span>
            </div>
            <h3>iMac M4</h3>
            <p className="product-series">iMac</p>
            <p className="product-price">රු199,999</p>
            <p className="product-installment">
              or 3 x රු36,666.33 with
              <img src={koko} alt="koko" className="koko-logo" />
            </p>
          </div>

          <div className="product-showcase-card" data-fade-up style={{ "--fade-delay": "240ms" }}>
            <div className="product-showcase-image-wrap">
              <img src={Product14} alt="Macbook Pro M4" />
            </div>
            <div className="product-colors">
              <span className="color-dot black"></span>
              <span className="color-dot silver"></span>
            </div>
            <h3>Macbook Pro M4</h3>
            <p className="product-series">Macbook Pro</p>
            <p className="product-price">රු194,999</p>
            <p className="product-installment">
              or 3 x රු31,666.33 with
              <img src={koko} alt="koko" className="koko-logo" />
            </p>
          </div>

          <div className="product-showcase-card" data-fade-up style={{ "--fade-delay": "320ms" }}>
            <div className="product-showcase-image-wrap">
              <img src={Product14} alt="Macbook Pro M5" />
            </div>
            <div className="product-colors">
              <span className="color-dot gold"></span>
              <span className="color-dot brown"></span>
            </div>
            <h3>Macbook Pro M5</h3>
            <p className="product-series">Macbook Pro</p>
            <p className="product-price">රු229,999</p>
            <p className="product-installment">
              or 3 x රු76,666.33 with
              <img src={koko} alt="koko" className="koko-logo" />
            </p>
          </div>
        </div>
      </section>

      <section className="accessories-banner-section" data-fade-up style={{ "--fade-delay": "0ms" }}>
        <div className="accessories-banner">
          <div className="accessories-banner-image" data-fade-up style={{ "--fade-delay": "60ms" }}>
            <img src={Promax} alt="Apple Accessories" />
          </div>
          <div className="accessories-banner-content" data-fade-up style={{ "--fade-delay": "140ms" }}>
            <h2 className="gradient-text-new-home">All Accessories</h2>
            <p>
              Explore our curated collection 
              of premium cases, chargers, AirPods, Apple Watches, and AirTags. All 
              hand picked to complement your Apple lifestyle perfectly.
            </p>
            <div className="accessories-banner-buttons">
              <button className="accessory-pill-btn" onClick={() => navigate("/products")} >Watches</button>
              <button className="accessory-pill-btn" onClick={() => navigate("/products")}>AirPods</button>
              <button className="accessory-pill-btn" onClick={() => navigate("/products")}>Airtags</button>
              <button className="accessory-pill-btn" onClick={() => navigate("/products")}>Cases</button>
            </div>
          </div>
        </div>
      </section>

      <section className="category-banner-section" data-fade-up style={{ "--fade-delay": "0ms" }}>
        <div className="category-banner-grid">
          <div className="category-banner-card" data-fade-up style={{ "--fade-delay": "0ms" }}>
            <div className="category-banner-image">
              <img src={accessories} alt="Accessories" />
            </div>
            <div className="category-banner-content">
              <h3>Camera</h3>
              <button className="category-banner-btn" onClick={() => navigate("/products")}>View Products</button>
            </div>
          </div>

          <div className="category-banner-card" data-fade-up style={{ "--fade-delay": "100ms" }}>
            <div className="category-banner-image">
              <img src={speakers} alt="Speakers" />
            </div>
            <div className="category-banner-content">
              <h3>Speakers</h3>
              <button className="category-banner-btn" onClick={() => navigate("/products")}>View Products</button>
            </div>
          </div>

          <div className="category-banner-card" data-fade-up style={{ "--fade-delay": "200ms" }}>
            <div className="category-banner-image">
              <img src={earbuds} alt="Earbuds" />
            </div>
            <div className="category-banner-content">
              <h3>Earbuds</h3>
              <button className="category-banner-btn" onClick={() => navigate("/products")}>View Products</button>
            </div>
          </div>
        </div>
      </section>

      <section className="customer-spotlight-section" data-fade-up style={{ "--fade-delay": "0ms" }}>
        <div className="customer-spotlight-header" data-fade-up style={{ "--fade-delay": "60ms" }}>
          <p className="customer-spotlight-subtitle">Customer Spotlight</p>
        </div>
        <div className="customer-spotlight-track" data-fade-up style={{ "--fade-delay": "120ms" }}>
          {[...customerCards, ...customerCards].map((card, index) => (
            <div
              className="customer-card"
              key={`${card.id}-${index}`}
              data-fade-up
              style={{ "--fade-delay": `${(index % customerCards.length) * 70}ms` }}
            >
              <img src={card.image} alt={card.name} />
              <div className="customer-overlay">
                <h4>{card.name}</h4>
                <p>{card.text}</p>
                <span>{card.product}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Home;
