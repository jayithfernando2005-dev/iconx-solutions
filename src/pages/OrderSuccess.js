import React, { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Check, Download } from "lucide-react";
import jsPDF from "jspdf";
import Header from "../components/Header";
import Footer from "../components/Footer";
import logo from "../assets/iconx-logo.jpg";
import { loadLogo, drawHeader, drawFooter, drawSectionHeader, drawDetailCard, PDF_COLORS } from "../utils/pdfTheme";
import "./OrderSuccess.css";

function formatLkr(value) {
  return new Intl.NumberFormat("en-LK", {
    style: "currency",
    currency: "LKR",
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);
}

export default function OrderSuccess() {
  const { state } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handleDownloadReceipt = async () => {
    const doc = new jsPDF();
    const logoImg = await loadLogo(logo);

    const customerName = state?.customerName || "Customer";
    const orderId = state?.orderId || "Pending confirmation";
    const total = formatLkr(state?.total || 0);

    // Header
    drawHeader(doc, logoImg, "Order Receipt", "Invoice for order #" + orderId, { id: orderId });

    // Customer & Order details
    let y = 42;
    y = drawSectionHeader(doc, "Customer & Order Summary", y);

    const details = [
      { label: "Customer Name", value: customerName },
      { label: "Order ID", value: orderId },
      { label: "Order Status", value: "Successful (Paid)" },
      { label: "Grand Total", value: total }
    ];
    y = drawDetailCard(doc, details, 15, y, 180);

    // Message details
    y = drawSectionHeader(doc, "Important Information", y + 4);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);
    doc.setTextColor(...PDF_COLORS.primary);
    
    doc.text("Thank you for your purchase. We appreciate your business!", 15, y + 2);
    doc.text("Our fulfillment team will contact you shortly to confirm your order and schedule delivery.", 15, y + 8);
    doc.text("Please keep this receipt for your records. For any inquiries, reach us at support@iconx.lk.", 15, y + 14);

    // Footer
    drawFooter(doc, 1, 1, "IconX Receipt");

    doc.save(`IconX-Receipt-${state?.orderId || "order"}.pdf`);
  };

  return (
    <>
      <Header />

      <main className="order-success-page">
        <section className="order-success-card">
          <div className="order-success-icon">
            <Check size={46} strokeWidth={2.4} />
          </div>

          <h1>Order Confirmed!</h1>

          <p className="order-success-message">
            We have received your order and our team will contact you soon.
            <br />
            Your order number is{" "}
            <strong className="order">
              {state?.orderId || "Pending confirmation"}
            </strong>
          </p>

          <div className="order-summary-box">
            <h2>Order Summary</h2>

            <div className="order-summary-row">
              <span>Customer</span>
              <strong className="order">
                {state?.customerName || "Customer"}
              </strong>
            </div>

            <div className="order-summary-row">
              <span>Order ID</span>
              <strong className="order">
                {state?.orderId || "Pending confirmation"}
              </strong>
            </div>

            <div className="order-summary-total">
              <span>Total</span>
              <strong className="order">
                {formatLkr(state?.total || 0)}
              </strong>
            </div>
          </div>

          <div className="order-success-actions">
            <button
              type="button"
              className="order-success-download"
              onClick={handleDownloadReceipt}
            >
              <Download size={18} />
              Download Receipt
            </button>

            <Link to="/products" className="order-success-secondary">
              Continue Shopping
            </Link>

            <Link to="/home" className="order-success-primary">
              Back to Home
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}