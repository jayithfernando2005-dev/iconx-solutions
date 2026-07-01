import React, { useCallback, useEffect, useState } from "react";
import {
  Link,
  useLocation,
  useNavigate,
  useSearchParams,
} from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { db } from "../firebase";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import "./Products.css";
import { addItemToCart } from "../utils/cart";
import kokoLogo from "../images/koko.png";

const MIN_PRICE = 0;
const MAX_PRICE = 500000;

const SEGMENT_FILTERS = {
  apple: {
    title: "Apple Collection",
    brands: ["Apple"],
    categories: [],
  },
  android: {
    title: "Android Collection",
    brands: [
      "Android",
      "Samsung",
      "Google Pixel",
      "Xiaomi",
      "Redmi",
      "OnePlus",
      "Nothing",
      "Oppo",
      "Vivo",
      "Huawei",
      "Samsung Galaxy",
    ],
    categories: [],
  },
  audio: {
    title: "Audio & Speakers",
    brands: [
      "JBL Partybox",
      "Sony",
      "Bose",
      "Beats",
      "Sennheiser",
      "Audio-Technica",
      "Bang & Olufsen",
      "Marshall",
    ],
    categories: [
      "Audio",
      "Speaker",
      "Speakers",
      "Earbuds",
      "Headphones",
      "AirPods",
    ],
  },
  accessories: {
    title: "Accessories",
    brands: [],
    categories: [
      "Accessories",
      "Accessory",
      "Cases",
      "Chargers",
      "Cables",
      "Wearables",
      "Watch",
      "AirPods",
    ],
  },
};

const normalizeValue = (value) =>
  String(value || "")
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

const matchesToken = (value, tokens) => {
  const normalized = normalizeValue(value);
  return tokens.some((token) => normalized.includes(normalizeValue(token)));
};

const toggleSelection = (value, current, update) => {
  update((previous) =>
    previous.includes(value)
      ? previous.filter((item) => item !== value)
      : [...previous, value],
  );
};

