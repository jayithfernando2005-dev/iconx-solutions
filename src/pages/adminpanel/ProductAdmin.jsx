/**
 * ProductAdmin.js
 * ─────────────────────────────────────────────
 * Product Management component for iconX Admin.
 * Rendered by AdminPanel when tab === 'product'.
 *
 * Contains two sub-views (no routing needed):
 *   "list"   → Product list table
 *   "add"    → Add / Edit product form
 *
 * Firebase collections used:
 *   products  → { name, brands, category, price,
 *                 stock_in, description, status,
 *                 image (URL), createdAt }
 *
 * Cloudinary:
 *   uploads image file and returns secure_url
 * ─────────────────────────────────────────────
 */

import { useState, useEffect } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { db } from "../../firebase";
import { uploadImageToCloudinary } from "../../utils/cloudinary";
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
} from "firebase/firestore";
import "./ProductAdmin.css";

/* ── Utility ── */
const fmt = (n) =>
  "Rs " +
  new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(n);

const EMPTY_FORM = {
  name: "",
  brands: "",
  category: "",
  price: "",
  stock_in: "",
  description: "",
  status: "ACTIVE",
  longDescription: "",
  detailImage1: "",
  detailImage2: "",
  detailImage3: "",
  warranty: "",
  support: "",
  specifications: [],
};

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const IMAGE_URL_REGEX = /^https?:\/\/.+/i;

const getUploadErrorMessage = (err) => {
  const message = err?.message || "";

  if (message.toLowerCase().includes("cloudinary")) {
    return "Image upload failed on Cloudinary. Check your Cloudinary preset and cloud name.";
  }

  if (message.toLowerCase().includes("permission")) {
    return "Firestore blocked the request. Check your Firestore rules.";
  }

  return "Failed to save the product. Please try again.";
};

const PRODUCT_REPORT_COLORS = [
  "#00d2fe",
  "#00e676",
  "#ffb300",
  "#ff5252",
  "#7c4dff",
];

const buildProductChart = (type, opts = {}) => {
  const canvas = document.createElement("canvas");
  const width = opts.width || 520;
  const height = opts.height || 190;
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#111318";
  ctx.fillRect(0, 0, width, height);

  if (type === "bar") {
    const labels = opts.labels || [];
    const values = opts.values || [];
    const color = opts.color || "#00d2fe";
    const pad = { top: 20, right: 16, bottom: 32, left: 42 };
    const chartWidth = width - pad.left - pad.right;
    const chartHeight = height - pad.top - pad.bottom;
    const max = Math.max(...values, 1);
    const step = chartWidth / Math.max(values.length, 1);
    const barWidth = Math.min(30, step * 0.55);

    values.forEach((value, index) => {
      const barHeight = Math.max(4, (value / max) * chartHeight);
      const x = pad.left + index * step + (step - barWidth) / 2;
      const y = pad.top + chartHeight - barHeight;
      const gradient = ctx.createLinearGradient(0, y, 0, y + barHeight);
      gradient.addColorStop(0, color);
      gradient.addColorStop(1, `${color}33`);
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.roundRect(x, y, barWidth, barHeight, 4);
      ctx.fill();
      ctx.fillStyle = "#9aa0aa";
      ctx.font = "10px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(
        String(labels[index] || "").slice(0, 10),
        x + barWidth / 2,
        height - 8
      );
    });
  }

  if (type === "donut") {
    const slices = opts.slices || [];
    const total = slices.reduce((sum, slice) => sum + slice.value, 0) || 1;
    const cx = width * 0.3;
    const cy = height / 2;
    const outerRadius = Math.min(68, cy - 12);
    const innerRadius = outerRadius * 0.58;
    let angle = -Math.PI / 2;

    slices.forEach((slice) => {
      const sweep = (slice.value / total) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, outerRadius, angle, angle + sweep);
      ctx.closePath();
      ctx.fillStyle = slice.color;
      ctx.fill();
      angle += sweep;
    });

    ctx.beginPath();
    ctx.arc(cx, cy, innerRadius, 0, Math.PI * 2);
    ctx.fillStyle = "#111318";
    ctx.fill();
    ctx.fillStyle = "#f5f5f7";
    ctx.font = "bold 16px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(
      String(slices.reduce((sum, slice) => sum + slice.value, 0)),
      cx,
      cy + 4
    );

    let legendY = 28;
    slices.forEach((slice) => {
      ctx.fillStyle = slice.color;
      ctx.fillRect(width * 0.6, legendY, 10, 10);
      ctx.fillStyle = "#f5f5f7";
      ctx.font = "11px sans-serif";
      ctx.textAlign = "left";
      ctx.fillText(
        `${slice.label}: ${slice.value}`,
        width * 0.6 + 16,
        legendY + 9
      );
      legendY += 26;
    });
  }

  return canvas.toDataURL("image/png");
};

