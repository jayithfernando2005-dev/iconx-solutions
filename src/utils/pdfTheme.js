export const PDF_COLORS = {
  primary: [15, 23, 42],      // Slate 900
  secondary: [59, 130, 246],  // Blue 500
  muted: [100, 116, 139],     // Slate 500
  lightBg: [248, 250, 252],   // Slate 50
  border: [226, 232, 240],    // Slate 200
  white: [255, 255, 255],
  success: [34, 197, 94],     // Green 500
  error: [239, 68, 68],       // Red 500
};

export const loadLogo = (logoSrc) => {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = logoSrc;
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
  });
};

export const drawHeader = (doc, logoImg, title, subtitle, extraInfo = {}) => {
  const W = doc.internal.pageSize.getWidth();
  
  // Left side: Logo & Title
  if (logoImg) {
    try {
      doc.addImage(logoImg, 'JPEG', 15, 12, 26, 13);
    } catch (e) {
      console.error("Failed to add image to PDF", e);
    }
  } else {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.setTextColor(...PDF_COLORS.primary);
    doc.text("ICONX", 15, 20);
  }

  // Draw Store Name next to logo
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(...PDF_COLORS.primary);
  doc.text("ICONX MOBILE STORE", 45, 18);
  
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...PDF_COLORS.muted);
  doc.text("Premium Mobile & Accessories Store", 45, 23);

  // Right side: Page Title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(...PDF_COLORS.secondary);
  doc.text(title.toUpperCase(), W - 15, 18, { align: "right" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...PDF_COLORS.muted);
  
  let currentY = 23;
  if (subtitle) {
    doc.text(subtitle, W - 15, currentY, { align: "right" });
    currentY += 4;
  }
  
  const dateStr = extraInfo.date || new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  doc.text(`Date: ${dateStr}`, W - 15, currentY, { align: "right" });
  
  if (extraInfo.id) {
    currentY += 4;
    doc.text(`ID: ${extraInfo.id}`, W - 15, currentY, { align: "right" });
  }

  // Separator line
  doc.setDrawColor(...PDF_COLORS.secondary);
  doc.setLineWidth(0.8);
  doc.line(15, 33, W - 15, 33);
};

export const drawFooter = (doc, pageNum, totalPages, docTitle = "IconX Mobile Store") => {
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();

  // Footer Line
  doc.setDrawColor(...PDF_COLORS.border);
  doc.setLineWidth(0.5);
  doc.line(15, H - 20, W - 15, H - 20);

  // Info
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...PDF_COLORS.muted);
  doc.text(`${docTitle} | support@iconx.lk | www.iconx.lk`, 15, H - 14);

  // Page Numbers
  if (pageNum && totalPages) {
    doc.text(`Page ${pageNum} of ${totalPages}`, W - 15, H - 14, { align: "right" });
  }
};

export const drawSectionHeader = (doc, title, y) => {
  doc.setFillColor(...PDF_COLORS.secondary);
  doc.rect(15, y, 3, 6, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(...PDF_COLORS.primary);
  doc.text(title.toUpperCase(), 22, y + 5);

  return y + 10;
};

export const drawDetailCard = (doc, items, x, y, width, rowHeight = 8) => {
  const height = items.length * rowHeight + 6;
  doc.setFillColor(...PDF_COLORS.lightBg);
  doc.setDrawColor(...PDF_COLORS.border);
  doc.setLineWidth(0.3);
  doc.roundedRect(x, y, width, height, 3, 3, "FD");

  let currentY = y + 6;
  items.forEach((item) => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(...PDF_COLORS.primary);
    doc.text(item.label, x + 6, currentY);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(...PDF_COLORS.primary);
    doc.text(String(item.value), x + 50, currentY);

    currentY += rowHeight;
  });

  return y + height + 6;
};