const Products = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [minVal, setMinVal] = useState(MIN_PRICE);
  const [maxVal, setMaxVal] = useState(MAX_PRICE);
  const [toasts, setToasts] = useState([]);
  const [sortBy, setSortBy] = useState("Newest");
  const [brokenImages, setBrokenImages] = useState({});
  const [selectedBrands, setSelectedBrands] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const searchQuery = searchParams.get("search") || "";
  const [sidebarOpen, setSidebarOpen] = useState(false); 
  const [sortOpen, setSortOpen] = useState(false);

  useEffect(() => {
    const q = query(collection(db, "products"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const productsData = snapshot.docs.map((docItem) => ({
        id: docItem.id,
        ...docItem.data(),
      }));
      setProducts(productsData);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const segmentKey = searchParams.get("segment");
    const segment = segmentKey ? SEGMENT_FILTERS[segmentKey] : null;
    const brandParam = searchParams.get("brand");
    const categoryParam = searchParams.get("category");

    setSelectedBrands(segment?.brands || (brandParam ? [brandParam] : []));
    setSelectedCategories(
      segment?.categories || (categoryParam ? [categoryParam] : []),
    );
  }, [location.search, searchParams]);

  const handleMinChange = (e) => {
    const value = Math.min(Number(e.target.value), maxVal - 1000);
    setMinVal(value);
  };

  const handleMaxChange = (e) => {
    const value = Math.max(Number(e.target.value), minVal + 1000);
    setMaxVal(value);
  };

  const handleAddToCart = useCallback((product) => {
    addItemToCart(product);

    const toastId = Date.now();
    setToasts((previous) => [...previous, { id: toastId, name: product.name }]);
    setTimeout(() => {
      setToasts((previous) => previous.filter((toast) => toast.id !== toastId));
    }, 3000);
  }, []);

  const handleBuyNow = useCallback(
    (product) => {
      addItemToCart(product);
      navigate("/cart");
    },
    [navigate],
  );

  const handleImageError = useCallback((productId) => {
    setBrokenImages((previous) =>
      previous[productId] ? previous : { ...previous, [productId]: true },
    );
  }, []);

  const availableBrands = [
    ...new Set(products.map((product) => product.brands).filter(Boolean)),
  ].sort((a, b) => a.localeCompare(b));

  const availableCategories = [
    ...new Set(products.map((product) => product.category).filter(Boolean)),
  ].sort((a, b) => a.localeCompare(b));

  const activeSegment = SEGMENT_FILTERS[searchParams.get("segment")] || null;
  const minPercent = ((minVal - MIN_PRICE) / (MAX_PRICE - MIN_PRICE)) * 100;
  const maxPercent = ((maxVal - MIN_PRICE) / (MAX_PRICE - MIN_PRICE)) * 100;

  const filteredProducts = products
    .filter((product) => {
      const matchesPrice = product.price >= minVal && product.price <= maxVal;
      const isActive = product.status === "ACTIVE";
      const matchesBrand =
        !selectedBrands.length || matchesToken(product.brands, selectedBrands);
      const matchesCategory =
        !selectedCategories.length ||
        matchesToken(product.category, selectedCategories);
      const matchesSearch =
        !searchQuery ||
        normalizeValue(product.name).includes(normalizeValue(searchQuery)) ||
        normalizeValue(product.brands).includes(normalizeValue(searchQuery)) ||
        normalizeValue(product.category).includes(normalizeValue(searchQuery));

      return (
        matchesPrice &&
        isActive &&
        matchesBrand &&
        matchesCategory &&
        matchesSearch
      );
    })
    .sort((a, b) => {
      if (sortBy === "PriceLowToHigh") return a.price - b.price;
      if (sortBy === "PriceHighToLow") return b.price - a.price;
      return 0;
    });

  return (
    <div className="products-page-container">
      <Header />

      <div className="toast-container">
        {toasts.map((toast) => (
          <div key={toast.id} className="toast">
            <span className="toast-icon">OK</span>
            <div className="toast-text">
              <span className="toast-title">Added to Cart</span>
              <span className="toast-name">{toast.name}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="products-content-wrapper">
        {/* Filter toggle button */}
<button
  className="filter-toggle-btn"
  onClick={() => setSidebarOpen(true)}
>
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="4" y1="6" x2="20" y2="6"/>
    <line x1="4" y1="12" x2="14" y2="12"/>
    <line x1="4" y1="18" x2="10" y2="18"/>
  </svg>
  Filters
  {(selectedBrands.length + selectedCategories.length) > 0 && (
    <span className="filter-badge">
      {selectedBrands.length + selectedCategories.length}
    </span>
  )}
</button>

{/* Overlay */}
{sidebarOpen && (
  <div
    className="sidebar-overlay"
    onClick={() => setSidebarOpen(false)}
  />
)}

{/* Sidebar drawer */}
<aside className={`products-sidebar ${sidebarOpen ? "products-sidebar--open" : ""}`}>
  <div className="sidebar-header">
    <span className="sidebar-title">Filters</span>
    <button
      className="sidebar-close-btn"
      onClick={() => setSidebarOpen(false)}
      aria-label="Close filters"
    >
      ✕
    </button>
  </div>


  <div className="filter-group">
    <h3>Price Range</h3>
    <div className="price-slider-container">
      <div className="price-slider-track">
        <div
          className="price-slider-fill"
          style={{
            left: `${minPercent}%`,
            width: `${maxPercent - minPercent}%`,
          }}
        />
        <input
          type="range"
          min={MIN_PRICE}
          max={MAX_PRICE}
          step={1000}
          value={minVal}
          onChange={handleMinChange}
          className="price-range-input price-range-min"
          style={{ zIndex: minVal >= maxVal - 10000 ? 5 : 3 }}
        />
        <input
          type="range"
          min={MIN_PRICE}
          max={MAX_PRICE}
          step={1000}
          value={maxVal}
          onChange={handleMaxChange}
          className="price-range-input price-range-max"
        />
      </div>
      <div className="price-labels">
        <span>{minVal.toLocaleString()} LKR</span>
        <span>{maxVal.toLocaleString()} LKR</span>
      </div>
    </div>
  </div>

  <div className="filter-group">
    <div className="filter-heading-row">
      <h3>Brand</h3>
      {!!selectedBrands.length && (
        <button
          type="button"
          className="filter-reset-btn"
          onClick={() => setSelectedBrands([])}
        >
          Clear
        </button>
      )}
    </div>
    {availableBrands.map((brand) => (
      <label key={brand} className="checkbox-label">
        <input
          type="checkbox"
          checked={selectedBrands.includes(brand)}
          onChange={() =>
            toggleSelection(brand, selectedBrands, setSelectedBrands)
          }
        />
        {brand}
      </label>
    ))}
  </div>

  <div className="filter-group">
    <div className="filter-heading-row">
      <h3>Category</h3>
      {!!selectedCategories.length && (
        <button
          type="button"
          className="filter-reset-btn"
          onClick={() => setSelectedCategories([])}
        >
          Clear
        </button>
      )}
    </div>
    {availableCategories.map((category) => (
      <label key={category} className="checkbox-label">
        <input
          type="checkbox"
          checked={selectedCategories.includes(category)}
          onChange={() =>
            toggleSelection(
              category,
              selectedCategories,
              setSelectedCategories,
            )
          }
        />
        {category}
      </label>
    ))}
  </div>
</aside>

        <main className="products-main">
          <div className="products-topbar">
            <div className="breadcrumbs">
              <span className="breadcrumb-path">
                <Link to="/home">Home</Link> &gt; <Link to="/products/list">Products</Link> &gt;{" "}
                <span className="current">
                  {activeSegment?.title || "All Products"}
                </span>
              </span>
            </div>

            <div className="topbar-divider"></div>

            <div className="sort-by">
              <label htmlFor="products-sort">Sort By</label>
              <div className="sort-dropdown">
  <button
    className="sort-dropdown-btn"
    onClick={() => setSortOpen(!sortOpen)}
  >
    {sortBy === "Newest" ? "Newest" : sortBy === "PriceHighToLow" ? "Price: High to Low" : "Price: Low to High"}
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9l6 6 6-6"/></svg>
  </button>
  {sortOpen && (
    <div className="sort-dropdown-menu">
      <button onClick={() => { setSortBy("Newest"); setSortOpen(false); }}>Newest</button>
      <button onClick={() => { setSortBy("PriceLowToHigh"); setSortOpen(false); }}>Price: Low to High</button>
      <button onClick={() => { setSortBy("PriceHighToLow"); setSortOpen(false); }}>Price: High to Low</button>
    </div>
  )}
</div>
            </div>
          </div>

          

          <div className="products-grid-custom">
            {filteredProducts.length > 0 ? (
              filteredProducts.map((product) => (
                <div key={product.id} className="grid-product-card">
                  <Link to={`/product/${product.id}`} style={{ textDecoration: "none", color: "inherit", display: "block" }}>
                    <div className="grid-product-image">
                      {product.image && !brokenImages[product.id] ? (
                        <img
                          src={product.image}
                          alt={product.name}
                          loading="lazy"           
                          onError={() => handleImageError(product.id)}
                        />
                      ) : (
                        <div className="grid-product-image-fallback">
                          <span>📷 No Image</span>
                        </div>
                      )}
                    </div>
                    <div className="product-color-dots">
                      <span></span>
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>

                    <h4 style={{ margin: "12px 0 6px" }}>{product.name}</h4>
                  </Link>

                  <p className="grid-product-category">
                    {product.category || "Collection item"}
                  </p>

                  <p className="product-price">
                    රු{product.price?.toLocaleString()}
                  </p>

                  <p className="product-installment">
                    or 3 x රු
                    {(Number(product.price || 0) / 3).toLocaleString(
                      undefined,
                      {
                        maximumFractionDigits: 2,
                      },
                    )}{" "}
                    with
                    <img src={kokoLogo} alt="koko" className="koko-logo" />
                  </p>
                  <div className="product-card-actions">
                    <button
                      className="add-to-cart-btn"
                      onClick={() => handleAddToCart(product)}
                    >
                      Add to Cart
                    </button>
                    <button
                      className="buy-now-btn"
                      onClick={() => handleBuyNow(product)}
                    >
                      Buy Now
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <p className="no-results">
                No products matched this collection yet. Try clearing a filter
                or browsing a different category.
              </p>
            )}
          </div>
        </main>
      </div>

      <Footer />
    </div>
  );
};

export default Products;