const exportProductsPdf = (products) => {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageWidth = 210;
  const margin = 14;
  const activeCount = products.filter(
    (product) => (product.status || "ACTIVE") === "ACTIVE"
  ).length;
  const totalStock = products.reduce(
    (sum, product) => sum + (Number(product.stock_in) || 0),
    0
  );
  const inventoryValue = products.reduce(
    (sum, product) =>
      sum + (Number(product.price) || 0) * (Number(product.stock_in) || 0),
    0
  );
  const topCategories = Object.entries(
    products.reduce((acc, product) => {
      const key = product.category || "Unknown";
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {})
  )
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);

  doc.setFillColor(9, 10, 15);
  doc.rect(0, 0, pageWidth, 297, "F");
  doc.setFillColor(0, 210, 254);
  doc.rect(0, 0, pageWidth, 2, "F");
  doc.setTextColor(245, 245, 247);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text("Product Inventory Report", margin, 18);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(160, 166, 176);
  doc.text(new Date().toLocaleDateString("en-GB"), pageWidth - margin, 18, {
    align: "right",
  });

  const cards = [
    ["Products", products.length],
    ["Active", activeCount],
    ["Stock Units", totalStock],
    ["Inventory Value", fmt(inventoryValue)],
  ];
  const cardWidth = (pageWidth - margin * 2 - 9) / 4;
  cards.forEach(([label, value], index) => {
    const x = margin + index * (cardWidth + 3);
    doc.setFillColor(17, 19, 24);
    doc.roundedRect(x, 28, cardWidth, 20, 2, 2, "F");
    doc.setTextColor(160, 166, 176);
    doc.text(String(label), x + 4, 36);
    doc.setTextColor(245, 245, 247);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.text(String(value), x + 4, 44);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
  });

  doc.setTextColor(245, 245, 247);
  doc.setFont("helvetica", "bold");
  doc.text("Category Spread", margin, 60);
  doc.addImage(
    buildProductChart("bar", {
      labels: topCategories.map(([label]) => label),
      values: topCategories.map(([, value]) => value),
      color: "#00d2fe",
      width: 540,
      height: 190,
    }),
    "PNG",
    margin,
    64,
    pageWidth - margin * 2,
    44
  );

  doc.text("Status Mix", margin, 116);
  doc.addImage(
    buildProductChart("donut", {
      slices: [
        {
          label: "Active",
          value: activeCount,
          color: PRODUCT_REPORT_COLORS[1],
        },
        {
          label: "Inactive",
          value: Math.max(products.length - activeCount, 0),
          color: PRODUCT_REPORT_COLORS[3],
        },
      ],
      width: 540,
      height: 200,
    }),
    "PNG",
    margin,
    120,
    pageWidth - margin * 2,
    48
  );

  autoTable(doc, {
    startY: 176,
    head: [["Name", "Brand", "Category", "Price", "Stock", "Status"]],
    body: products.slice(0, 24).map((product) => [
      product.name || "—",
      product.brands || "—",
      product.category || "—",
      fmt(product.price),
      product.stock_in ?? "—",
      product.status || "ACTIVE",
    ]),
    theme: "plain",
    headStyles: {
      fillColor: [17, 19, 24],
      textColor: [160, 166, 176],
      fontSize: 8,
    },
    bodyStyles: {
      fillColor: [9, 10, 15],
      textColor: [245, 245, 247],
      fontSize: 8,
    },
    alternateRowStyles: { fillColor: [17, 19, 24] },
    margin: { left: margin, right: margin },
  });

  doc.save("product_inventory_report.pdf");
};

