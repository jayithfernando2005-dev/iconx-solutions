import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { db } from "../firebase";
import {
  CART_EVENT,
  clearCart,
  getCartItems,
  getCartSubtotal,
  removeCartItem,
  updateCartItemQuantity,
} from "../utils/cart";
import "./CartPage.css";
import { ShoppingCart } from "lucide-react";

function formatLkr(value) {
  return new Intl.NumberFormat("en-LK", {
    style: "currency",
    currency: "LKR",
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);
}

export default function CartPage() {
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState([]);
  const [customer, setCustomer] = useState({
    fullName: "",
    phone: "",
    email: "",
    address: "",
  });
  const [placingOrder, setPlacingOrder] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const syncCart = () => {
      setCartItems(getCartItems());
    };

    syncCart();
    window.addEventListener(CART_EVENT, syncCart);
    window.addEventListener("storage", syncCart);

    return () => {
      window.removeEventListener(CART_EVENT, syncCart);
      window.removeEventListener("storage", syncCart);
    };
  }, []);

  const subtotal = getCartSubtotal();
  const deliveryFee = cartItems.length ? 1500 : 0;
  const total = subtotal + deliveryFee;

  const handleQuantityChange = (id, nextQuantity) => {
    updateCartItemQuantity(id, nextQuantity);
    setCartItems(getCartItems());
  };

  const handleRemove = (id) => {
    removeCartItem(id);
    setCartItems(getCartItems());
  };

  const validateCustomerDetails = () => {
    const nameRegex = /^[A-Za-z\s]+$/;
    const phoneRegex = /^[0-9]{10}$/;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!customer.fullName.trim()) {
      return "Please enter your full name.";
    }

    if (!nameRegex.test(customer.fullName.trim())) {
      return "Full name should contain only letters.";
    }

    if (!customer.phone.trim()) {
      return "Please enter your phone number.";
    }

    if (!phoneRegex.test(customer.phone.trim())) {
      return "Phone number must contain exactly 10 digits.";
    }

    if (!customer.email.trim()) {
      return "Please enter your email address.";
    }

    if (!emailRegex.test(customer.email.trim())) {
      return "Please enter a valid email address.";
    }

    if (!customer.address.trim()) {
      return "Please enter your delivery address.";
    }

    if (customer.address.trim().length < 10) {
      return "Delivery address must be at least 10 characters long.";
    }

    return "";
  };

  const handlePlaceOrder = async (e) => {
    e.preventDefault();

    if (!cartItems.length) {
      setError("Your cart is empty.");
      return;
    }

    const validationError = validateCustomerDetails();

    if (validationError) {
      setError(validationError);
      return;
    }

    setPlacingOrder(true);
    setError("");

    try {
      const orderPayload = {
        customer: {
          fullName: customer.fullName.trim(),
          phone: customer.phone.trim(),
          email: customer.email.trim(),
          address: customer.address.trim(),
        },
        items: cartItems,
        subtotal,
        deliveryFee,
        total,
        status: "pending",
        createdAt: serverTimestamp(),
      };

      const orderRef = await addDoc(collection(db, "orders"), orderPayload);
      clearCart();
      navigate("/order-success", {
        state: {
          orderId: orderRef.id,
          total,
          customerName: customer.fullName,
        },
      });
    } catch (err) {
      setError("We couldn't place the order right now. Please try again.");
    } finally {
      setPlacingOrder(false);
    }
  };

  return (
    <>
      <Header />

      <main className="cart-page">
        <section className="cart-hero">
          <div>
            <p className="cart-kicker">Your Cart</p>
            <h1 className="gradient-text-z">Review your order before checkout</h1>
          </div>
          <div className="cart-hero-total">
            <span>Current total</span>
            <strong>{formatLkr(total)}</strong>
          </div>
        </section>

        <section className="cart-layout">
          <div className="cart-items-panel">
            <div className="cart-panel-head">
              <p className="cart-kicker-b">Cart Items</p>
              {cartItems.length > 0 && (
                <button
                  type="button"
                  className="cart-clear-btn"
                  onClick={() => {
                    clearCart();
                    setCartItems([]);
                  }}
                >
                  Clear Cart
                </button>
              )}
            </div>

            {cartItems.length === 0 ? (
              <div className="cart-empty-state">
                <ShoppingCart className="empty-cart-icon" />
                <h3>Your cart is currently empty!</h3>
                <p>Add products from the collection page to start your order.</p>
                <Link to="/products" className="cart-shop-btn">
                  Continue shopping
                </Link>
              </div>
            ) : (
              <div className="cart-items-list">
                {cartItems.map((item) => (
                  <article className="cart-item-card" key={item.id}>
                    <div className="cart-item-image">
                      <img src={item.image} alt={item.name} />
                    </div>
                    <div className="cart-item-info">
                      <h3>{item.name}</h3>
                      <p>{formatLkr(item.price)}</p>
                    </div>
                    <div className="cart-item-controls">
                      <div className="cart-qty">
                        <button
                          type="button"
                          onClick={() =>
                            handleQuantityChange(item.id, (item.quantity || 1) - 1)
                          }
                        >
                          -
                        </button>
                        <span>{item.quantity || 1}</span>
                        <button
                          type="button"
                          onClick={() =>
                            handleQuantityChange(item.id, (item.quantity || 1) + 1)
                          }
                        >
                          +
                        </button>
                      </div>
                      <strong className="cartItemright">
                        {formatLkr((item.price || 0) * (item.quantity || 1))}
                      </strong>
                      <button
                        type="button"
                        className="cart-remove-btn"
                        onClick={() => handleRemove(item.id)}
                      >
                        Remove
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>

          <aside className="cart-summary-panel">
            <div className="cart-summary-card">
              <p className="cart-kicker-a">Checkout</p>
              <h2 className="gradient-text-buy">Buy now</h2>
              <div className="cart-summary-rows">
                <div>
                  <span>Subtotal</span>
                  <strong>{formatLkr(subtotal)}</strong>
                </div>
                <div>
                  <span>Delivery</span>
                  <strong>{formatLkr(deliveryFee)}</strong>
                </div>
                <div className="cart-summary-total">
                  <span>Total</span>
                  <strong>{formatLkr(total)}</strong>
                </div>
              </div>

              <form className="cart-order-form" onSubmit={handlePlaceOrder}>
                <input
                  type="text"
                  placeholder="Full name"
                  value={customer.fullName}
                  onChange={(e) =>
                    setCustomer((prev) => ({ ...prev, fullName: e.target.value }))
                  }
                />
                <input
                  type="tel"
                  placeholder="Phone number"
                  value={customer.phone}
                  maxLength="10"
                  onChange={(e) =>
                    setCustomer((prev) => ({
                      ...prev,
                      phone: e.target.value.replace(/[^0-9]/g, ""),
                    }))
                  }
                />
                <input
                  type="email"
                  placeholder="Email address"
                  value={customer.email}
                  onChange={(e) =>
                    setCustomer((prev) => ({ ...prev, email: e.target.value }))
                  }
                />
                <textarea
                  rows="4"
                  placeholder="Delivery address"
                  value={customer.address}
                  onChange={(e) =>
                    setCustomer((prev) => ({ ...prev, address: e.target.value }))
                  }
                />

                {error && <div className="cart-error-msg">{error}</div>}

                <button
                  type="submit"
                  className="cart-buy-btn"
                  disabled={placingOrder || !cartItems.length}
                >
                  {placingOrder ? "Placing Order..." : "Buy now"}
                </button>
              </form>
            </div>
          </aside>
        </section>
      </main>

      <Footer />
    </>
  );
}