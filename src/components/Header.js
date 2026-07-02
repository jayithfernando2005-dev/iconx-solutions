import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../components/Header.css";
import logo from "../assets/iconx-logo.jpg";
import { FiSearch, FiShoppingCart, FiUser, FiMenu, FiX } from "react-icons/fi";
import { CART_EVENT, getCartCount } from "../utils/cart";
import { db } from "../firebase";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";

const Header = () => {
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const [cartCount, setCartCount] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [allProducts, setAllProducts] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchRef = useRef(null);
  const navigate = useNavigate();

  // Load all products once for live suggestions (AJAX — no page reload)
  useEffect(() => {
    const q = query(collection(db, "products"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      setAllProducts(
        snap.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .filter((p) => p.status === "ACTIVE")
      );
    });
    return () => unsub();
  }, []);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    let lastScrollY = window.scrollY;
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY <= 20) {
        setIsHeaderVisible(true);
      } else if (currentScrollY > lastScrollY) {
        setIsHeaderVisible(false);
      } else if (currentScrollY < lastScrollY) {
        setIsHeaderVisible(true);
      }
      lastScrollY = currentScrollY;
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const syncCartCount = () => setCartCount(getCartCount());
    syncCartCount();
    window.addEventListener("storage", syncCartCount);
    window.addEventListener(CART_EVENT, syncCartCount);
    return () => {
      window.removeEventListener("storage", syncCartCount);
      window.removeEventListener(CART_EVENT, syncCartCount);
    };
  }, []);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  const closeMenu = () => setMenuOpen(false);

  // Filter suggestions live as user types (AJAX — no page reload)
  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearchQuery(val);
    if (val.trim().length >= 1) {
      const term = val.trim().toLowerCase();
      const matched = allProducts
        .filter(
          (p) =>
            p.name?.toLowerCase().includes(term) ||
            p.brands?.toLowerCase().includes(term) ||
            p.category?.toLowerCase().includes(term)
        )
        .slice(0, 6);
      setSuggestions(matched);
      setShowSuggestions(true);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // FIX: navigate to /products/list (not /products which is the categories page)
      navigate(`/products/list?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
      setSearchQuery("");
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (product) => {
    // Clicking a suggestion goes directly to that product's detail page
    navigate(`/product/${product.id}`);
    setSearchOpen(false);
    setSearchQuery("");
    setSuggestions([]);
    setShowSuggestions(false);
  };

  const toggleSearch = () => {
    setSearchOpen(!searchOpen);
    setSearchQuery("");
    setSuggestions([]);
    setShowSuggestions(false);
  };

  return (
    <>
      <header
        className={`header ${isHeaderVisible ? "header-visible" : "header-hidden"}`}
      >
        <div className="logo">
          <Link to="/home">
            <img src={logo} alt="Icon X Logo" />
          </Link>
        </div>

        <nav className="nav">
          <ul>
            <li>
              <Link to="/home">Discover</Link>
            </li>
            <li>
              <Link to="/products">Collection</Link>
            </li>
            <li>
              <Link to="/trade-in">Switch</Link>
            </li>
            <li>
              <Link to="/contact">Support</Link>
            </li>
            <li>
              <Link to="/about">Company</Link>
            </li>
          </ul>
        </nav>

        <div className="header-icons">
          <FiSearch
            className="icon"
            onClick={toggleSearch}
            style={{ cursor: "pointer" }}
          />

          <div
            className="mobile-menu-toggle"
            onClick={() => setMenuOpen(true)}
            aria-label="Open menu"
          >
            <FiMenu className="icon" />
          </div>

          <div className="desktop-icons">
            <Link to="/cart" className="header-icon-link" aria-label="Cart">
              <span className="header-cart-icon-wrap">
                <FiShoppingCart className="icon" />
                {cartCount > 0 && (
                  <span className="header-cart-badge">{cartCount}</span>
                )}
              </span>
            </Link>
            <Link to="/login" aria-label="Login">
              <FiUser className="icon" />
            </Link>
          </div>
        </div>
      </header>

      {searchOpen && (
        <div
          style={{
            position: "fixed",
            top: "110px",
            left: 0,
            right: 0,
            background: "white",
            padding: "1rem 2rem",
            boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
            zIndex: 999,
            display: "flex",
            alignItems: "center",
            gap: "1rem",
          }}
        >
          <form
            ref={searchRef}
            onSubmit={handleSearchSubmit}
            style={{ display: "flex", width: "100%", gap: "0.5rem", flexDirection: "column", position: "relative" }}
          >
            <div style={{ display: "flex", width: "100%", gap: "0.5rem" }}>
              <input
                type="text"
                placeholder="Search for products..."
                value={searchQuery}
                onChange={handleSearchChange}
                autoFocus
                style={{
                  flex: 1,
                  padding: "0.75rem 1rem",
                  fontSize: "1rem",
                  border: "1px solid #ddd",
                  borderRadius: "8px",
                  outline: "none",
                }}
              />
              <button
                type="submit"
                style={{
                  padding: "0.75rem 1.5rem",
                  background: "#000",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontSize: "1rem",
                }}
              >
                Search
              </button>
              <button
                type="button"
                onClick={toggleSearch}
                style={{
                  padding: "0.75rem",
                  background: "transparent",
                  border: "1px solid #ddd",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontSize: "1rem",
                }}
              >
                <FiX />
              </button>
            </div>

            {/* Live suggestions dropdown — no page reload */}
            {showSuggestions && suggestions.length > 0 && (
              <div
                style={{
                  position: "absolute",
                  top: "100%",
                  left: 0,
                  right: 0,
                  background: "#fff",
                  border: "1px solid #eee",
                  borderRadius: "10px",
                  boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
                  zIndex: 1000,
                  overflow: "hidden",
                  marginTop: "4px",
                }}
              >
                {suggestions.map((product) => (
                  <div
                    key={product.id}
                    onClick={() => handleSuggestionClick(product)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                      padding: "10px 16px",
                      cursor: "pointer",
                      borderBottom: "1px solid #f5f5f5",
                      transition: "background 0.15s",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "#f8f8f8")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "#fff")}
                  >
                    {product.image && (
                      <img
                        src={product.image}
                        alt={product.name}
                        style={{
                          width: 40,
                          height: 40,
                          objectFit: "cover",
                          borderRadius: 6,
                          flexShrink: 0,
                        }}
                      />
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: "0.9rem", color: "#111", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {product.name}
                      </div>
                      <div style={{ fontSize: "0.78rem", color: "#888" }}>
                        {product.brands} · {product.category}
                      </div>
                    </div>
                    <div style={{ fontWeight: 700, fontSize: "0.88rem", color: "#111", flexShrink: 0 }}>
                      රු{Number(product.price).toLocaleString()}
                    </div>
                  </div>
                ))}
                <div
                  onClick={handleSearchSubmit}
                  style={{
                    padding: "10px 16px",
                    textAlign: "center",
                    fontSize: "0.85rem",
                    color: "#555",
                    cursor: "pointer",
                    background: "#fafafa",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "#f0f0f0")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "#fafafa")}
                >
                  See all results for <strong>"{searchQuery}"</strong>
                </div>
              </div>
            )}
          </form>
        </div>
      )}

      <div
        className={`mobile-sidebar-overlay ${menuOpen ? "show" : ""}`}
        onClick={closeMenu}
      ></div>

      <aside className={`mobile-sidebar ${menuOpen ? "open" : ""}`}>
        <div className="mobile-sidebar-header">
          <img src={logo} alt="Icon X Logo" className="mobile-sidebar-logo" />
          <button
            className="mobile-sidebar-close"
            onClick={closeMenu}
            aria-label="Close menu"
          >
            <FiX />
          </button>
        </div>
        <nav className="mobile-sidebar-nav">
          <Link to="/home" onClick={closeMenu}>
            Discover
          </Link>
          <Link to="/products" onClick={closeMenu}>
            Collection
          </Link>
          <Link to="/trade-in" onClick={closeMenu}>
            Switch
          </Link>
          <Link to="/contact" onClick={closeMenu}>
            Support
          </Link>
          <Link to="/about" onClick={closeMenu}>
            Company
          </Link>
        </nav>
        <div className="mobile-sidebar-icons">
          <Link
            to="/cart"
            className="mobile-sidebar-icon-link"
            onClick={closeMenu}
          >
            <span className="header-cart-icon-wrap">
              <FiShoppingCart className="icon" />
              {cartCount > 0 && (
                <span className="header-cart-badge">{cartCount}</span>
              )}
            </span>
            <span>Cart</span>
          </Link>
          <Link
            to="/login"
            className="mobile-sidebar-icon-link"
            onClick={closeMenu}
          >
            <FiUser className="icon" />
            <span>Profile</span>
          </Link>
        </div>
      </aside>
    </>
  );
};

export default Header;