/* ═══════════════════════════════════════════════════
   ADD / EDIT PRODUCT FORM
═══════════════════════════════════════════════════ */
function ProductForm({ existing, onBack, notify }) {
  const [form, setForm] = useState(
    existing
      ? {
          name: existing.name || "",
          brands: existing.brands || "",
          category: existing.category || "",
          price: existing.price || "",
          stock_in: existing.stock_in || "",
          description: existing.description || "",
          status: existing.status || "ACTIVE",
          longDescription: existing.longDescription || "",
          detailImage1: existing.detailImage1 || "",
          detailImage2: existing.detailImage2 || "",
          detailImage3: existing.detailImage3 || "",
          warranty: existing.warranty || "",
          support: existing.support || "",
        }
      : { ...EMPTY_FORM }
  );

  const [specs, setSpecs] = useState(existing?.specifications || []);

  const addSpecRow = () => {
    setSpecs([...specs, { label: "", value: "" }]);
  };

  const removeSpecRow = (idx) => {
    setSpecs(specs.filter((_, i) => i !== idx));
  };

  const handleSpecChange = (idx, field, val) => {
    const updated = [...specs];
    updated[idx][field] = val;
    setSpecs(updated);
  };

  const [imageFile, setImageFile] = useState(null);
  const [imageUrlInput, setImageUrlInput] = useState(existing?.image || "");
  const [preview, setPreview] = useState(existing?.image || null);

  // Detail images (Cloudinary upload)
  const [detailPreviews, setDetailPreviews] = useState([
    existing?.detailImage1 || null,
    existing?.detailImage2 || null,
    existing?.detailImage3 || null,
  ]);
  const [detailUploading, setDetailUploading] = useState([false, false, false]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    return () => {
      if (preview?.startsWith("blob:")) {
        URL.revokeObjectURL(preview);
      }
    };
  }, [preview]);

  const up = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
    setError("");
  };

  const onImage = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please choose a valid image file.");
      return;
    }

    if (file.size > MAX_IMAGE_SIZE) {
      setError(
        "Image must be smaller than 5MB. You can still paste an Image URL below and save the product."
      );
      return;
    }

    if (preview?.startsWith("blob:")) {
      URL.revokeObjectURL(preview);
    }

    setImageFile(file);
    setPreview(URL.createObjectURL(file));
    setError("");
  };

  const onImageUrlChange = (e) => {
    const value = e.target.value;
    setImageUrlInput(value);

    if (!imageFile) {
      setPreview(value.trim() || null);
    }

    setError("");
  };

  const onDetailImage = async (e, idx) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError(`Detail image ${idx + 1}: Please choose a valid image file.`);
      return;
    }
    if (file.size > MAX_IMAGE_SIZE) {
      setError(`Detail image ${idx + 1}: Image must be smaller than 5MB.`);
      return;
    }

    // Show local preview immediately
    const objectUrl = URL.createObjectURL(file);
    setDetailPreviews((prev) => {
      const updated = [...prev];
      updated[idx] = objectUrl;
      return updated;
    });

    // Upload to Cloudinary right away
    setDetailUploading((prev) => {
      const updated = [...prev];
      updated[idx] = true;
      return updated;
    });

    try {
      const url = await uploadImageToCloudinary(file);
      // Store the Cloudinary URL directly into form
      const fieldName = `detailImage${idx + 1}`;
      setForm((p) => ({ ...p, [fieldName]: url }));
      setDetailPreviews((prev) => {
        const updated = [...prev];
        updated[idx] = url;
        return updated;
      });
    } catch (err) {
      setError(`Detail image ${idx + 1}: Upload failed — ${err.message}`);
      setDetailPreviews((prev) => {
        const updated = [...prev];
        updated[idx] = existing?.[`detailImage${idx + 1}`] || null;
        return updated;
      });
    } finally {
      setDetailUploading((prev) => {
        const updated = [...prev];
        updated[idx] = false;
        return updated;
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.name.trim()) return setError("Product name is required.");
    if (!form.brands.trim()) return setError("Brand is required.");
    if (!form.category.trim()) return setError("Category is required.");
    if (!form.price) return setError("Price is required.");
    if (!form.stock_in) return setError("Stock count is required.");
    if (Number.isNaN(Number(form.price)) || Number(form.price) < 0) {
      return setError("Price must be a valid non-negative number.");
    }
    if (!Number.isInteger(Number(form.stock_in)) || Number(form.stock_in) < 0) {
      return setError("Stock count must be a valid non-negative whole number.");
    }
    if (imageUrlInput.trim() && !IMAGE_URL_REGEX.test(imageUrlInput.trim())) {
      return setError("Please enter a valid image URL.");
    }

    if (!existing && !imageFile && !imageUrlInput.trim()) {
      return setError(
        "Product image is required. Upload a file or paste an image URL."
      );
    }

    setLoading(true);
    setError("");

    try {
      let imageUrl = imageUrlInput.trim() || existing?.image || "";

      if (imageFile) {
        console.log("Uploading to Cloudinary...");
        imageUrl = await uploadImageToCloudinary(imageFile);
        console.log("Cloudinary URL:", imageUrl);
      }

      const payload = {
        ...form,
        price: parseFloat(form.price),
        stock_in: parseInt(form.stock_in, 10),
        image: imageUrl,
        specifications: specs,
      };

      if (existing) {
        await updateDoc(doc(db, "products", existing.id), {
          ...payload,
          updatedAt: serverTimestamp(),
        });
        notify && notify(`Product "${payload.name}" updated successfully.`, 'success', 'Product Details');
      } else {
        await addDoc(collection(db, "products"), {
          ...payload,
          createdAt: serverTimestamp(),
        });
        notify && notify(`Product "${payload.name}" added successfully.`, 'success', 'Product Details');
      }

      onBack();
    } catch (err) {
      console.error("Save product error:", err);
      const errMsg = getUploadErrorMessage(err);
      setError(errMsg);
      notify && notify(`Failed to save product: ${errMsg}`, 'error', 'Product Details');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-main">
      <header className="admin-header">
        <div className="header-with-back">
          <button className="btn-back" onClick={onBack}>
            ←
          </button>
          <h1>{existing ? "EDIT PRODUCT" : "ADD NEW PRODUCT"}</h1>
        </div>
      </header>

      <div className="admin-content">
        {error && (
          <div
            style={{
              background: "rgba(255,82,82,0.1)",
              border: "1px solid rgba(255,82,82,0.3)",
              borderRadius: 8,
              padding: "10px 16px",
              color: "#ff5252",
              fontSize: 13,
              marginBottom: 20,
            }}
          >
            {error}
          </div>
        )}

        <form className="add-product-form" onSubmit={handleSubmit} noValidate>
          <div className="form-grid">
            <div className="form-group">
              <label>Product Name *</label>
              <input
                name="name"
                type="text"
                value={form.name}
                onChange={up}
                placeholder="e.g. iPhone 15 Pro Max"
                required
              />
            </div>

            <div className="form-group">
              <label>Status</label>
              <select name="status" value={form.status} onChange={up}>
                <option value="ACTIVE">ACTIVE</option>
                <option value="INACTIVE">INACTIVE</option>
              </select>
            </div>

            <div className="form-group">
              <label>Brand *</label>
              <input
                name="brands"
                type="text"
                value={form.brands}
                onChange={up}
                placeholder="e.g. Apple"
                required
              />
            </div>

            <div className="form-group">
              <label>Category *</label>
              <input
                name="category"
                type="text"
                value={form.category}
                onChange={up}
                placeholder="e.g. Smartphones"
                required
              />
            </div>

            <div className="form-group">
              <label>Price (LKR) *</label>
              <input
                name="price"
                type="number"
                value={form.price}
                onChange={up}
                placeholder="0.00"
                min="0"
                step="0.01"
                required
              />
            </div>

            <div className="form-group">
              <label>Stock In *</label>
              <input
                name="stock_in"
                type="number"
                value={form.stock_in}
                onChange={up}
                placeholder="0"
                min="0"
                required
              />
            </div>

            <div className="form-group full-width">
              <label>Description</label>
              <textarea
                name="description"
                value={form.description}
                onChange={up}
                rows={4}
                placeholder="Enter product description..."
              />
            </div>

            <div className="form-group full-width">
              <label>Product Image</label>
              <div
                className="image-upload-wrapper"
                onClick={() =>
                  document.getElementById("prod-img-input")?.click()
                }
              >
                <input
                  id="prod-img-input"
                  type="file"
                  accept="image/*"
                  onChange={onImage}
                  style={{ display: "none" }}
                />

                {preview ? (
                  <img src={preview} alt="preview" className="image-preview" />
                ) : (
                  <div style={{ textAlign: "center", color: "#666" }}>
                    <div style={{ fontSize: 32, marginBottom: 8 }}>📷</div>
                    <div style={{ fontSize: 13 }}>Click to upload image</div>
                  </div>
                )}

                {imageFile && <span className="file-name">{imageFile.name}</span>}
              </div>

              <div className="image-input-hint">
                Upload a file smaller than 5MB. The image will be uploaded to
                Cloudinary and its link will be saved in Firestore.
              </div>
            </div>

            <div className="form-group full-width">
              <label>Image URL</label>
              <input
                name="imageUrl"
                type="url"
                value={imageUrlInput}
                onChange={onImageUrlChange}
                placeholder="https://example.com/product-image.jpg"
              />
            </div>

            {/* Rich Product Details Section */}
            <div className="form-group full-width" style={{ marginTop: 24 }}>
              <h3 style={{ fontSize: 15, color: "var(--accent)", marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.5px" }}>Rich Details & Technical Specifications</h3>
            </div>

            <div className="form-group full-width">
              <label>Detailed Description (Supports paragraphs & multi-line text)</label>
              <textarea
                name="longDescription"
                value={form.longDescription || ""}
                onChange={up}
                rows={5}
                placeholder="Enter rich details, features or warranty/support descriptions..."
              />
            </div>

            <div className="form-group">
              <label>Warranty Period / Type</label>
              <input
                name="warranty"
                type="text"
                value={form.warranty || ""}
                onChange={up}
                placeholder="e.g. Apple Care, 1 Year Shop Warranty"
              />
            </div>

            <div className="form-group">
              <label>Support Coverage</label>
              <input
                name="support"
                type="text"
                value={form.support || ""}
                onChange={up}
                placeholder="e.g. Official Support, 24/7 Helpline"
              />
            </div>

            <div className="form-group full-width">
              <label>Detail Showcase Images (Upload to Cloudinary — up to 3)</label>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginTop: 6 }}>
                {[0, 1, 2].map((idx) => (
                  <div
                    key={idx}
                    className="image-upload-wrapper"
                    style={{ height: 140, position: "relative", cursor: "pointer" }}
                    onClick={() => document.getElementById(`detail-img-${idx}`)?.click()}
                  >
                    <input
                      id={`detail-img-${idx}`}
                      type="file"
                      accept="image/*"
                      style={{ display: "none" }}
                      onChange={(e) => onDetailImage(e, idx)}
                    />
                    {detailUploading[idx] ? (
                      <div style={{ textAlign: "center", color: "var(--accent)", padding: 8 }}>
                        <div style={{ fontSize: 22, marginBottom: 6 }}>⏳</div>
                        <div style={{ fontSize: 12 }}>Uploading...</div>
                      </div>
                    ) : detailPreviews[idx] ? (
                      <>
                        <img
                          src={detailPreviews[idx]}
                          alt={`Detail ${idx + 1}`}
                          style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 8 }}
                        />
                        <div style={{
                          position: "absolute", bottom: 6, right: 8,
                          background: "rgba(0,0,0,0.55)", color: "#fff",
                          fontSize: 10, padding: "2px 7px", borderRadius: 4
                        }}>Change</div>
                      </>
                    ) : (
                      <div style={{ textAlign: "center", color: "#666" }}>
                        <div style={{ fontSize: 26, marginBottom: 6 }}>📷</div>
                        <div style={{ fontSize: 12 }}>Image {idx + 1}</div>
                        <div style={{ fontSize: 11, marginTop: 3, color: "#888" }}>Click to upload</div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <div className="image-input-hint" style={{ marginTop: 8 }}>
                Images are uploaded directly to Cloudinary. Max 5MB each.
              </div>
            </div>

            <div className="form-group full-width" style={{ marginTop: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <label style={{ margin: 0 }}>Specification List</label>
                <button
                  type="button"
                  onClick={addSpecRow}
                  style={{
                    padding: "6px 12px",
                    background: "var(--accent)",
                    color: "#fff",
                    border: "none",
                    borderRadius: 4,
                    cursor: "pointer",
                    fontSize: 12,
                    fontWeight: "bold",
                  }}
                >
                  + Add Spec Row
                </button>
              </div>

              {specs.length === 0 ? (
                <div style={{ padding: 12, background: "rgba(255,255,255,0.02)", border: "1px dashed var(--border)", borderRadius: 6, color: "var(--text-dim)", fontSize: 12, textAlign: "center" }}>
                  No specifications added. Click "+ Add Spec Row" to define technical specs.
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {specs.map((spec, idx) => (
                    <div key={idx} style={{ display: "flex", gap: 10, alignItems: "center" }}>
                      <input
                        type="text"
                        placeholder="Spec Name (e.g. Storage)"
                        value={spec.label}
                        onChange={(e) => handleSpecChange(idx, "label", e.target.value)}
                        style={{ flex: 1, padding: "8px", border: "1px solid var(--border)", background: "var(--surface)", color: "#fff", borderRadius: 4 }}
                      />
                      <input
                        type="text"
                        placeholder="Spec Value (e.g. 128GB, 256GB)"
                        value={spec.value}
                        onChange={(e) => handleSpecChange(idx, "value", e.target.value)}
                        style={{ flex: 2, padding: "8px", border: "1px solid var(--border)", background: "var(--surface)", color: "#fff", borderRadius: 4 }}
                      />
                      <button
                        type="button"
                        onClick={() => removeSpecRow(idx)}
                        style={{
                          background: "var(--red)",
                          color: "#fff",
                          border: "none",
                          width: 32,
                          height: 32,
                          borderRadius: 4,
                          cursor: "pointer",
                          fontWeight: "bold",
                        }}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="form-actions">
            <button type="button" className="btn-cancel" onClick={onBack}>
              CANCEL
            </button>
            <button type="submit" className="btn-save" disabled={loading}>
              {loading
                ? "SAVING..."
                : existing
                ? "SAVE CHANGES"
                : "ADD PRODUCT"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   PRODUCT LIST
═══════════════════════════════════════════════════ */
function ProductList({ onAdd, onEdit, notify }) {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [catFilter, setCat] = useState("all");
  const [statusFilter, setStatus] = useState("all");
  const [loading, setLoading] = useState(true);
  const [brokenImages, setBrokenImages] = useState({});

  useEffect(() => {
    const q = query(collection(db, "products"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(
      q,
      (snap) => {
        setProducts(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setLoading(false);
      },
      (err) => {
        console.error("Products load:", err);
        setLoading(false);
      }
    );

    return unsub;
  }, []);

  const handleDelete = async (id, name) => {
    if (!window.confirm("Delete this product?")) return;

    try {
      await deleteDoc(doc(db, "products", id));
      notify && notify(`Product "${name}" deleted successfully.`, 'warn', 'Product Details');
    } catch (e) {
      console.error("Delete product:", e);
      notify && notify(`Failed to delete product: ${e.message}`, 'error', 'Product Details');
    }
  };

  const markImageBroken = (id) => {
    setBrokenImages((prev) => (prev[id] ? prev : { ...prev, [id]: true }));
  };

  const categories = [
    "all",
    ...new Set(products.map((p) => p.category).filter(Boolean)),
  ];

  const shown = products.filter((p) => {
    const matchSearch =
      !search ||
      p.name?.toLowerCase().includes(search.toLowerCase()) ||
      p.brands?.toLowerCase().includes(search.toLowerCase());

    const matchCat = catFilter === "all" || p.category === catFilter;
    const matchStatus =
      statusFilter === "all" ||
      (p.status || "ACTIVE").toLowerCase() === statusFilter;

    return matchSearch && matchCat && matchStatus;
  });

  const activeCount = shown.filter(
    (product) => (product.status || "ACTIVE") === "ACTIVE"
  ).length;

  const stockUnits = shown.reduce(
    (sum, product) => sum + (Number(product.stock_in) || 0),
    0
  );

  const inventoryValue = shown.reduce(
    (sum, product) =>
      sum + (Number(product.price) || 0) * (Number(product.stock_in) || 0),
    0
  );

  return (
    <div className="admin-main">
      <header className="admin-header">
        <h1>PRODUCT DETAILS</h1>
      </header>

      <div className="admin-content">
        <div className="admin-toolbar">
          <div className="left-actions">
            <button className="btn-add" onClick={onAdd}>
              + ADD PRODUCT
            </button>
            <button className="btn-print" onClick={() => exportProductsPdf(shown)}>
              REPORT PDF
            </button>
          </div>

          <div className="filters">
            <div className="filter-item">
              <label>Search</label>
              <input
                type="text"
                placeholder="Name or brand..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div className="filter-item">
              <label>Category</label>
              <select value={catFilter} onChange={(e) => setCat(e.target.value)}>
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c === "all" ? "All Categories" : c}
                  </option>
                ))}
              </select>
            </div>

            <div className="filter-item">
              <label>Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option value="all">All</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
        </div>

        <div className="table-controls">
          Showing <strong>{shown.length}</strong> of {products.length} products
        </div>

        <div className="product-report-stats">
          <div className="product-report-card">
            <span>Total Products</span>
            <strong>{shown.length}</strong>
          </div>
          <div className="product-report-card">
            <span>Active Products</span>
            <strong>{activeCount}</strong>
          </div>
          <div className="product-report-card">
            <span>Stock Units</span>
            <strong>{stockUnits}</strong>
          </div>
          <div className="product-report-card">
            <span>Inventory Value</span>
            <strong>{fmt(inventoryValue)}</strong>
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: "60px 0", color: "#666" }}>
            Loading products...
          </div>
        ) : shown.length === 0 ? (
          <div className="prod-empty">
            <div className="prod-empty-icon">📦</div>
            <div className="prod-empty-text">
              {products.length === 0
                ? "No products yet. Add your first product!"
                : "No products match your filters."}
            </div>
          </div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>IMAGE</th>
                <th>ITEM</th>
                <th>BRAND</th>
                <th>CATEGORY</th>
                <th>PRICE</th>
                <th>STOCK</th>
                <th>STATUS</th>
                <th>ACTION</th>
              </tr>
            </thead>

            <tbody>
              {shown.map((product) => (
                <tr key={product.id}>
                  <td>
                    {product.image && !brokenImages[product.id] ? (
                      <img
                        src={product.image}
                        alt={product.name}
                        className="product-thumb"
                        onError={() => markImageBroken(product.id)}
                      />
                    ) : (
                      <div className="product-thumb-placeholder">📱</div>
                    )}
                  </td>

                  <td style={{ fontWeight: 600 }}>{product.name}</td>
                  <td style={{ color: "#aaa" }}>{product.brands}</td>
                  <td>{product.category}</td>
                  <td style={{ color: "var(--accent-green)", fontWeight: 600 }}>
                    {fmt(product.price)}
                  </td>
                  <td>{product.stock_in ?? "—"}</td>
                  <td>
                    <span
                      className={
                        "status-badge " + (product.status || "ACTIVE").toLowerCase()
                      }
                    >
                      {product.status || "ACTIVE"}
                    </span>
                  </td>
                  <td>
                    <div className="actions-cell">
                      <button
                        className="btn-edit"
                        title="Edit"
                        onClick={() => onEdit(product)}
                      >
                        ✏
                      </button>
                      <button
                        className="btn-delete"
                        title="Delete"
                        onClick={() => handleDelete(product.id, product.name)}
                      >
                        ✕
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   ROOT EXPORT — rendered by AdminPanel tab === 'product'
═══════════════════════════════════════════════════ */
export default function ProductAdmin({ notify }) {
  const [view, setView] = useState("list");
  const [editing, setEditing] = useState(null);

  const goAdd = () => {
    setEditing(null);
    setView("add");
  };

  const goEdit = (p) => {
    setEditing(p);
    setView("edit");
  };

  const goBack = () => {
    setEditing(null);
    setView("list");
  };

  if (view === "add" || view === "edit") {
    return <ProductForm existing={editing} onBack={goBack} notify={notify} />;
  }

  return <ProductList onAdd={goAdd} onEdit={goEdit} notify={notify} />;
}
