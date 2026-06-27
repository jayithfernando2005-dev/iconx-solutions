import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { db } from "../firebase";
import { doc, getDoc } from "firebase/firestore";
import { addItemToCart } from "../utils/cart";
import kokoLogo from "../images/koko.png";
import { Phone } from "lucide-react";
import "./ProductDetails.css";

export default function ProductDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [addedToast, setAddedToast] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
    const fetchProduct = async () => {
      try {
        const docRef = doc(db, "products", id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setProduct({ id: docSnap.id, ...docSnap.data() });
        } else {
          setError("Product not found.");
        }
      } catch (err) {
        console.error("Error fetching product details:", err);
        setError("Failed to load product details.");
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

  const handleAddToCart = useCallback(() => {
    if (!product) return;
    addItemToCart(product);
    setAddedToast(true);
    setTimeout(() => setAddedToast(false), 3000);
  }, [product]);

  const handleBuyNow = useCallback(() => {
    if (!product) return;
    addItemToCart(product);
    navigate("/cart");
  }, [product, navigate]);

  const renderDescription = (text) => {
    if (!text) return null;
    return text.split("\n").map((para, i) => {
      const trimmed = para.trim();
      if (trimmed.startsWith("#")) {
        const cleanText = trimmed.replace(/^#+\s*/, "");
        return <h3 key={i} className="details-desc-heading">{cleanText}</h3>;
      }
      if (trimmed) {
        return <p key={i} className="details-desc-paragraph">{para}</p>;
      }
      return null;
    });
  };

  if (loading) {
    return (
      <>
        <Header />
        <div className="details-loading-container">
          <div className="spinner"></div>
          <p>Loading premium product details...</p>
        </div>
        <Footer />
      </>
    );
  }

  if (error || !product) {
    return (
      <>
        <Header />
        <div className="details-error-container">
          <h2>Oops!</h2>
          <p>{error || "We couldn't retrieve the details for this product."}</p>
          <Link to="/products/list" className="back-btn">Browse Products</Link>
        </div>
        <Footer />
      </>
    );
  }

  const detailImages = [
    product.detailImage1,
    product.detailImage2,
    product.detailImage3
  ].filter(Boolean);

  return (
    <>
      <Header />
      <div className="product-details-page">
        {addedToast && (
          <div className="details-cart-toast">
            <span>✨ {product.name} added to cart successfully!</span>
          </div>
        )}

        <div className="details-breadcrumb">
          <Link to="/home">Home</Link> &gt; <Link to="/products/list">Products</Link> &gt; <span>{product.name}</span>
        </div>

        <div className="details-container">
          {/* Left Column: Description & Gallery */}
          <div className="details-left-col">
            <div className="details-card desc-card">
              <h2 className="details-card-title">Description</h2>
              
              <div className="details-main-heading">
                {product.name} {product.brands ? `by ${product.brands}` : ""} - Official Warranty
              </div>

              <div className="details-desc-body">
                {renderDescription(product.longDescription || product.description)}
              </div>
            </div>

            {/* Detail Images Gallery */}
            {detailImages.length > 0 && (
              <div className="details-card gallery-card">
                <h2 className="details-card-title">Product Showcase</h2>
                <div className="details-gallery-grid">
                  {detailImages.map((img, idx) => (
                    <div key={idx} className="gallery-img-wrapper">
                      <img src={img} alt={`Detail ${idx + 1}`} loading="lazy" />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Specifications & Highlights */}
          <div className="details-right-col">
            <div className="details-card specs-card">
              <h2 className="details-card-title">Specification</h2>
              <h3 className="specs-sub-title">Additional Information</h3>

              <div className="specs-table">
                {product.specifications && product.specifications.length > 0 ? (
                  product.specifications.map((spec, idx) => (
                    <div key={idx} className="specs-row">
                      <span className="specs-label">{spec.label}</span>
                      <span className="specs-value">{spec.value}</span>
                    </div>
                  ))
                ) : (
                  <div className="no-specs-msg">No technical specifications provided for this product.</div>
                )}

                {product.warranty && (
                  <div className="specs-row warranty-row">
                    <span className="specs-label">Warranty</span>
                    <span className="specs-value highlight-value">{product.warranty}</span>
                  </div>
                )}

                {product.support && (
                  <div className="specs-row support-row">
                    <span className="specs-label">Support Coverage</span>
                    <span className="specs-value">{product.support}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Summary Card */}
            <div className="details-card quick-summary-card">
              <h2 className="details-card-title">Quick Checkout</h2>
              <div className="quick-summary-price">
                රු{product.price?.toLocaleString()}
              </div>
              <p className="quick-installment">
                or 3 x රු{(Number(product.price || 0) / 3).toLocaleString(undefined, {
                  maximumFractionDigits: 2,
                })} interest-free with 
                <img src={kokoLogo} alt="koko" className="koko-logo-inline" />
              </p>
              
              <div className="quick-actions">
                <button className="quick-add-btn" onClick={handleAddToCart}>
                  Add to Cart
                </button>
                <button className="quick-buy-btn" onClick={handleBuyNow}>
                  Buy Now
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Action Bar at the Bottom */}
      <div className="details-sticky-bar">
        <div className="sticky-bar-content">
          <div className="sticky-product-info">
            <img src={product.image} alt={product.name} className="sticky-product-thumb" />
            <div className="sticky-product-meta">
              <span className="sticky-product-name">{product.name}</span>
              <span className="sticky-product-price">රු{product.price?.toLocaleString()}</span>
            </div>
          </div>
          <div className="sticky-actions">
            <button className="sticky-add-btn" onClick={handleAddToCart}>
              Add to Cart
            </button>
            <button className="sticky-buy-btn" onClick={handleBuyNow}>
              Buy Now
            </button>
          </div>
        </div>
      </div>

      {/* WhatsApp Chat Button */}
      <a 
        href={`https://wa.me/94770000000?text=Hi, I am interested in purchasing ${product.name}.`} 
        target="_blank" 
        rel="noopener noreferrer" 
        className="details-whatsapp-btn"
        aria-label="Chat on WhatsApp"
      >
        <Phone size={24} />
      </a>

      <Footer />
    </>
  );
}
