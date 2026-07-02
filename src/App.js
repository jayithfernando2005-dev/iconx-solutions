import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import SplashScreen from "./pages/SplashScreen";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Resetpassword from "./pages/Resetpassword";
import AdminPanel from "./pages/adminpanel/AdminPanel";
import EmployeeAdminPanel from "./pages/adminpanel/EmployeeAdminPanel";
import ProtectedAdminRoute from "./components/ProtectedAdminRoute";
import ProtectedEmployeeRoute from "./components/ProtectedEmployeeRoute";
import Home from "./pages/Home";
import ContactReviews from "./pages/Contact.js";
import About from "./pages/About";
import ProductCategories from "./pages/ProductCategories";
import Products from "./pages/Products";
import TradeInPage from "./pages/TradeInPages";
import TradeInCalculator from "./pages/TradeInCalculator";
import CartPage from "./pages/CartPage";
import OrderSuccess from "./pages/OrderSuccess";
import TestAuth from "./TestAuth";
import ProductDetails from "./pages/ProductDetails";

function App() {
  return (
    <Router>
      <Routes>
        {/* Home / Splash */}
        <Route path="/" element={<SplashScreen />} />

        {/* Auth */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/reset-password" element={<Resetpassword />} />
        <Route path="/home" element={<Home />} />

        {/* Products */}
        <Route path="/products" element={<ProductCategories />} />
        <Route path="/products/list" element={<Products />} />
        <Route path="/product/:id" element={<ProductDetails />} />

        {/* Direct product pages */}
        <Route path="/apple" element={<Products />} />
        <Route path="/accessories" element={<Products />} />

        {/* Cart / Orders / Trade In */}
        <Route path="/cart" element={<CartPage />} />
        <Route path="/order-success" element={<OrderSuccess />} />
        <Route path="/trade-in" element={<TradeInPage />} />
        <Route path="/trade-in/calculate" element={<TradeInCalculator />} />

        {/* Admin */}
        <Route
          path="/admin"
          element={
            <ProtectedAdminRoute>
              <AdminPanel />
            </ProtectedAdminRoute>
          }
        />

        <Route
          path="/employee-admin"
          element={
            <ProtectedEmployeeRoute>
              <EmployeeAdminPanel />
            </ProtectedEmployeeRoute>
          }
        />

        {/* Contact + Reviews */}
        <Route path="/contact" element={<ContactReviews />} />
        <Route path="/service" element={<ContactReviews />} />
        <Route path="/reviews" element={<ContactReviews />} />

        {/* Other */}
        <Route path="/about" element={<About />} />
        <Route path="/test" element={<TestAuth />} />

        {/* Catch-all → splash */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;