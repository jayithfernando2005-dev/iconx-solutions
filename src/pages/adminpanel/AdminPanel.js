import { useState, useEffect, useRef, useCallback } from "react";
import { signOut, sendPasswordResetEmail, fetchSignInMethodsForEmail } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area, CartesianGrid,
  RadialBarChart, RadialBar, Legend, LineChart, Line
} from "recharts";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import logo from "../../images/logo.png";
import { loadLogo, drawHeader, drawFooter, drawSectionHeader, PDF_COLORS } from "../../utils/pdfTheme";
import { auth, db } from "../../firebase";
import { addDoc, collection, deleteDoc, doc, onSnapshot, serverTimestamp, setDoc, updateDoc } from "firebase/firestore";
import AttendancePanel from "./Attendance";
import ProductAdmin    from "./ProductAdmin";
import EmployeeAnalyticsPanel from "./EmployeeAnalyticsPanel";
import { CART_EVENT, getCartItems } from "../../utils/cart";
import { DEFAULT_ADMIN_PORTAL_CODE, PORTAL_SETTINGS_COLLECTION, PORTAL_SETTINGS_DOC, generateEmployeePortalCode } from "../../utils/portalSecurity";
import {
  addAttendanceRecord as fbAddRaw,
  getAttendanceRecords as fbGetAllRaw,
  updateAttendanceRecord as fbUpdateRaw,
  deleteAttendanceRecord as fbDelete,
} from "../../firebase";

/* ─── STYLES ──────────────────────────────────────────────── */
const STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');

:root {
  --bg: #07080d;
  --surface: #0f1117;
  --surface2: #161820;
  --surface3: #1c1f2a;
  --border: rgba(255,255,255,0.07);
  --border-hover: rgba(255,255,255,0.13);
  --accent: #3b82f6;
  --accent2: #6366f1;
  --accent-glow: rgba(59,130,246,0.25);
  --green: #22c55e;
  --red: #ef4444;
  --amber: #f59e0b;
  --purple: #a855f7;
  --text: #f1f5f9;
  --text-dim: #94a3b8;
  --muted: #475569;
  --syne: 'Inter', sans-serif;
  --dm: 'Inter', sans-serif;
  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 16px;
  --radius-xl: 20px;
  --shadow-sm: 0 1px 3px rgba(0,0,0,0.4);
  --shadow-md: 0 4px 16px rgba(0,0,0,0.5);
  --shadow-lg: 0 12px 40px rgba(0,0,0,0.6);
  --shadow-accent: 0 4px 20px rgba(59,130,246,0.2);
}

[data-theme='light'].ap-root {
  --bg: #f0f4fc;
  --surface: #ffffff;
  --surface2: #eef2fa;
  --surface3: #e4eaf6;
  --border: rgba(16,24,60,0.08);
  --border-hover: rgba(16,24,60,0.16);
  --accent: #2563eb;
  --accent2: #4f46e5;
  --accent-glow: rgba(37,99,235,0.15);
  --green: #16a34a;
  --red: #dc2626;
  --amber: #d97706;
  --purple: #7c3aed;
  --text: #0f172a;
  --text-dim: #334155;
  --muted: #64748b;
  --shadow-sm: 0 1px 3px rgba(0,0,0,0.08);
  --shadow-md: 0 4px 16px rgba(0,0,0,0.1);
  --shadow-lg: 0 12px 40px rgba(0,0,0,0.12);
  --shadow-accent: 0 4px 20px rgba(37,99,235,0.15);
}

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

.ap-root {
  display: flex;
  height: 100vh;
  width: 100%;
  overflow: hidden;
  background: var(--bg);
  color: var(--text);
  font-family: 'Inter', sans-serif;
  font-size: 14px;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

.ap-root *, .ap-root *::before, .ap-root *::after {
  font-family: 'Inter', sans-serif;
}

/* ── SIDEBAR ─────────────────────────────────────────────── */
.ap-sidebar {
  width: 228px;
  min-width: 228px;
  height: 100vh;
  background: var(--surface);
  border-right: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: relative;
}
.ap-sidebar::after {
  content: '';
  position: absolute;
  top: 0; right: 0;
  width: 1px; height: 100%;
  background: linear-gradient(to bottom, transparent, var(--accent-glow), transparent);
  opacity: 0.6;
  pointer-events: none;
}

.ap-brand {
  padding: 20px 20px 18px;
  border-bottom: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 6px;
}
.ap-brand-logo-img {
  width: 148px;
  height: auto;
  display: block;
  object-fit: contain;
  filter: brightness(0) invert(1);
}
[data-theme='light'].ap-root .ap-brand-logo-img {
  filter: none;
}
.ap-brand-sub {
  font-family: var(--syne);
  font-size: 10px;
  color: var(--muted);
  letter-spacing: 2.5px;
  text-transform: uppercase;
  font-weight: 600;
  padding-left: 2px;
}

.ap-profile {
  padding: 14px 16px;
  border-bottom: 1px solid var(--border);
  display: flex;
  align-items: center;
  gap: 10px;
  background: rgba(255,255,255,0.015);
}
.ap-avatar {
  width: 38px; height: 38px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--accent), var(--accent2));
  display: flex; align-items: center; justify-content: center;
  font-family: var(--syne);
  font-weight: 700; font-size: 14px;
  flex-shrink: 0;
  box-shadow: 0 0 0 2px rgba(59,130,246,0.25), var(--shadow-sm);
}
.ap-profile-info { flex: 1; min-width: 0; }
.ap-profile-name { font-family: var(--syne); font-weight: 600; font-size: 13px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.ap-profile-role { font-size: 11px; color: var(--muted); margin-top: 1px; }
.ap-online-dot {
  width: 8px; height: 8px;
  border-radius: 50%;
  background: var(--green);
  box-shadow: 0 0 0 2px rgba(34,197,94,0.2), 0 0 8px var(--green);
  flex-shrink: 0;
  animation: pulse-dot 2.5s ease-in-out infinite;
}
@keyframes pulse-dot {
  0%, 100% { box-shadow: 0 0 0 2px rgba(34,197,94,0.2), 0 0 8px var(--green); }
  50% { box-shadow: 0 0 0 4px rgba(34,197,94,0.1), 0 0 16px var(--green); }
}

.ap-nav { flex: 1; overflow-y: auto; padding: 12px 10px; }
.ap-nav::-webkit-scrollbar { width: 0; }
.ap-nav-label {
  font-size: 10px;
  color: var(--muted);
  letter-spacing: 1.5px;
  text-transform: uppercase;
  padding: 8px 10px 8px;
  font-weight: 600;
}
.ap-nav-btn {
  width: 100%;
  display: flex; align-items: center; gap: 9px;
  padding: 9px 10px;
  border-radius: var(--radius-sm);
  border: none; cursor: pointer;
  background: transparent;
  color: var(--muted);
  font-family: var(--dm); font-size: 13px;
  text-align: left;
  transition: all 0.18s cubic-bezier(0.4,0,0.2,1);
  margin-bottom: 1px;
  position: relative;
}
.ap-nav-btn:hover {
  background: var(--surface2);
  color: var(--text-dim);
  transform: translateX(2px);
}
.ap-nav-btn.active {
  background: linear-gradient(90deg, rgba(59,130,246,0.18), rgba(99,102,241,0.08));
  color: var(--accent);
  font-weight: 600;
  box-shadow: inset 3px 0 0 var(--accent);
}
.ap-nav-btn.active svg { opacity: 1; }

.ap-sidebar-bottom { padding: 12px 10px; border-top: 1px solid var(--border); }
.ap-export-btn {
  width: 100%; padding: 9px 12px;
  border-radius: var(--radius-sm); border: 1px solid transparent;
  cursor: pointer; font-family: var(--dm); font-size: 12px; font-weight: 500;
  display: flex; align-items: center; gap: 8px;
  margin-bottom: 6px;
  transition: all 0.18s;
}
.ap-export-btn.pdf { background: rgba(239,68,68,0.1); color: var(--red); border-color: rgba(239,68,68,0.15); }
.ap-export-btn.pdf:hover { background: rgba(239,68,68,0.18); border-color: rgba(239,68,68,0.3); }
.ap-export-btn.excel { background: rgba(34,197,94,0.1); color: var(--green); border-color: rgba(34,197,94,0.15); }
.ap-export-btn.excel:hover { background: rgba(34,197,94,0.18); border-color: rgba(34,197,94,0.3); }
.ap-logout-btn {
  width: 100%; padding: 9px 12px;
  border-radius: var(--radius-sm);
  border: 1px solid rgba(239,68,68,0.2);
  cursor: pointer; font-family: var(--dm); font-size: 12px; font-weight: 600;
  display: flex; align-items: center; gap: 8px;
  margin-top: 4px;
  background: rgba(239,68,68,0.07);
  color: var(--red);
  transition: all 0.18s;
}
.ap-logout-btn:hover { background: rgba(239,68,68,0.15); border-color: rgba(239,68,68,0.4); }

/* ── MAIN AREA ────────────────────────────────────────────── */
.ap-main { flex: 1; display: flex; flex-direction: column; overflow: hidden; }

.ap-topbar {
  padding: 0 24px;
  height: 60px;
  border-bottom: 1px solid var(--border);
  display: flex; align-items: center; justify-content: space-between;
  background: var(--surface);
  flex-shrink: 0;
  gap: 16px;
}
.ap-topbar-title {
  font-family: var(--syne);
  font-weight: 700;
  font-size: 17px;
  white-space: nowrap;
}
.ap-topbar-right { display: flex; align-items: center; gap: 10px; }
.ap-theme-btn {
  border: 1px solid var(--border);
  background: var(--surface2);
  color: var(--text-dim);
  border-radius: 999px;
  padding: 7px 14px;
  cursor: pointer;
  font-family: var(--dm); font-size: 12px; font-weight: 600;
  transition: all 0.18s;
  white-space: nowrap;
}
.ap-theme-btn:hover { border-color: var(--accent); color: var(--accent); background: rgba(59,130,246,0.07); }
.ap-search {
  background: var(--surface2);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  padding: 7px 12px;
  color: var(--text);
  font-family: var(--dm); font-size: 13px;
  outline: none;
  width: 200px;
  transition: border-color 0.18s, box-shadow 0.18s;
}
.ap-search::placeholder { color: var(--muted); }
.ap-search:focus { border-color: var(--accent); box-shadow: 0 0 0 3px rgba(59,130,246,0.1); }

.ap-content { flex: 1; overflow-y: auto; padding: 22px 26px; }
.ap-content::-webkit-scrollbar { width: 4px; }
.ap-content::-webkit-scrollbar-track { background: transparent; }
.ap-content::-webkit-scrollbar-thumb { background: var(--surface3); border-radius: 4px; }
.ap-content::-webkit-scrollbar-thumb:hover { background: var(--border-hover); }

/* ── GRIDS ──────────────────────────────────────────────── */
.ap-grid-4 { display: grid; grid-template-columns: repeat(4,1fr); gap: 14px; margin-bottom: 20px; }
.ap-grid-3 { display: grid; grid-template-columns: repeat(3,1fr); gap: 14px; margin-bottom: 20px; }
.ap-grid-2 { display: grid; grid-template-columns: repeat(2,1fr); gap: 14px; margin-bottom: 20px; }

/* ── STAT CARDS ─────────────────────────────────────────── */
.ap-stat-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  padding: 18px;
  cursor: pointer;
  transition: all 0.22s cubic-bezier(0.4,0,0.2,1);
  position: relative;
  overflow: hidden;
}
.ap-stat-card::before {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 2px;
  transition: height 0.2s;
}
.ap-stat-card:hover {
  border-color: var(--border-hover);
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}
.ap-stat-card:hover::before { height: 3px; }
.ap-stat-card.blue::before { background: linear-gradient(90deg,var(--accent),var(--accent2)); }
.ap-stat-card.green::before { background: var(--green); }
.ap-stat-card.red::before { background: var(--red); }
.ap-stat-card.amber::before { background: var(--amber); }
.ap-stat-card.purple::before { background: var(--purple); }
.ap-stat-label { font-size: 11px; color: var(--muted); letter-spacing: 0.6px; margin-bottom: 10px; text-transform: uppercase; font-weight: 600; }
.ap-stat-value { font-family: var(--syne); font-size: 26px; font-weight: 800; margin-bottom: 4px; letter-spacing: -0.5px; }
.ap-stat-sub { font-size: 11px; color: var(--muted); }
.ap-stat-icon {
  position: absolute; top: 16px; right: 16px;
  width: 34px; height: 34px;
  border-radius: var(--radius-sm);
  display: flex; align-items: center; justify-content: center;
  font-size: 15px;
}
.ap-stat-icon.blue { background: rgba(59,130,246,0.14); color: var(--accent); }
.ap-stat-icon.green { background: rgba(34,197,94,0.14); color: var(--green); }
.ap-stat-icon.red { background: rgba(239,68,68,0.14); color: var(--red); }
.ap-stat-icon.amber { background: rgba(245,158,11,0.14); color: var(--amber); }
.ap-stat-icon.purple { background: rgba(168,85,247,0.14); color: var(--purple); }

/* ── PANELS ─────────────────────────────────────────────── */
.ap-panel {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  padding: 20px;
}
.ap-panel-title {
  font-family: var(--syne);
  font-size: 14px; font-weight: 700;
  margin-bottom: 18px;
  display: flex; align-items: center; justify-content: space-between;
}
.ap-panel-sub { font-size: 11px; color: var(--muted); font-weight: 400; font-family: var(--dm); }

.ap-gauge-wrap { display: flex; flex-direction: column; align-items: center; }
.ap-gauge-label { font-size: 11px; color: var(--muted); margin-top: 4px; text-align: center; }
.ap-gauge-val { font-family: var(--syne); font-size: 15px; font-weight: 700; text-align: center; }

/* ── TABLE ──────────────────────────────────────────────── */
.ap-table-wrap { overflow-x: auto; border-radius: var(--radius-md); }
.ap-table-wrap::-webkit-scrollbar { height: 4px; }
.ap-table-wrap::-webkit-scrollbar-thumb { background: var(--surface3); border-radius: 4px; }
.ap-table { width: 100%; border-collapse: collapse; font-size: 13px; }
.ap-table th {
  text-align: left;
  padding: 11px 14px;
  color: var(--muted);
  font-weight: 600; font-size: 10.5px;
  text-transform: uppercase; letter-spacing: 0.7px;
  border-bottom: 1px solid var(--border);
  white-space: nowrap;
  background: var(--surface);
  position: sticky; top: 0; z-index: 1;
}
.ap-table td { padding: 12px 14px; border-bottom: 1px solid var(--border); vertical-align: middle; }
.ap-table tr:last-child td { border-bottom: none; }
.ap-table tr.data-row { cursor: pointer; transition: background 0.12s; }
.ap-table tr.data-row:hover td { background: rgba(59,130,246,0.04); }
[data-theme='light'].ap-root .ap-table tr.data-row:hover td { background: rgba(37,99,235,0.05); }

.ap-eff-bar { height: 5px; border-radius: 3px; background: var(--surface2); overflow: hidden; width: 80px; }
.ap-eff-fill { height: 100%; border-radius: 3px; transition: width 0.6s cubic-bezier(0.4,0,0.2,1); }
.ap-eff-text { font-family: var(--syne); font-size: 12px; font-weight: 700; }

.ap-badge {
  display: inline-flex; align-items: center; gap: 4px;
  padding: 3px 9px; border-radius: 20px;
  font-size: 11px; font-weight: 600;
  letter-spacing: 0.2px;
}
.ap-badge.optimal { background: rgba(34,197,94,0.13); color: var(--green); }
.ap-badge.stable { background: rgba(245,158,11,0.13); color: var(--amber); }
.ap-badge.critical { background: rgba(239,68,68,0.13); color: var(--red); }
.ap-badge.info { background: rgba(59,130,246,0.13); color: var(--accent); }

.ap-action-btn {
  background: transparent;
  border: 1px solid var(--border);
  border-radius: 6px;
  padding: 5px 9px;
  cursor: pointer;
  color: var(--muted);
  font-size: 12px;
  transition: all 0.15s;
  margin-right: 4px;
  display: inline-flex; align-items: center; gap: 4px;
}
.ap-action-btn:hover { border-color: var(--accent); color: var(--accent); background: rgba(59,130,246,0.06); }
.ap-action-btn.del:hover { border-color: var(--red); color: var(--red); background: rgba(239,68,68,0.06); }
.ap-action-btn.success:hover { border-color: var(--green); color: var(--green); background: rgba(34,197,94,0.06); }

.ap-expanded-row td { background: var(--surface2) !important; padding: 16px 20px !important; border-bottom: 1px solid var(--border) !important; }
.ap-expanded-inner { display: flex; gap: 20px; align-items: flex-start; }
.ap-detail-tiles { display: grid; grid-template-columns: repeat(3,1fr); gap: 10px; flex: 1; }
.ap-detail-tile { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-sm); padding: 11px 13px; }
.ap-detail-tile-label { font-size: 10px; color: var(--muted); text-transform: uppercase; letter-spacing: 0.6px; margin-bottom: 4px; font-weight: 600; }
.ap-detail-tile-val { font-family: var(--syne); font-size: 16px; font-weight: 700; }

.ap-filter-bar { display: flex; align-items: center; gap: 8px; margin-bottom: 18px; flex-wrap: wrap; }
.ap-filter-btn {
  padding: 6px 14px;
  border-radius: 999px;
  border: 1px solid var(--border);
  cursor: pointer; background: transparent;
  color: var(--muted);
  font-family: var(--dm); font-size: 12px; font-weight: 500;
  transition: all 0.15s;
}
.ap-filter-btn:hover { border-color: var(--accent); color: var(--accent); }
.ap-filter-btn.active { background: var(--accent); border-color: var(--accent); color: #fff; box-shadow: var(--shadow-accent); }
.ap-filter-btn.green.active { background: var(--green); border-color: var(--green); color: #000; }
.ap-filter-btn.amber.active { background: var(--amber); border-color: var(--amber); color: #000; }
.ap-filter-btn.red.active { background: var(--red); border-color: var(--red); color: #fff; }
.ap-filter-spacer { flex: 1; }

/* ── MODAL ──────────────────────────────────────────────── */
.ap-modal-overlay {
  position: fixed; inset: 0;
  background: rgba(0,0,0,0.75);
  display: flex; align-items: center; justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(8px);
  animation: fadeIn 0.18s ease;
}
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
.ap-modal {
  background: var(--surface);
  border: 1px solid var(--border-hover);
  border-radius: var(--radius-xl);
  padding: 26px;
  min-width: 480px; max-width: 680px; width: 90vw;
  max-height: 88vh; overflow-y: auto;
  animation: slideUp 0.22s cubic-bezier(0.34,1.56,0.64,1);
  box-shadow: var(--shadow-lg), 0 0 0 1px rgba(255,255,255,0.04);
}
.ap-modal::-webkit-scrollbar { width: 4px; }
.ap-modal::-webkit-scrollbar-thumb { background: var(--surface3); border-radius: 4px; }
@keyframes slideUp { from { opacity: 0; transform: translateY(20px) scale(0.98); } to { opacity: 1; transform: translateY(0) scale(1); } }
.ap-modal-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 22px; }
.ap-modal-title { font-family: var(--syne); font-size: 18px; font-weight: 700; }
.ap-modal-close {
  background: var(--surface2);
  border: 1px solid var(--border);
  width: 32px; height: 32px;
  border-radius: var(--radius-sm);
  cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  color: var(--muted); font-size: 18px;
  transition: all 0.15s;
}
.ap-modal-close:hover { background: rgba(239,68,68,0.12); color: var(--red); border-color: rgba(239,68,68,0.3); }

.ap-form-group { margin-bottom: 16px; }
.ap-form-label { display: block; font-size: 12px; color: var(--muted); margin-bottom: 6px; font-weight: 500; letter-spacing: 0.2px; }
.ap-form-input {
  width: 100%;
  background: var(--surface2);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  padding: 10px 13px;
  color: var(--text);
  font-family: var(--dm); font-size: 14px;
  outline: none;
  transition: border-color 0.18s, box-shadow 0.18s;
}
.ap-form-input:focus { border-color: var(--accent); box-shadow: 0 0 0 3px rgba(59,130,246,0.12); }
.ap-form-preview {
  background: var(--surface2);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  padding: 13px 15px;
  margin-top: 14px;
}
.ap-form-preview-row { display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px; }
.ap-form-preview-row:last-child { margin-bottom: 0; }
.ap-form-preview-key { font-size: 12px; color: var(--muted); }
.ap-form-preview-val { font-family: var(--syne); font-weight: 600; font-size: 14px; }
.ap-submit-btn {
  width: 100%; padding: 12px;
  border-radius: var(--radius-sm); border: none;
  background: linear-gradient(135deg, var(--accent), var(--accent2));
  color: #fff;
  font-family: var(--syne); font-size: 14px; font-weight: 700;
  cursor: pointer;
  transition: opacity 0.15s, transform 0.15s, box-shadow 0.15s;
  margin-top: 8px;
  box-shadow: var(--shadow-accent);
}
.ap-submit-btn:hover { opacity: 0.9; transform: translateY(-1px); box-shadow: 0 8px 24px rgba(59,130,246,0.3); }
.ap-submit-btn:active { transform: translateY(0); }

.ap-group-item { display: flex; align-items: center; gap: 12px; padding: 12px; border-radius: 10px; background: var(--surface2); border: 1px solid var(--border); margin-bottom: 8px; transition: border-color 0.15s; }
.ap-group-item:hover { border-color: var(--border-hover); }
.ap-group-rank { width: 28px; height: 28px; border-radius: 50%; background: var(--surface); border: 1px solid var(--border); display: flex; align-items: center; justify-content: center; font-family: var(--syne); font-size: 12px; font-weight: 700; flex-shrink: 0; }
.ap-group-info { flex: 1; min-width: 0; }
.ap-group-id { font-family: var(--syne); font-weight: 600; font-size: 13px; }
.ap-group-meta { font-size: 11px; color: var(--muted); margin-top: 2px; }
.ap-group-eff { display: flex; flex-direction: column; align-items: flex-end; gap: 4px; }
.ap-group-eff-val { font-family: var(--syne); font-weight: 700; font-size: 14px; }
.ap-group-eff-bar { width: 60px; height: 4px; background: var(--border); border-radius: 2px; overflow: hidden; }
.ap-group-eff-fill { height: 100%; border-radius: 2px; }

.ap-placeholder { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 300px; color: var(--muted); gap: 12px; }
.ap-placeholder-icon { font-size: 42px; opacity: 0.25; }
.ap-placeholder-text { font-family: var(--syne); font-size: 16px; font-weight: 600; }

.ap-section-title { font-family: var(--syne); font-size: 11px; font-weight: 700; color: var(--muted); text-transform: uppercase; letter-spacing: 1.2px; margin-bottom: 12px; margin-top: 4px; }

.ap-chart-tip { background: var(--surface); border: 1px solid var(--border-hover); border-radius: var(--radius-sm); padding: 9px 13px; font-size: 12px; box-shadow: var(--shadow-md); }
.ap-chart-tip-label { color: var(--muted); margin-bottom: 3px; }
.ap-chart-tip-val { font-family: var(--syne); font-weight: 700; }

.ap-add-btn {
  padding: 8px 16px;
  border-radius: var(--radius-sm); border: none;
  background: linear-gradient(135deg, var(--accent), var(--accent2));
  color: #fff;
  font-family: var(--dm); font-size: 13px; font-weight: 600;
  cursor: pointer;
  transition: opacity 0.15s, transform 0.15s;
  display: flex; align-items: center; gap: 6px;
  box-shadow: var(--shadow-accent);
}
.ap-add-btn:hover { opacity: 0.88; transform: translateY(-1px); }
.ap-add-btn:active { transform: translateY(0); }

.ap-settings-section { margin-bottom: 26px; }
.ap-settings-title { font-family: var(--syne); font-size: 15px; font-weight: 700; margin-bottom: 4px; }
.ap-settings-sub { font-size: 12px; color: var(--muted); margin-bottom: 16px; line-height: 1.5; }
.ap-threshold-row { display: flex; align-items: center; gap: 14px; margin-bottom: 10px; padding: 14px 16px; background: var(--surface2); border: 1px solid var(--border); border-radius: var(--radius-sm); transition: border-color 0.15s; }
.ap-threshold-row:hover { border-color: var(--border-hover); }
.ap-threshold-label { width: 80px; flex-shrink: 0; }
.ap-threshold-label-name { font-size: 13px; font-weight: 600; }
.ap-threshold-label-range { font-size: 11px; color: var(--muted); margin-top: 2px; }
.ap-threshold-slider { flex: 1; -webkit-appearance: none; appearance: none; height: 4px; border-radius: 2px; outline: none; cursor: pointer; }
.ap-threshold-slider::-webkit-slider-thumb { -webkit-appearance: none; width: 16px; height: 16px; border-radius: 50%; cursor: pointer; border: 2px solid var(--bg); box-shadow: 0 0 0 2px rgba(59,130,246,0.3); }
.ap-threshold-val { font-family: var(--syne); font-size: 16px; font-weight: 700; min-width: 44px; text-align: right; }
.ap-settings-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 12px; margin-top: 12px; }
.ap-settings-metric { background: var(--surface2); border: 1px solid var(--border); border-radius: var(--radius-sm); padding: 14px 16px; text-align: center; }
.ap-settings-metric-val { font-family: var(--syne); font-size: 22px; font-weight: 800; }
.ap-settings-metric-label { font-size: 11px; color: var(--muted); margin-top: 4px; text-transform: uppercase; letter-spacing: 0.6px; font-weight: 600; }
.ap-settings-apply {
  padding: 10px 22px;
  border-radius: var(--radius-sm); border: none;
  background: linear-gradient(135deg, var(--accent), var(--accent2));
  color: #fff;
  font-family: var(--dm); font-size: 13px; font-weight: 600;
  cursor: pointer; margin-top: 16px;
  transition: opacity 0.15s, transform 0.15s;
  box-shadow: var(--shadow-accent);
}
.ap-settings-apply:hover { opacity: 0.88; transform: translateY(-1px); }
.ap-settings-reset { padding: 10px 16px; border-radius: var(--radius-sm); border: 1px solid var(--border); background: transparent; color: var(--muted); font-family: var(--dm); font-size: 13px; cursor: pointer; margin-top: 16px; margin-left: 8px; transition: all 0.15s; }
.ap-settings-reset:hover { color: var(--text); border-color: var(--border-hover); }

.ap-request-list { display: grid; gap: 14px; }
.ap-request-card { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-lg); padding: 20px; transition: border-color 0.18s, box-shadow 0.18s; }
.ap-request-card:hover { border-color: var(--border-hover); box-shadow: var(--shadow-sm); }
.ap-request-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; margin-bottom: 14px; }
.ap-request-name { font-family: var(--syne); font-size: 17px; font-weight: 700; }
.ap-request-email { font-size: 12px; color: var(--muted); margin-top: 4px; }
.ap-request-meta { display: grid; grid-template-columns: repeat(4,minmax(0,1fr)); gap: 10px; margin-bottom: 14px; }
.ap-request-meta-card { background: var(--surface2); border: 1px solid var(--border); border-radius: var(--radius-sm); padding: 12px; }
.ap-request-meta-card span { display: block; font-size: 10px; color: var(--muted); text-transform: uppercase; letter-spacing: 0.6px; margin-bottom: 6px; font-weight: 600; }
.ap-request-meta-card strong { font-family: var(--syne); font-size: 14px; }
.ap-request-actions { display: flex; gap: 10px; flex-wrap: wrap; }
.ap-request-btn { padding: 10px 18px; border: none; border-radius: 10px; cursor: pointer; font-family: var(--dm); font-size: 13px; font-weight: 600; transition: all 0.15s; }
.ap-request-btn:hover { opacity: 0.85; transform: translateY(-1px); }
.ap-request-btn.approve { background: rgba(34,197,94,0.14); color: var(--green); }
.ap-request-btn.reject { background: rgba(239,68,68,0.12); color: var(--red); }
.ap-request-btn.pending { background: rgba(245,158,11,0.14); color: var(--amber); }
.ap-request-empty { padding: 30px; border: 1px dashed var(--border); border-radius: var(--radius-lg); background: var(--surface); text-align: center; color: var(--muted); }
.ap-request-badge { display: inline-flex; align-items: center; padding: 5px 11px; border-radius: 999px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.6px; }
.ap-request-badge.pending { background: rgba(245,158,11,0.14); color: var(--amber); }
.ap-request-badge.approved { background: rgba(34,197,94,0.14); color: var(--green); }
.ap-request-badge.rejected { background: rgba(239,68,68,0.12); color: var(--red); }
.ap-request-code { margin-top: 12px; padding: 12px 14px; border: 1px dashed var(--border); border-radius: var(--radius-sm); background: var(--surface2); }
.ap-request-code span { display: block; font-size: 10px; color: var(--muted); text-transform: uppercase; letter-spacing: 0.6px; margin-bottom: 6px; font-weight: 600; }
.ap-request-code strong { font-family: var(--syne); font-size: 18px; letter-spacing: 2px; }

.ap-settings-inline { display: flex; gap: 10px; align-items: center; flex-wrap: wrap; }
.ap-settings-input {
  min-width: 280px; flex: 1;
  background: var(--surface2);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  padding: 10px 13px;
  color: var(--text);
  font-family: var(--dm); font-size: 14px;
  outline: none;
  transition: border-color 0.18s, box-shadow 0.18s;
}
.ap-settings-input:focus { border-color: var(--accent); box-shadow: 0 0 0 3px rgba(59,130,246,0.1); }

/* ── CART ITEM ROW ───────────────────────────────────────── */
.ap-cart-item {
  display: flex; align-items: center; gap: 12px;
  padding: 11px 13px;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  margin-bottom: 8px;
  background: var(--surface2);
  transition: border-color 0.15s;
}
.ap-cart-item:hover { border-color: var(--border-hover); }
.ap-cart-thumb {
  width: 36px; height: 36px;
  border-radius: var(--radius-sm);
  background: rgba(59,130,246,0.12);
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0; font-size: 16px;
}
.ap-cart-info { flex: 1; min-width: 0; }
.ap-cart-name { font-weight: 600; font-size: 12px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.ap-cart-price { font-size: 11px; color: var(--muted); margin-top: 2px; }
.ap-qty-ctrl { display: flex; align-items: center; gap: 6px; flex-shrink: 0; }
.ap-qty-btn {
  width: 24px; height: 24px;
  border-radius: 6px; border: 1px solid var(--border);
  background: var(--surface); color: var(--text-dim);
  cursor: pointer; font-size: 14px;
  display: flex; align-items: center; justify-content: center;
  transition: all 0.15s; line-height: 1;
}
.ap-qty-btn:hover { border-color: var(--accent); color: var(--accent); background: rgba(59,130,246,0.06); }
.ap-qty-val { font-weight: 700; font-size: 13px; min-width: 20px; text-align: center; font-family: var(--syne); }
.ap-cart-total-row {
  display: flex; align-items: center; justify-content: space-between;
  padding: 12px 4px 0;
  border-top: 1px solid var(--border);
  margin-top: 4px;
}
.ap-cart-total-label { font-size: 11px; color: var(--muted); font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }
.ap-cart-total-val { font-family: var(--syne); font-size: 18px; font-weight: 800; color: var(--green); }
.ap-cart-empty { text-align: center; padding: 36px 20px; color: var(--muted); }
.ap-cart-empty-icon { font-size: 32px; opacity: 0.2; margin-bottom: 10px; }
`;

/* ─── THRESHOLD CONFIG ─────────────────────────────────────── */
export const THRESHOLDS = { optimal: 75, stable: 45 };

/* ─── HELPERS ──────────────────────────────────────────────── */
const getStatus = (eff, t = THRESHOLDS) => eff >= t.optimal ? 'optimal' : eff >= t.stable ? 'stable' : 'critical';
const calcEff = (h, r) => { const s = h * r; if (s <= 0) return 0; return Math.min(100, Math.round((s / (300 * 80)) * 300)); };
const statusColor = (s) => ({ optimal: 'var(--green)', stable: 'var(--amber)', critical: 'var(--red)' }[s] || 'var(--muted)');
const statusLabel = (s) => ({ optimal: 'Optimal', stable: 'Stable', critical: 'Critical' }[s] || '—');
const statusIcon  = (s) => ({ optimal: '✓', stable: '⚠', critical: '✕' }[s] || '');
const fmt = (n) => 'Rs ' + new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(n);

/* ─── FIRESTORE MAPPERS ────────────────────────────────────── */
const fromFirestore = (d) => {
  const h = Number(d.work_hour) || 0, r = Number(d.base_salary_rate) || 0;
  const daysPresent = Number(d.days_present) || 0;
  const daysInMonth = Number(d.days_in_month) || 0;
  const eff = daysInMonth > 0 ? Math.round((daysPresent / daysInMonth) * 100) : calcEff(h, r);
  const computedSalary = Number(d.calculated_salary);
  return {
    id: d.id,
    staffId: d.emp_id || '—',
    hours: h,
    rate: r,
    salary: Number.isFinite(computedSalary) ? computedSalary : h * r,
    efficiency: eff,
    status: getStatus(eff),
    employeeUid: d.employee_uid || "",
    employeeName: d.employee_name || "",
    daysPresent,
    daysInMonth,
    salaryMonth: d.salary_month || "",
    salaryMode: d.salary_mode || "",
  };
};
function validateSalaryRecord(rec) {
  const staffId = String(rec?.staffId || "").trim().toUpperCase();
  const rate = Number(rec?.rate);
  const daysPresent = Number(rec?.daysPresent);
  const daysInMonth = Number(rec?.daysInMonth);
  if (!staffId) throw new Error("Staff ID is required.");
  if (!/^STF-\d{4}$/.test(staffId)) throw new Error("Incorrect ID input. Staff ID must be in the format STF-xxxx.");
  if (String(rec?.rate ?? "").trim() === "") throw new Error("Base salary is required.");
  if (Number.isNaN(rate)) throw new Error("Base salary must be a valid number.");
  if (rate <= 0) throw new Error("Base salary must be greater than 0.");
  if (String(rec?.salaryMonth || "").trim() === "") throw new Error("Salary month is required.");
  if (String(rec?.daysInMonth ?? "").trim() === "") throw new Error("Total month days are required.");
  if (Number.isNaN(daysInMonth)) throw new Error("Total month days must be a valid number.");
  if (daysInMonth <= 0 || daysInMonth > 31) throw new Error("Total month days must be between 1 and 31.");
  if (String(rec?.daysPresent ?? "").trim() === "") throw new Error("Days present is required.");
  if (Number.isNaN(daysPresent)) throw new Error("Days present must be a valid number.");
  if (daysPresent < 0) throw new Error("Days present cannot be less than 0.");
  if (daysPresent > daysInMonth) throw new Error("Days present cannot be more than total month days.");
}
const toFirestore = (rec) => ({
  emp_id: rec.staffId,
  work_hour: Number(rec.daysPresent) || 0,
  base_salary_rate: Number(rec.rate),
  calculated_salary: Number(rec.salary) || 0,
  employee_uid: rec.employeeUid || "",
  employee_name: rec.employeeName || "",
  days_present: Number(rec.daysPresent) || 0,
  days_in_month: Number(rec.daysInMonth) || 0,
  salary_month: rec.salaryMonth || "",
  salary_mode: rec.salaryMode || "",
  timestamp: new Date().toISOString(),
});
async function fbGetAll() { return (await fbGetAllRaw()).map(fromFirestore); }
async function fbAdd(rec) { validateSalaryRecord(rec); const ref = await fbAddRaw(rec.staffId, rec.hours, rec.rate, toFirestore(rec)); return { ...rec, id: ref.id }; }
async function fbUpdate(id, rec) { validateSalaryRecord(rec); await fbUpdateRaw(id, toFirestore(rec)); }

/* ─── SVG GAUGE ────────────────────────────────────────────── */
function Gauge({ value, color, size = 80 }) {
  const r = size / 2 - 8, circ = Math.PI * r, prog = (value / 100) * circ;
  return (
    <svg width={size} height={size / 2 + 12} viewBox={`0 0 ${size} ${size / 2 + 12}`}>
      <path d={`M 8 ${size/2} A ${r} ${r} 0 0 1 ${size-8} ${size/2}`} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="6" strokeLinecap="round" />
      <path d={`M 8 ${size/2} A ${r} ${r} 0 0 1 ${size-8} ${size/2}`} fill="none" stroke={color} strokeWidth="6" strokeLinecap="round" strokeDasharray={`${prog} ${circ}`} style={{ transition: 'stroke-dasharray 0.8s ease' }} />
      <text x={size/2} y={size/2 + 2} textAnchor="middle" fill={color} fontSize="13" fontFamily="Syne,sans-serif" fontWeight="700">{value}%</text>
    </svg>
  );
}

/* ─── TOOLTIP ──────────────────────────────────────────────── */
function Tip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="ap-chart-tip">
      <div className="ap-chart-tip-label">{label}</div>
      {payload.map((p, i) => (
        <div key={i} className="ap-chart-tip-val" style={{ color: p.color }}>
          {p.name}: {p.value > 1000 ? fmt(p.value) : p.value}{p.name === 'efficiency' || p.name === 'eff' ? '%' : ''}
        </div>
      ))}
    </div>
  );
}

/* ─── CANVAS CHART FOR PDF ─────────────────────────────────── */
function buildChart(type, opts = {}) {
  const canvas = document.createElement('canvas');
  const W = opts.width || 520, H = opts.height || 190;
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#f8fafc'; ctx.fillRect(0, 0, W, H);
  if (type === 'bar') {
    const { labels, values, color = '#3b82f6' } = opts;
    const pad = { t:20, r:16, b:32, l:52 }, cW = W-pad.l-pad.r, cH = H-pad.t-pad.b;
    const max = Math.max(...values)*1.15||1, barW = Math.min(28,(cW/values.length)*0.55), step = cW/values.length;
    for (let i=0;i<=4;i++){const y=pad.t+cH-(i/4)*cH;ctx.strokeStyle='rgba(15,23,42,0.06)';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(pad.l,y);ctx.lineTo(W-pad.r,y);ctx.stroke();ctx.fillStyle='#64748b';ctx.font='9px sans-serif';ctx.textAlign='right';ctx.fillText(Math.round((i/4)*max/1000)+'k',pad.l-5,y+3);}
    values.forEach((v,i)=>{const bH=Math.max(2,(v/max)*cH),x=pad.l+i*step+step/2-barW/2,y=pad.t+cH-bH;const g=ctx.createLinearGradient(0,y,0,y+bH);g.addColorStop(0,color);g.addColorStop(1,color+'44');ctx.fillStyle=g;ctx.beginPath();ctx.roundRect(x,y,barW,bH,3);ctx.fill();if(labels){ctx.fillStyle='#64748b';ctx.font='9px sans-serif';ctx.textAlign='center';ctx.fillText(String(labels[i]||'').slice(0,6),pad.l+i*step+step/2,H-6);}});
  }
  if (type === 'area') {
    const { labels, values, color = '#3b82f6' } = opts;
    const pad = { t:20, r:16, b:32, l:52 }, cW = W-pad.l-pad.r, cH = H-pad.t-pad.b;
    const max = Math.max(...values)*1.15||1;
    const pts = values.map((v,i)=>({x:pad.l+(values.length>1?(i/(values.length-1))*cW:cW/2),y:pad.t+cH-(v/max)*cH}));
    for(let i=0;i<=4;i++){const y=pad.t+cH-(i/4)*cH;ctx.strokeStyle='rgba(15,23,42,0.06)';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(pad.l,y);ctx.lineTo(W-pad.r,y);ctx.stroke();ctx.fillStyle='#64748b';ctx.font='9px sans-serif';ctx.textAlign='right';ctx.fillText(Math.round((i/4)*max),pad.l-5,y+3);}
    const g=ctx.createLinearGradient(0,pad.t,0,pad.t+cH);g.addColorStop(0,color+'55');g.addColorStop(1,color+'00');ctx.fillStyle=g;ctx.beginPath();ctx.moveTo(pts[0].x,pad.t+cH);pts.forEach(p=>ctx.lineTo(p.x,p.y));ctx.lineTo(pts[pts.length-1].x,pad.t+cH);ctx.closePath();ctx.fill();
    ctx.strokeStyle=color;ctx.lineWidth=2;ctx.lineJoin='round';ctx.beginPath();pts.forEach((p,i)=>i===0?ctx.moveTo(p.x,p.y):ctx.lineTo(p.x,p.y));ctx.stroke();
    pts.forEach(p=>{ctx.beginPath();ctx.arc(p.x,p.y,3,0,Math.PI*2);ctx.fillStyle=color;ctx.fill();});
    if(labels)labels.forEach((l,i)=>{ctx.fillStyle='#64748b';ctx.font='9px sans-serif';ctx.textAlign='center';ctx.fillText(String(l||'').slice(0,6),pts[i].x,H-6);});
  }
  if (type === 'donut') {
    const { slices } = opts;
    const cx=W*0.33,cy=H/2,outerR=Math.min(cy-12,72),innerR=outerR*0.55,total=slices.reduce((s,x)=>s+x.value,0)||1;
    let angle=-Math.PI/2;
    slices.forEach(sl=>{const sw=(sl.value/total)*Math.PI*2;ctx.beginPath();ctx.moveTo(cx,cy);ctx.arc(cx,cy,outerR,angle,angle+sw);ctx.closePath();ctx.fillStyle=sl.color;ctx.fill();angle+=sw;});
    ctx.beginPath();ctx.arc(cx,cy,innerR,0,Math.PI*2);ctx.fillStyle='#f8fafc';ctx.fill();
    ctx.fillStyle='#0f172a';ctx.font='bold 16px sans-serif';ctx.textAlign='center';ctx.fillText(String(slices.reduce((s,x)=>s+x.value,0)),cx,cy+5);ctx.fillStyle='#64748b';ctx.font='9px sans-serif';ctx.fillText('Total',cx,cy+18);
    let ly=24;slices.forEach(sl=>{const pct=Math.round((sl.value/total)*100);ctx.fillStyle=sl.color;ctx.fillRect(W*0.66,ly,10,10);ctx.fillStyle='#0f172a';ctx.font='11px sans-serif';ctx.textAlign='left';ctx.fillText(`${sl.label}: ${sl.value} (${pct}%)`,W*0.66+14,ly+9);ly+=28;});
  }
  return canvas.toDataURL('image/png');
}

/* ─── PDF EXPORT ───────────────────────────────────────────── */
async function exportPDF(records) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const logoImg = await loadLogo(logo);
  const W = 210, H = 297, M = 14;
  const optimal = records.filter((r) => r.status === 'optimal');
  const stable = records.filter((r) => r.status === 'stable');
  const critical = records.filter((r) => r.status === 'critical');
  const totalPayout = records.reduce((s, r) => s + (Number(r.salary) || 0), 0);
  const avgEff = records.length ? Math.round(records.reduce((s, r) => s + (Number(r.efficiency) || 0), 0) / records.length) : 0;
  const avgAttendance = records.length ? Math.round(records.reduce((s, r) => s + (Number(r.daysPresent) || 0), 0) / records.length) : 0;
  const reportMonths = [...new Set(records.map((r) => r.salaryMonth).filter(Boolean))];
  const topPayout = [...records].sort((a, b) => (b.salary || 0) - (a.salary || 0))[0] || null;
  const highestAttendance = [...records].sort((a, b) => ((b.daysPresent || 0) / Math.max(b.daysInMonth || 1, 1)) - ((a.daysPresent || 0) / Math.max(a.daysInMonth || 1, 1)))[0] || null;

  const paintPage = () => { doc.setFillColor(255, 255, 255); doc.rect(0, 0, W, H, 'F'); };
  const ensureSpace = (needed) => {
    if (y + needed <= 276) return;
    doc.addPage(); paintPage();
    drawHeader(doc, logoImg, "Salary Report", "Attendance-based monthly payroll summary");
    y = 42;
  };

  paintPage();
  drawHeader(doc, logoImg, "Salary Report", "Attendance-based monthly payroll summary");
  let y = 42;
  y = drawSectionHeader(doc, "Overview KPIs", y);

  const kpis = [
    { label: 'Total Payout', val: fmt(totalPayout), c: [59, 130, 246] },
    { label: 'Avg Attendance', val: `${avgAttendance} days`, c: [168, 85, 247] },
    { label: 'Optimal Staff', val: optimal.length, c: [34, 197, 94] },
    { label: 'Critical Staff', val: critical.length, c: [239, 68, 68] },
  ];
  const cardW = (W - M * 2 - 9) / 4;
  kpis.forEach((k, i) => {
    const x = M + i * (cardW + 3);
    doc.setFillColor(...PDF_COLORS.lightBg); doc.setDrawColor(...PDF_COLORS.border); doc.setLineWidth(0.3);
    doc.roundedRect(x, y, cardW, 21, 2, 2, 'FD');
    doc.setFillColor(...k.c); doc.rect(x, y, cardW, 1.4, 'F');
    doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(...PDF_COLORS.muted);
    doc.text(k.label, x + cardW / 2, y + 8, { align: 'center' });
    doc.setFont('helvetica', 'bold'); doc.setFontSize(11); doc.setTextColor(...PDF_COLORS.primary);
    doc.text(String(k.val), x + cardW / 2, y + 16, { align: 'center' });
  });

  y += 29; ensureSpace(32);
  y = drawSectionHeader(doc, "Report Snapshot", y);
  doc.setFillColor(...PDF_COLORS.lightBg); doc.setDrawColor(...PDF_COLORS.border); doc.setLineWidth(0.3);
  doc.roundedRect(M, y, W - M * 2, 28, 3, 3, 'FD');
  doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(...PDF_COLORS.muted);
  doc.text(`Months covered: ${reportMonths.length ? reportMonths.join(', ') : 'Not specified'}`, M + 6, y + 9);
  doc.text(`Average efficiency: ${avgEff}%`, M + 6, y + 18);
  doc.text(`Top payout: ${topPayout ? `${topPayout.staffId} (${fmt(topPayout.salary)})` : '-'}`, W / 2 + 6, y + 9);
  doc.text(`Best attendance: ${highestAttendance ? `${highestAttendance.staffId} (${highestAttendance.daysPresent || 0}/${highestAttendance.daysInMonth || 0})` : '-'}`, W / 2 + 6, y + 18);

  y += 36;
  const addChart = (title, imgData, h = 42) => {
    ensureSpace(h + 14); y = drawSectionHeader(doc, title, y);
    doc.addImage(imgData, 'PNG', M, y + 2, W - M * 2, h); y += h + 8;
  };

  const slice = [...records].sort((a, b) => (b.salary || 0) - (a.salary || 0)).slice(0, 12);
  addChart('Top Salary Distribution', buildChart('bar', { labels: slice.map((r) => r.staffId.slice(-4)), values: slice.map((r) => r.salary), color: '#3b82f6', width: 540, height: 190 }), 44);
  addChart('Attendance by Staff', buildChart('area', { labels: slice.map((r) => r.staffId.slice(-4)), values: slice.map((r) => Math.round(((r.daysPresent || 0) / Math.max(r.daysInMonth || 1, 1)) * 100)), color: '#a855f7', width: 540, height: 190 }), 44);
  addChart('Status Breakdown', buildChart('donut', { slices: [{ label: 'Optimal', value: optimal.length, color: '#22c55e' }, { label: 'Stable', value: stable.length, color: '#f59e0b' }, { label: 'Critical', value: critical.length, color: '#ef4444' }], width: 540, height: 200 }), 48);

  ensureSpace(18); y = drawSectionHeader(doc, "Salary Records", y); y += 2;
  autoTable(doc, {
    startY: y,
    head: [['Staff ID', 'Month', 'Attendance', 'Base Salary', 'Net Salary', 'Efficiency', 'Status']],
    body: records.map((r) => [r.staffId, r.salaryMonth || '-', `${r.daysPresent || 0}/${r.daysInMonth || 0}`, fmt(r.rate || 0), fmt(r.salary || 0), `${r.efficiency || 0}%`, String(r.status || '').toUpperCase()]),
    theme: 'plain',
    headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontSize: 9, fontStyle: 'bold', cellPadding: 2.8 },
    bodyStyles: { fillColor: [255, 255, 255], textColor: [15, 23, 42], fontSize: 8.6, cellPadding: 2.8 },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    didParseCell: (d) => {
      if (d.section === 'body' && d.column.index === 6) {
        const s = String(d.cell.raw).toLowerCase();
        d.cell.styles.textColor = s === 'optimal' ? [34, 197, 94] : s === 'stable' ? [245, 158, 11] : [239, 68, 68];
        d.cell.styles.fontStyle = 'bold';
      }
    },
    margin: { left: M, right: M },
  });

  const total = doc.getNumberOfPages();
  for (let i = 1; i <= total; i++) { doc.setPage(i); drawFooter(doc, i, total, "iconX Admin System"); }
  doc.save('iconX_salary_report.pdf');
}

/* ─── EXCEL EXPORT ─────────────────────────────────────────── */
function exportExcel(records) {
  const rows=[['Staff ID','Hours','Rate (Rs/hr)','Net Salary','Efficiency %','Status'],...records.map(r=>[r.staffId,r.hours,r.rate,r.salary,r.efficiency,r.status])];
  const csv=rows.map(r=>r.join(',')).join('\n');
  const a=Object.assign(document.createElement('a'),{href:URL.createObjectURL(new Blob([csv],{type:'text/csv'})),download:'iconX_staff_data.csv'});
  a.click();URL.revokeObjectURL(a.href);
}

/* ─── MOCK DATA ────────────────────────────────────────────── */
const MOCK=[
  {id:'1',staffId:'STF-001',hours:220,rate:45,salary:9900,efficiency:82,status:'optimal'},
  {id:'2',staffId:'STF-002',hours:180,rate:38,salary:6840,efficiency:57,status:'stable'},
  {id:'3',staffId:'STF-003',hours:240,rate:52,salary:12480,efficiency:91,status:'optimal'},
  {id:'4',staffId:'STF-004',hours:120,rate:28,salary:3360,efficiency:25,status:'critical'},
  {id:'5',staffId:'STF-005',hours:200,rate:41,salary:8200,efficiency:68,status:'stable'},
  {id:'6',staffId:'STF-006',hours:90,rate:25,salary:2250,efficiency:17,status:'critical'},
  {id:'7',staffId:'STF-007',hours:235,rate:55,salary:12925,efficiency:95,status:'optimal'},
  {id:'8',staffId:'STF-008',hours:160,rate:35,salary:5600,efficiency:42,status:'stable'},
  {id:'9',staffId:'STF-009',hours:100,rate:22,salary:2200,efficiency:16,status:'critical'},
  {id:'10',staffId:'STF-010',hours:210,rate:48,salary:10080,efficiency:78,status:'optimal'},
];

/* ─── NAV ICONS ────────────────────────────────────────────── */
const I={
  dashboard:<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>,
  product:<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>,
  customer:<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  select:<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>,
  vendor:<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
  reviews:<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
  orders:<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 2l3 7h9l3-7"/><path d="M3 9h18l-1.5 9a2 2 0 0 1-2 1.7H6.5a2 2 0 0 1-2-1.7L3 9z"/><circle cx="9" cy="21" r="1"/><circle cx="15" cy="21" r="1"/></svg>,
  tradeIn:<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="7" y="2" width="10" height="20" rx="2" ry="2"/><line x1="11" y1="18" x2="13" y2="18"/></svg>,
  attendance:<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  employeeAccess:<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><path d="M20 8v6"/><path d="M17 11h6"/></svg>,
  passwordResets:<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>,
  settings:<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>,
};

/* ─── GROUP MODAL ──────────────────────────────────────────── */
function GroupModal({ type, records, onClose }) {
  const list = records.filter(r => r.status === type).sort((a, b) => b.efficiency - a.efficiency);
  const color = statusColor(type);
  const avg = list.length ? Math.round(list.reduce((s, r) => s + r.efficiency, 0) / list.length) : 0;
  const barData = list.map(r => ({ name: r.staffId.slice(-4), eff: r.efficiency }));
  return (
    <div className="ap-modal-overlay" onClick={onClose}>
      <div className="ap-modal" style={{ maxWidth: 660 }} onClick={e => e.stopPropagation()}>
        <div className="ap-modal-header">
          <div>
            <div className="ap-modal-title" style={{ color }}>{type.charAt(0).toUpperCase() + type.slice(1)} Staff Group</div>
            <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>{list.length} members &middot; Avg: <span style={{ color, fontWeight: 600 }}>{avg}%</span></div>
          </div>
          <button className="ap-modal-close" onClick={onClose}>×</button>
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
          <div className="ap-gauge-wrap">
            <Gauge value={avg} color={color} size={110} />
            <div className="ap-gauge-label">Group Average Efficiency</div>
          </div>
        </div>
        {list.length > 0 && (
          <div className="ap-panel" style={{ marginBottom: 16 }}>
            <div className="ap-panel-title">Efficiency per Member <span className="ap-panel-sub">{type} group</span></div>
            <ResponsiveContainer width="100%" height={120}>
              <BarChart data={barData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#6e6e73' }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: '#6e6e73' }} />
                <Tooltip content={<Tip />} />
                <Bar dataKey="eff" name="efficiency" radius={[3, 3, 0, 0]}>
                  {barData.map((_, i) => <Cell key={i} fill={color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
        <div className="ap-section-title">Ranked Members</div>
        <div style={{ maxHeight: 260, overflowY: 'auto', paddingRight: 4 }}>
          {list.length === 0 && <div style={{ textAlign: 'center', padding: 24, color: 'var(--muted)' }}>No {type} staff found</div>}
          {list.map((r, i) => (
            <div key={r.id} className="ap-group-item">
              <div className="ap-group-rank" style={{ color, borderColor: color + '44' }}>#{i + 1}</div>
              <div className="ap-group-info">
                <div className="ap-group-id">{r.staffId}</div>
                <div className="ap-group-meta">{r.hours}h &middot; Rs {r.rate}/hr &middot; {fmt(r.salary)}</div>
              </div>
              <div className="ap-group-eff">
                <div className="ap-group-eff-val" style={{ color }}>{r.efficiency}%</div>
                <div className="ap-group-eff-bar"><div className="ap-group-eff-fill" style={{ width: r.efficiency + '%', background: color }} /></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── RECORD MODAL ─────────────────────────────────────────── */
function RecordModal({ record, onClose }) {
  return (
    <div className="ap-modal-overlay" onClick={onClose}>
      <div className="ap-modal" style={{ maxWidth: 480 }} onClick={e => e.stopPropagation()}>
        <div className="ap-modal-header">
          <div className="ap-modal-title">Staff Record: {record.staffId}</div>
          <button className="ap-modal-close" onClick={onClose}>×</button>
        </div>
        <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start', marginBottom: 8 }}>
          <div className="ap-gauge-wrap">
            <Gauge value={record.efficiency} color={statusColor(record.status)} size={100} />
            <div className="ap-gauge-val" style={{ color: statusColor(record.status) }}>{record.status.toUpperCase()}</div>
          </div>
          <div className="ap-detail-tiles" style={{ flex: 1 }}>
            {[['Staff ID',record.staffId],['Work Hours',record.hours+'h'],['Hourly Rate','Rs '+record.rate],['Net Payout',fmt(record.salary)],['Efficiency',record.efficiency+'%'],['Status',record.status.toUpperCase()]].map(([k,v],i)=>(
              <div key={i} className="ap-detail-tile">
                <div className="ap-detail-tile-label">{k}</div>
                <div className="ap-detail-tile-val" style={i===5?{color:statusColor(record.status)}:{}}>{v}</div>
              </div>
            ))}
          </div>
        </div>
        <div style={{ fontSize: 11, color: 'var(--muted)', textAlign: 'center', paddingTop: 12 }}>
          To edit this record, use the ✏️ edit button in the Attendance table.
        </div>
      </div>
    </div>
  );
}

/* ─── EDIT/ADD MODAL ───────────────────────────────────────── */
function EditModal({ record, onClose, onSave }) {
  const [f, setF] = useState({ staffId: record?.staffId || '', hours: record?.hours || '', rate: record?.rate || '' });
  const [error, setError] = useState("");
  const validateField = (key, value) => {
    const trimmedValue = String(value || "").trim();
    if (key === "staffId") { if (!trimmedValue) return "Staff ID is required."; if (!/^STF-\d{4}$/i.test(trimmedValue)) return "Incorrect ID input. Staff ID must be in the format STF-xxxx."; return ""; }
    if (key === "hours") { if (!trimmedValue) return "Work hours are required."; if (Number.isNaN(Number(trimmedValue))) return "Work hours must be a valid number."; if (Number(trimmedValue) < 0) return "Work hours cannot be less than 0."; return ""; }
    if (key === "rate") { if (!trimmedValue) return "Hourly rate is required."; if (Number.isNaN(Number(trimmedValue))) return "Hourly rate must be a valid number."; if (Number(trimmedValue) < 0) return "Hourly rate cannot be less than 0."; return ""; }
    return "";
  };
  const h = parseFloat(f.hours) || 0, r = parseFloat(f.rate) || 0;
  const salary = h * r, eff = calcEff(h, r), status = getStatus(eff);
  const up = (k) => (e) => { const nextValue = e.target.value; setF(p => ({ ...p, [k]: nextValue })); setError(validateField(k, nextValue)); };
  const save = () => {
    const staffIdError = validateField("staffId", f.staffId); if (staffIdError) return setError(staffIdError);
    const hoursError = validateField("hours", f.hours); if (hoursError) return setError(hoursError);
    const rateError = validateField("rate", f.rate); if (rateError) return setError(rateError);
    onSave({ ...(record||{}), id: record?.id||Date.now().toString(), staffId: f.staffId.trim().toUpperCase(), hours: h, rate: r, salary, efficiency: eff, status });
  };
  return (
    <div className="ap-modal-overlay" onClick={onClose}>
      <div className="ap-modal" style={{ maxWidth: 420 }} onClick={e => e.stopPropagation()}>
        <div className="ap-modal-header">
          <div className="ap-modal-title">{record ? 'Edit Record' : 'Add Staff'}</div>
          <button className="ap-modal-close" onClick={onClose}>×</button>
        </div>
        {error && <div style={{ color: "#ff453a", fontSize: 13, marginBottom: 12 }}>{error}</div>}
        {[['staffId','Staff ID','STF-011','text'],['hours','Work Hours','200','number'],['rate','Hourly Rate (Rs)','45','number']].map(([k,l,ph,t])=>(
          <div key={k} className="ap-form-group">
            <label className="ap-form-label">{l}</label>
            <input className="ap-form-input" type={t} value={f[k]} onChange={up(k)} placeholder={ph} min={t === 'number' ? '0' : undefined} step={k === 'hours' || k === 'rate' ? '0.01' : undefined} />
          </div>
        ))}
        {h > 0 && r > 0 && (
          <div className="ap-form-preview">
            {[['Estimated Payout',fmt(salary)],['Efficiency',eff+'%'],['Status',status.toUpperCase()]].map(([k,v],i)=>(
              <div key={i} className="ap-form-preview-row">
                <span className="ap-form-preview-key">{k}</span>
                <span className="ap-form-preview-val" style={i>0?{color:statusColor(status)}:{}}>{v}</span>
              </div>
            ))}
          </div>
        )}
        <button className="ap-submit-btn" onClick={save}>{record ? 'Save Changes' : 'Add Record'}</button>
      </div>
    </div>
  );
}

/* ─── DASHBOARD ────────────────────────────────────────────── */
function Dashboard({ records, onGroup }) {
  const opt=records.filter(r=>r.status==='optimal'),stb=records.filter(r=>r.status==='stable'),crt=records.filter(r=>r.status==='critical');
  const totalPayout=records.reduce((s,r)=>s+r.salary,0);
  const avgEff=records.length?Math.round(records.reduce((s,r)=>s+r.efficiency,0)/records.length):0;
  const pct=(n)=>records.length?Math.round((n/records.length)*100):0;
  const salaryData=records.slice(0,8).map(r=>({name:r.staffId.slice(-3),salary:r.salary}));
  const hoursData=records.slice(0,8).map(r=>({name:r.staffId.slice(-3),hours:r.hours}));
  const statusData=[{name:'Optimal',value:opt.length,color:'var(--green)'},{name:'Stable',value:stb.length,color:'var(--amber)'},{name:'Critical',value:crt.length,color:'var(--red)'}];
  const radialData=records.slice(0,5).map((r,i)=>({name:r.staffId.slice(-3),eff:r.efficiency,fill:['var(--green)','var(--accent)','var(--purple)','var(--amber)','var(--red)'][i]}));
  const corrData=records.map(r=>({name:r.staffId.slice(-3),efficiency:r.efficiency,salary:Math.round(r.salary/100)}));
  return (
    <>
      <div className="ap-grid-4">
        {[
          {color:'blue',icon:'💰',label:'Total Payout',val:fmt(totalPayout),sub:records.length+' staff',fn:null},
          {color:'green',icon:'✓',label:'Optimal Staff',val:opt.length,sub:pct(opt.length)+'% of workforce',fn:()=>onGroup('optimal')},
          {color:'red',icon:'✕',label:'Critical Staff',val:crt.length,sub:pct(crt.length)+'% of workforce',fn:()=>onGroup('critical')},
          {color:'purple',icon:'⚡',label:'Avg Efficiency',val:avgEff+'%',sub:'across all staff',fn:null},
        ].map((k,i)=>(
          <div key={i} className={`ap-stat-card ${k.color}`} onClick={k.fn||undefined} style={k.fn?{cursor:'pointer'}:{}}>
            <div className={`ap-stat-icon ${k.color}`}>{k.icon}</div>
            <div className="ap-stat-label">{k.label}</div>
            <div className="ap-stat-value" style={i>0?{color:['','var(--green)','var(--red)','var(--purple)'][i]}:{fontSize:20}}>{k.val}</div>
            <div className="ap-stat-sub">{k.sub}{k.fn?' · click to view':''}</div>
          </div>
        ))}
      </div>
      <div className="ap-grid-3">
        {[{label:'Optimal Group',g:'optimal',list:opt},{label:'Stable Group',g:'stable',list:stb},{label:'Critical Group',g:'critical',list:crt}].map((item,i)=>{
          const avg2=item.list.length?Math.round(item.list.reduce((s,r)=>s+r.efficiency,0)/item.list.length):0;
          return (
            <div key={i} className="ap-panel" style={{textAlign:'center',cursor:'pointer'}} onClick={()=>onGroup(item.g)}>
              <div className="ap-panel-title">{item.label} Avg <span className="ap-panel-sub">{item.list.length} members</span></div>
              <Gauge value={avg2} color={statusColor(item.g)} size={110} />
              <div style={{fontSize:11,color:'var(--muted)',marginTop:8}}>Click to view members →</div>
            </div>
          );
        })}
      </div>
      <div className="ap-grid-2">
        <div className="ap-panel">
          <div className="ap-panel-title">Salary Distribution <span className="ap-panel-sub">top 8</span></div>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={salaryData} margin={{top:0,right:0,left:-20,bottom:0}}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="name" tick={{fontSize:10,fill:'#6e6e73'}} /><YAxis tick={{fontSize:10,fill:'#6e6e73'}} />
              <Tooltip content={<Tip />} />
              <Bar dataKey="salary" name="salary" radius={[3,3,0,0]} fill="var(--accent)" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="ap-panel">
          <div className="ap-panel-title">Status Breakdown <span className="ap-panel-sub">by count</span></div>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie data={statusData} cx="50%" cy="50%" innerRadius={38} outerRadius={62} dataKey="value" nameKey="name" label={({name,percent})=>name+' '+Math.round(percent*100)+'%'} labelLine={false} fontSize={10}>
                {statusData.map((s,i)=><Cell key={i} fill={s.color} />)}
              </Pie>
              <Tooltip content={<Tip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="ap-grid-2">
        <div className="ap-panel">
          <div className="ap-panel-title">Work Hours Trend <span className="ap-panel-sub">per staff</span></div>
          <ResponsiveContainer width="100%" height={140}>
            <AreaChart data={hoursData} margin={{top:4,right:4,left:-20,bottom:0}}>
              <defs><linearGradient id="purp" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="var(--purple)" stopOpacity={0.3}/><stop offset="95%" stopColor="var(--purple)" stopOpacity={0}/></linearGradient></defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="name" tick={{fontSize:10,fill:'#6e6e73'}} /><YAxis tick={{fontSize:10,fill:'#6e6e73'}} />
              <Tooltip content={<Tip />} />
              <Area type="monotone" dataKey="hours" name="hours" stroke="var(--purple)" fill="url(#purp)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="ap-panel">
          <div className="ap-panel-title">Top Efficiency Radial <span className="ap-panel-sub">top 5</span></div>
          <ResponsiveContainer width="100%" height={140}>
            <RadialBarChart cx="50%" cy="50%" innerRadius="20%" outerRadius="80%" data={radialData}>
              <RadialBar dataKey="eff" cornerRadius={4} />
              <Tooltip content={<Tip />} />
              <Legend iconSize={8} wrapperStyle={{fontSize:10}} />
            </RadialBarChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="ap-panel" style={{marginTop:14}}>
        <div className="ap-panel-title">Efficiency vs Salary Correlation <span className="ap-panel-sub">all staff</span></div>
        <ResponsiveContainer width="100%" height={140}>
          <LineChart data={corrData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="name" tick={{fontSize:10,fill:'#6e6e73'}} />
            <YAxis yAxisId="l" tick={{fontSize:10,fill:'#6e6e73'}} /><YAxis yAxisId="r" orientation="right" tick={{fontSize:10,fill:'#6e6e73'}} />
            <Tooltip content={<Tip />} /><Legend wrapperStyle={{fontSize:10}} />
            <Line yAxisId="l" type="monotone" dataKey="efficiency" stroke="var(--green)" strokeWidth={2} dot={{r:3}} />
            <Line yAxisId="r" type="monotone" dataKey="salary" stroke="var(--accent)" strokeWidth={2} dot={{r:3}} name="salary ×100" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </>
  );
}

/* ─── ATTENDANCE ───────────────────────────────────────────── */
function Attendance({ records, setRecords, onGroup, fbAdd, fbUpdate, fbDelete }) {
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState(null);
  const [editing, setEditing] = useState(null);
  const [adding, setAdding] = useState(false);
  const [viewRecord, setViewRecord] = useState(null);
  const [saving, setSaving] = useState(false);
  const opt=records.filter(r=>r.status==='optimal'),stb=records.filter(r=>r.status==='stable'),crt=records.filter(r=>r.status==='critical');
  const pct=(n)=>records.length?Math.round((n/records.length)*100):0;
  const shown=records.filter(r=>(filter==='all'||r.status===filter)&&(!search||r.staffId.toLowerCase().includes(search.toLowerCase())));
  const effData=records.map(r=>({name:r.staffId.slice(-3),eff:r.efficiency,fill:statusColor(r.status)}));
  const payData=records.map(r=>({name:r.staffId.slice(-3),payout:r.salary}));

  const save=async(rec)=>{
    setSaving(true);
    try{const isNew=!records.find(r=>r.id===rec.id);if(isNew){const saved=await fbAdd(rec);setRecords(prev=>[...prev,saved]);}else{await fbUpdate(rec.id,rec);setRecords(prev=>prev.map(r=>r.id===rec.id?rec:r));}}
    catch(err){console.error('Save failed:',err);const isNew=!records.find(r=>r.id===rec.id);setRecords(prev=>isNew?[...prev,rec]:prev.map(r=>r.id===rec.id?rec:r));}
    finally{setSaving(false);setEditing(null);setAdding(false);}
  };
  const remove=async(id)=>{
    setSaving(true);
    try{await fbDelete(id);setRecords(prev=>prev.filter(x=>x.id!==id));}
    catch(err){console.error('Delete failed:',err);setRecords(prev=>prev.filter(x=>x.id!==id));}
    finally{setSaving(false);}
  };

  return (
    <>
      {saving&&(
        <div style={{position:'fixed',top:16,right:24,background:'var(--accent)',color:'#fff',padding:'8px 16px',borderRadius:8,fontSize:12,fontWeight:600,zIndex:2000,display:'flex',alignItems:'center',gap:8,boxShadow:'0 4px 20px rgba(10,132,255,0.4)'}}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{animation:'spin 1s linear infinite'}}><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
          Syncing with Firebase...
        </div>
      )}
      <div className="ap-grid-3">
        {[{color:'green',icon:'✓',label:'Optimal Staff',list:opt,g:'optimal'},{color:'amber',icon:'⚠',label:'Stable Staff',list:stb,g:'stable'},{color:'red',icon:'✕',label:'Critical Staff',list:crt,g:'critical'}].map((k,i)=>(
          <div key={i} className={`ap-stat-card ${k.color}`} style={{cursor:'pointer'}} onClick={()=>onGroup(k.g)}>
            <div className={`ap-stat-icon ${k.color}`}>{k.icon}</div>
            <div className="ap-stat-label">{k.label}</div>
            <div className="ap-stat-value" style={{color:statusColor(k.g)}}>{k.list.length}</div>
            <div className="ap-stat-sub">{pct(k.list.length)}% of workforce · click to view</div>
          </div>
        ))}
      </div>
      <div className="ap-grid-2">
        <div className="ap-panel">
          <div className="ap-panel-title">Efficiency by Staff <span className="ap-panel-sub">color coded</span></div>
          <ResponsiveContainer width="100%" height={110}>
            <BarChart data={effData} margin={{top:0,right:0,left:-24,bottom:0}}>
              <XAxis dataKey="name" tick={{fontSize:9,fill:'#6e6e73'}} /><YAxis domain={[0,100]} tick={{fontSize:9,fill:'#6e6e73'}} />
              <Tooltip content={<Tip />} />
              <Bar dataKey="eff" name="efficiency" radius={[3,3,0,0]}>{effData.map((d,i)=><Cell key={i} fill={d.fill} />)}</Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="ap-panel">
          <div className="ap-panel-title">Payout Distribution <span className="ap-panel-sub">all staff</span></div>
          <ResponsiveContainer width="100%" height={110}>
            <AreaChart data={payData} margin={{top:4,right:4,left:-24,bottom:0}}>
              <defs><linearGradient id="pg" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="var(--purple)" stopOpacity={0.4}/><stop offset="95%" stopColor="var(--purple)" stopOpacity={0}/></linearGradient></defs>
              <XAxis dataKey="name" tick={{fontSize:9,fill:'#6e6e73'}} /><YAxis tick={{fontSize:9,fill:'#6e6e73'}} />
              <Tooltip content={<Tip />} />
              <Area type="monotone" dataKey="payout" name="payout" stroke="var(--purple)" fill="url(#pg)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="ap-filter-bar">
        {[{val:'all',label:'All',cls:''},{val:'optimal',label:'Optimal',cls:'green'},{val:'stable',label:'Stable',cls:'amber'},{val:'critical',label:'Critical',cls:'red'}].map(f=>(
          <button key={f.val} className={`ap-filter-btn ${f.cls} ${filter===f.val?'active':''}`} onClick={()=>setFilter(f.val)}>
            {f.label} ({f.val==='all'?records.length:records.filter(r=>r.status===f.val).length})
          </button>
        ))}
        <div className="ap-filter-spacer" />
        <button className="ap-add-btn" onClick={()=>setAdding(true)}>+ Add Staff</button>
      </div>
      <div className="ap-panel">
        <div className="ap-table-wrap">
          <table className="ap-table">
            <thead><tr><th>Staff ID</th><th>Hours</th><th>Rate</th><th>Net Salary</th><th>Efficiency</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {shown.map(r=>(
                <>
                  <tr key={r.id} className="data-row" onClick={()=>setExpanded(expanded===r.id?null:r.id)}>
                    <td style={{fontFamily:'var(--syne)',fontWeight:600}}>{r.staffId}</td>
                    <td>{r.hours}h</td><td>Rs {r.rate}</td>
                    <td style={{fontFamily:'var(--syne)',fontWeight:600}}>{fmt(r.salary)}</td>
                    <td>
                      <div style={{display:'flex',alignItems:'center',gap:8}}>
                        <div className="ap-eff-bar"><div className="ap-eff-fill" style={{width:r.efficiency+'%',background:statusColor(r.status)}} /></div>
                        <span className="ap-eff-text" style={{color:statusColor(r.status)}}>{r.efficiency}%</span>
                      </div>
                    </td>
                    <td><span className={`ap-badge ${r.status}`}>{statusIcon(r.status)} {statusLabel(r.status)}</span></td>
                    <td onClick={e=>e.stopPropagation()}>
                      <button className="ap-action-btn" title="View details" onClick={()=>setViewRecord(r)}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                      </button>
                      <button className="ap-action-btn" title="Edit record" onClick={()=>setEditing(r)}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                      </button>
                      <button className="ap-action-btn del" title="Delete record" onClick={()=>remove(r.id)}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
                      </button>
                    </td>
                  </tr>
                  {expanded===r.id&&(
                    <tr key={r.id+'-x'} className="ap-expanded-row">
                      <td colSpan={7}>
                        <div className="ap-expanded-inner">
                          <div className="ap-gauge-wrap">
                            <Gauge value={r.efficiency} color={statusColor(r.status)} size={90} />
                            <div className="ap-gauge-val" style={{color:statusColor(r.status)}}>{r.status.toUpperCase()}</div>
                            <div className="ap-gauge-label">Efficiency</div>
                          </div>
                          <div className="ap-detail-tiles">
                            {[['Staff ID',r.staffId],['Hours',r.hours+'h'],['Rate','Rs '+r.rate],['Net Payout',fmt(r.salary)],['Efficiency',r.efficiency+'%'],['Status',r.status.toUpperCase()]].map(([k,v],i)=>(
                              <div key={i} className="ap-detail-tile">
                                <div className="ap-detail-tile-label">{k}</div>
                                <div className="ap-detail-tile-val" style={i===5?{color:statusColor(r.status)}:{}}>{v}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
              {shown.length===0&&<tr><td colSpan={7} style={{textAlign:'center',padding:24,color:'var(--muted)'}}>No records found</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
      {viewRecord&&<RecordModal record={viewRecord} onClose={()=>setViewRecord(null)} />}
      {(editing||adding)&&<EditModal record={editing} onClose={()=>{setEditing(null);setAdding(false);}} onSave={save} />}
    </>
  );
}

/* ─── SETTINGS ─────────────────────────────────────────────── */
function Settings({ records, thresholds, setThresholds, adminPortalCode, setAdminPortalCode, onSaveAdminPortalCode, portalCodeSaving }) {
  const [local, setLocal] = useState({ ...thresholds });
  const [nextAdminCode, setNextAdminCode] = useState(adminPortalCode || DEFAULT_ADMIN_PORTAL_CODE);
  const recomputed=records.map(r=>({...r,status:getStatus(r.efficiency,local)}));
  const opt=recomputed.filter(r=>r.status==='optimal'),stb=recomputed.filter(r=>r.status==='stable'),crt=recomputed.filter(r=>r.status==='critical');
  const apply=()=>{THRESHOLDS.optimal=local.optimal;THRESHOLDS.stable=local.stable;setThresholds({...local});};
  const reset=()=>setLocal({optimal:75,stable:45});
  const critPct=local.stable,stbPct=local.optimal-local.stable,optPct=100-local.optimal;

  useEffect(() => { setNextAdminCode(adminPortalCode || DEFAULT_ADMIN_PORTAL_CODE); }, [adminPortalCode]);

  return (
    <div>
      <div className="ap-settings-section">
        <div className="ap-settings-title">Admin Security Code</div>
        <div className="ap-settings-sub">This static admin code is used only for admin portal login and can be changed here anytime.</div>
        <div className="ap-settings-inline">
          <input className="ap-settings-input" type="text" value={nextAdminCode} placeholder="Enter admin security code" onChange={(e) => setNextAdminCode(e.target.value)} />
          <button className="ap-settings-apply" onClick={() => { const trimmed = nextAdminCode.trim(); if (!trimmed) return; setAdminPortalCode(trimmed); onSaveAdminPortalCode(trimmed); }} disabled={portalCodeSaving}>
            {portalCodeSaving ? "Saving..." : "Save Admin Code"}
          </button>
          <button className="ap-settings-reset" onClick={() => { setNextAdminCode(DEFAULT_ADMIN_PORTAL_CODE); setAdminPortalCode(DEFAULT_ADMIN_PORTAL_CODE); onSaveAdminPortalCode(DEFAULT_ADMIN_PORTAL_CODE); }} disabled={portalCodeSaving}>
            Reset Admin Code
          </button>
        </div>
      </div>
      <div className="ap-settings-section">
        <div className="ap-settings-title">Efficiency Thresholds</div>
        <div className="ap-settings-sub">Define boundary values for Optimal, Stable, and Critical classifications.</div>
        <div style={{height:28,borderRadius:8,overflow:'hidden',display:'flex',marginBottom:20,border:'1px solid var(--border)'}}>
          <div style={{width:critPct+'%',background:'rgba(255,69,58,0.7)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,color:'#fff',fontWeight:600,transition:'width 0.2s'}}>{critPct>10?'Critical 0–'+local.stable+'%':''}</div>
          <div style={{width:stbPct+'%',background:'rgba(255,159,10,0.7)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,color:'#fff',fontWeight:600,transition:'width 0.2s'}}>{stbPct>12?'Stable '+local.stable+'–'+local.optimal+'%':''}</div>
          <div style={{width:optPct+'%',background:'rgba(48,209,88,0.7)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,color:'#fff',fontWeight:600,transition:'width 0.2s'}}>{optPct>10?'Optimal ≥'+local.optimal+'%':''}</div>
        </div>
        {[['optimal','var(--green)','≥ threshold',local.stable+5,95,local.optimal,'optimal'],['stable','var(--amber)','≥ threshold',5,local.optimal-5,local.stable,'stable']].map(([key,color,range,min,max,val])=>(
          <div key={key} className="ap-threshold-row">
            <div className="ap-threshold-label">
              <div className="ap-threshold-label-name" style={{color}}>{key.charAt(0).toUpperCase()+key.slice(1)}</div>
              <div className="ap-threshold-label-range">{range}</div>
            </div>
            <input type="range" min={min} max={max} value={val} className="ap-threshold-slider"
              style={{background:`linear-gradient(to right, ${color} 0%, ${color} ${key==='stable'?(val/(local.optimal-5))*100:val}%, rgba(255,255,255,0.1) ${key==='stable'?(val/(local.optimal-5))*100:val}%, rgba(255,255,255,0.1) 100%)`}}
              onChange={e=>setLocal(p=>({...p,[key]:parseInt(e.target.value)}))} />
            <div className="ap-threshold-val" style={{color}}>{val}%</div>
          </div>
        ))}
        <div className="ap-threshold-row" style={{opacity:0.7}}>
          <div className="ap-threshold-label"><div className="ap-threshold-label-name" style={{color:'var(--red)'}}>Critical</div><div className="ap-threshold-label-range">&lt; stable</div></div>
          <div style={{flex:1,fontSize:12,color:'var(--muted)'}}>Automatically assigned when efficiency is below Stable threshold ({local.stable}%)</div>
          <div className="ap-threshold-val" style={{color:'var(--red)'}}>&lt;{local.stable}%</div>
        </div>
        <div style={{display:'flex'}}>
          <button className="ap-settings-apply" onClick={apply}>Apply Thresholds</button>
          <button className="ap-settings-reset" onClick={reset}>Reset to Default</button>
        </div>
      </div>
      <div className="ap-settings-section">
        <div className="ap-settings-title">Live Preview</div>
        <div className="ap-settings-sub">Staff classification with current threshold settings ({records.length} total records)</div>
        <div className="ap-settings-grid">
          {[{label:'Optimal Staff',val:opt.length,pct:records.length?Math.round(opt.length/records.length*100):0,color:'var(--green)',icon:'✓'},{label:'Stable Staff',val:stb.length,pct:records.length?Math.round(stb.length/records.length*100):0,color:'var(--amber)',icon:'⚠'},{label:'Critical Staff',val:crt.length,pct:records.length?Math.round(crt.length/records.length*100):0,color:'var(--red)',icon:'✕'}].map(({label,val,pct,color,icon})=>(
            <div key={label} className="ap-settings-metric" style={{borderColor:color+'44'}}>
              <div className="ap-settings-metric-val" style={{color}}>{icon} {val}</div>
              <div className="ap-settings-metric-label">{label}</div>
              <div style={{fontSize:11,color:'var(--muted)',marginTop:4}}>{pct}% of workforce</div>
            </div>
          ))}
        </div>
      </div>
      <div className="ap-panel">
        <div className="ap-panel-title">Staff Efficiency Distribution <span className="ap-panel-sub">colored by thresholds</span></div>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={recomputed.map(r=>({name:r.staffId.slice(-3),eff:r.efficiency,status:r.status}))} margin={{top:4,right:4,left:-20,bottom:0}}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="name" tick={{fontSize:10,fill:'#6e6e73'}} /><YAxis domain={[0,100]} tick={{fontSize:10,fill:'#6e6e73'}} />
            <Tooltip content={<Tip />} />
            <Bar dataKey="eff" radius={[4,4,0,0]}>{recomputed.map((r,i)=><Cell key={i} fill={statusColor(r.status)} opacity={0.85} />)}</Bar>
          </BarChart>
        </ResponsiveContainer>
        <div style={{display:'flex',gap:16,marginTop:10,justifyContent:'center'}}>
          {[{c:'var(--green)',t:'Optimal ≥'+local.optimal+'%'},{c:'var(--amber)',t:'Stable ≥'+local.stable+'%'},{c:'var(--red)',t:'Critical <'+local.stable+'%'}].map(({c,t})=>(
            <div key={t} style={{display:'flex',alignItems:'center',gap:6,fontSize:11,color:c}}>
              <div style={{width:20,height:2,background:c}}/> {t}
            </div>
          ))}
        </div>
      </div>
      <div className="ap-panel" style={{marginTop:14}}>
        <div className="ap-panel-title">Hours vs Efficiency Scatter <span className="ap-panel-sub">each dot = 1 staff member</span></div>
        <div style={{position:'relative',height:200,padding:'0 8px'}}>
          <svg width="100%" height="200" viewBox="0 0 500 180">
            {[0,25,50,75,100].map(v=><g key={v}><line x1="40" y1={160-v*1.4} x2="500" y2={160-v*1.4} stroke="rgba(255,255,255,0.05)" strokeWidth="1"/><text x="34" y={163-v*1.4} textAnchor="end" fontSize="9" fill="#6e6e73">{v}</text></g>)}
            {[50,100,150,200,250].map(v=><g key={v}><line x1={40+v*1.7} y1="0" x2={40+v*1.7} y2="160" stroke="rgba(255,255,255,0.05)" strokeWidth="1"/><text x={40+v*1.7} y="172" textAnchor="middle" fontSize="9" fill="#6e6e73">{v}h</text></g>)}
            <line x1="40" y1={160-local.optimal*1.4} x2="500" y2={160-local.optimal*1.4} stroke="rgba(48,209,88,0.4)" strokeWidth="1" strokeDasharray="4 3"/>
            <line x1="40" y1={160-local.stable*1.4} x2="500" y2={160-local.stable*1.4} stroke="rgba(255,159,10,0.4)" strokeWidth="1" strokeDasharray="4 3"/>
            {recomputed.map((r,i)=>{const cx=40+Math.min(r.hours,250)*1.7,cy=160-r.efficiency*1.4,c=statusColor(r.status);return(<g key={i}><circle cx={cx} cy={cy} r="6" fill={c} opacity="0.8"/><circle cx={cx} cy={cy} r="6" fill="none" stroke={c} strokeWidth="2" opacity="0.3"/></g>);})}
            <text x="270" y="185" textAnchor="middle" fontSize="10" fill="#6e6e73">Work Hours</text>
            <text x="12" y="90" textAnchor="middle" fontSize="10" fill="#6e6e73" transform="rotate(-90,12,90)">Efficiency %</text>
          </svg>
        </div>
      </div>
    </div>
  );
}

/* ─── ROOT COMPONENT ───────────────────────────────────────── */
const CUSTOMER_FIELDS = [
  { key: "fullName", label: "Full Name", placeholder: "Kasun Perera", required: true },
  { key: "email", label: "Email", placeholder: "customer@iconx.lk", required: true, type: "email" },
  { key: "phone", label: "Phone", placeholder: "077 123 4567", required: true },
  { key: "role", label: "Role", placeholder: "customer", required: true },
  { key: "status", label: "Status", placeholder: "active", required: true },
];

const SELECT_CUSTOMER_FIELDS = [
  { key: "customerName", label: "Customer Name", placeholder: "Dilini Fernando", required: true },
  { key: "phone", label: "Phone", placeholder: "077 456 7890", required: true },
  { key: "interest", label: "Interested Product", placeholder: "iPhone 17 Pro Max", required: true },
  { key: "budget", label: "Budget", placeholder: "250000", required: true, type: "number" },
  { key: "status", label: "Status", placeholder: "follow-up", required: true },
];

const VENDOR_FIELDS = [
  { key: "vendorName", label: "Vendor Name", placeholder: "ABC Distributors", required: true },
  { key: "company", label: "Company", placeholder: "ABC Lanka (Pvt) Ltd", required: true },
  { key: "email", label: "Email", placeholder: "sales@vendor.lk", required: true, type: "email" },
  { key: "phone", label: "Phone", placeholder: "011 222 3344", required: true },
  { key: "category", label: "Category", placeholder: "Accessories", required: true },
  { key: "status", label: "Status", placeholder: "active", required: true },
];

const REVIEW_FIELDS = [
  { key: "name", label: "Name", placeholder: "Kasun Perera", required: true },
  { key: "phone", label: "Phone", placeholder: "077 123 4567", required: true },
  { key: "subject", label: "Subject", placeholder: "Need product support", required: true },
  { key: "message", label: "Message", placeholder: "Tell us what you need", required: true },
  { key: "status", label: "Status", placeholder: "new", required: true },
];

function normalizeCrudRecord(id, data) {
  return {
    id, ...data,
    fullName: data.fullName || [data.firstName, data.lastName].filter(Boolean).join(" ").trim() || "—",
    customerName: data.customerName || data.fullName || [data.firstName, data.lastName].filter(Boolean).join(" ").trim() || "—",
  };
}

function getDateValue(value) {
  if (!value) return null;
  if (typeof value?.toDate === "function") return value.toDate();
  if (typeof value?.seconds === "number") return new Date(value.seconds * 1000);
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function formatDateTime(value) {
  const date = getDateValue(value);
  return date ? date.toLocaleString("en-GB", { year: "numeric", month: "short", day: "2-digit", hour: "2-digit", minute: "2-digit" }) : "—";
}

function formatShortDate(value) {
  const date = getDateValue(value);
  return date ? date.toLocaleDateString("en-GB", { day: "2-digit", month: "short" }) : "—";
}

function normalizeLabel(value, fallback = "Unknown") {
  return String(value || fallback).trim() || fallback;
}

function getTradeInValue(item) { return Number(item.trade_value ?? item.estimate) || 0; }
function getTradeInCustomerName(item) { return item.customer_name || item.customerName || "—"; }
function getTradeInPhone(item) { return item.customer_phone || item.phone || "—"; }
function getTradeInModel(item) { return item.device_model || item.model || "—"; }
function getTradeInImei(item) { return item.IMEI || item.imei || "—"; }
function getTradeInStorage(item) { return item.storage || "—"; }
function getTradeInConditionSummary(item) {
  if (typeof item.condition === "string") return item.condition;
  if (item.condition && typeof item.condition === "object") {
    const flags = [];
    if (item.condition.powersOn) flags.push("Powers On");
    if (item.condition.screenCracked) flags.push("Screen Cracked");
    if (item.condition.backCracked) flags.push("Back Cracked");
    if (item.condition.buttonsWorking) flags.push("Buttons OK");
    if (item.condition.cameraWorking) flags.push("Camera OK");
    if (item.condition.batteryHealthy) flags.push("Battery OK");
    if (item.condition.waterDamage) flags.push("Water Damage");
    return flags.length ? flags.join(", ") : "—";
  }
  return "—";
}
function isMobileTradeIn(item) {
  const type = String(item.trade_type || item.deviceType || "").toLowerCase();
  return type.includes("mobile") || type.includes("smartphone") || (!type && (item.device_model || item.IMEI));
}

function groupCounts(items, getKey, limit = 6) {
  return Object.entries(items.reduce((acc, item) => { const key = normalizeLabel(getKey(item)); acc[key] = (acc[key] || 0) + 1; return acc; }, {}))
    .sort((a, b) => b[1] - a[1]).slice(0, limit).map(([label, value]) => ({ label, value }));
}

function buildTimeline(items, getValue) {
  return Object.values(items.reduce((acc, item) => {
    const date = getDateValue(item.createdAt || item.updatedAt);
    const key = date ? date.toISOString().slice(0, 10) : "undated";
    if (!acc[key]) acc[key] = { label: date ? formatShortDate(date) : "No date", sortKey: key, value: 0 };
    acc[key].value += getValue ? getValue(item) : 1;
    return acc;
  }, {})).sort((a, b) => a.sortKey.localeCompare(b.sortKey)).slice(-7);
}

function exportCrudCsv(title, items, fields) {
  const rows = [
    [...fields.map((f) => f.label), "Created At", "Updated At"],
    ...items.map((item) => [...fields.map((f) => String(item[f.key] ?? "—").replace(/,/g, " ")), formatDateTime(item.createdAt), formatDateTime(item.updatedAt)]),
  ];
  const csv = rows.map((r) => r.join(",")).join("\n");
  const a = Object.assign(document.createElement("a"), { href: URL.createObjectURL(new Blob([csv], { type: "text/csv" })), download: `${title.toLowerCase().replace(/\s+/g, "_")}_report.csv` });
  a.click(); URL.revokeObjectURL(a.href);
}

function buildCrudInsights(collectionName, items) {
  const lowerStatus = (item) => String(item.status || "").toLowerCase();
  if (collectionName === "products") {
    const active = items.filter((item) => lowerStatus(item) === "active").length;
    const inactive = items.filter((item) => lowerStatus(item) === "inactive").length;
    const stockTotal = items.reduce((sum, item) => sum + (Number(item.stock_in) || 0), 0);
    const inventoryValue = items.reduce((sum, item) => sum + (Number(item.price) || 0) * (Number(item.stock_in) || 0), 0);
    return { metrics: [{ label: "Products", value: items.length, tone: "blue", accent: "#0a84ff" }, { label: "Active", value: active, tone: "green", accent: "#30d158" }, { label: "Units In Stock", value: stockTotal, tone: "amber", accent: "#ff9f0a" }, { label: "Inventory Value", value: fmt(inventoryValue), tone: "purple", accent: "#bf5af2" }], donutTitle: "Product Status", donut: [{ label: "Active", value: active, color: "#30d158" }, { label: "Inactive", value: inactive, color: "#ff453a" }].filter((item) => item.value > 0), barTitle: "Top Categories", bars: groupCounts(items, (item) => item.category), trendTitle: "Inventory Value Trend", trend: buildTimeline(items, (item) => (Number(item.price) || 0) * (Number(item.stock_in) || 0)), filename: "product_report.pdf" };
  }
  if (collectionName === "customers") {
    const active = items.filter((item) => lowerStatus(item) === "active").length;
    return { metrics: [{ label: "Customers", value: items.length, tone: "blue", accent: "#0a84ff" }, { label: "Active", value: active, tone: "green", accent: "#30d158" }, { label: "Inactive", value: Math.max(items.length - active, 0), tone: "red", accent: "#ff453a" }, { label: "With Email", value: items.filter((item) => item.email).length, tone: "purple", accent: "#bf5af2" }], donutTitle: "Customer Status", donut: groupCounts(items, (item) => item.status).map((item, index) => ({ ...item, color: ["#30d158", "#ff9f0a", "#ff453a", "#bf5af2"][index % 4] })), barTitle: "Roles", bars: groupCounts(items, (item) => item.role), trendTitle: "Customer Additions", trend: buildTimeline(items), filename: "customer_report.pdf" };
  }
  if (collectionName === "selectedCustomers") {
    const totalBudget = items.reduce((sum, item) => sum + (Number(item.budget) || 0), 0);
    return { metrics: [{ label: "Leads", value: items.length, tone: "blue", accent: "#0a84ff" }, { label: "Follow Ups", value: items.filter((item) => lowerStatus(item).includes("follow")).length, tone: "amber", accent: "#ff9f0a" }, { label: "Hot Interest", value: items.filter((item) => item.interest).length, tone: "green", accent: "#30d158" }, { label: "Budget Sum", value: fmt(totalBudget), tone: "purple", accent: "#bf5af2" }], donutTitle: "Lead Status", donut: groupCounts(items, (item) => item.status).map((item, index) => ({ ...item, color: ["#0a84ff", "#ff9f0a", "#30d158", "#ff453a"][index % 4] })), barTitle: "Interested Products", bars: groupCounts(items, (item) => item.interest), trendTitle: "Lead Creation Trend", trend: buildTimeline(items), filename: "selected_customer_report.pdf" };
  }
  if (collectionName === "vendors") {
    const active = items.filter((item) => lowerStatus(item) === "active").length;
    return { metrics: [{ label: "Vendors", value: items.length, tone: "blue", accent: "#0a84ff" }, { label: "Active", value: active, tone: "green", accent: "#30d158" }, { label: "Categories", value: new Set(items.map((item) => normalizeLabel(item.category))).size, tone: "amber", accent: "#ff9f0a" }, { label: "With Email", value: items.filter((item) => item.email).length, tone: "purple", accent: "#bf5af2" }], donutTitle: "Vendor Status", donut: groupCounts(items, (item) => item.status).map((item, index) => ({ ...item, color: ["#30d158", "#ff453a", "#ff9f0a", "#bf5af2"][index % 4] })), barTitle: "Vendor Categories", bars: groupCounts(items, (item) => item.category), trendTitle: "Vendor Creation Trend", trend: buildTimeline(items), filename: "vendor_report.pdf" };
  }
  if (collectionName === "customerReviews") {
    return { metrics: [{ label: "Reviews", value: items.length, tone: "blue", accent: "#0a84ff" }, { label: "New", value: items.filter((item) => lowerStatus(item) === "new").length, tone: "green", accent: "#30d158" }, { label: "Resolved", value: items.filter((item) => ["closed", "resolved", "done"].includes(lowerStatus(item))).length, tone: "amber", accent: "#ff9f0a" }, { label: "Open", value: items.filter((item) => !["closed", "resolved", "done"].includes(lowerStatus(item))).length, tone: "red", accent: "#ff453a" }], donutTitle: "Review Status", donut: groupCounts(items, (item) => item.status).map((item, index) => ({ ...item, color: ["#0a84ff", "#30d158", "#ff9f0a", "#ff453a"][index % 4] })), barTitle: "Top Subjects", bars: groupCounts(items, (item) => item.subject), trendTitle: "Review Intake Trend", trend: buildTimeline(items), filename: "reviews_report.pdf" };
  }
  return { metrics: [{ label: "Records", value: items.length, tone: "blue", accent: "#0a84ff" }, { label: "With Status", value: items.filter((item) => item.status).length, tone: "green", accent: "#30d158" }, { label: "Created", value: items.filter((item) => item.createdAt).length, tone: "amber", accent: "#ff9f0a" }, { label: "Updated", value: items.filter((item) => item.updatedAt).length, tone: "purple", accent: "#bf5af2" }], donutTitle: "Status Breakdown", donut: groupCounts(items, (item) => item.status).map((item, index) => ({ ...item, color: ["#0a84ff", "#30d158", "#ff9f0a", "#ff453a"][index % 4] })), barTitle: "Top Groups", bars: groupCounts(items, (item) => item.category || item.type || item.role || item.subject), trendTitle: "Creation Trend", trend: buildTimeline(items), filename: "crud_report.pdf" };
}

function exportCrudPdf({ title, items, fields, collectionName }) {
  const insights = buildCrudInsights(collectionName, items);
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageWidth = 210, margin = 14;
  doc.setFillColor(9, 10, 15); doc.rect(0, 0, pageWidth, 297, "F");
  doc.setFillColor(10, 132, 255); doc.rect(0, 0, pageWidth, 2, "F");
  doc.setTextColor(245, 245, 247); doc.setFont("helvetica", "bold"); doc.setFontSize(20); doc.text(title, margin, 18);
  doc.setFont("helvetica", "normal"); doc.setFontSize(9); doc.setTextColor(160, 166, 176); doc.text(new Date().toLocaleDateString("en-GB"), pageWidth - margin, 18, { align: "right" });
  const cardWidth = (pageWidth - margin * 2 - 9) / 4;
  insights.metrics.slice(0, 4).forEach((item, index) => {
    const x = margin + index * (cardWidth + 3);
    doc.setFillColor(17, 19, 24); doc.roundedRect(x, 28, cardWidth, 20, 2, 2, "F");
    doc.setFillColor(...(item.accent === "#30d158" ? [48, 209, 88] : item.accent === "#ff453a" ? [255, 69, 58] : item.accent === "#ff9f0a" ? [255, 159, 10] : item.accent === "#bf5af2" ? [191, 90, 242] : [10, 132, 255]));
    doc.rect(x, 28, cardWidth, 1.2, "F");
    doc.setTextColor(160, 166, 176); doc.text(item.label, x + 4, 36);
    doc.setTextColor(245, 245, 247); doc.setFont("helvetica", "bold"); doc.setFontSize(13); doc.text(String(item.value), x + 4, 44);
    doc.setFont("helvetica", "normal"); doc.setFontSize(9);
  });
  let y = 56;
  const addChart = (chartTitle, imgData, height = 42) => {
    if (y + height + 14 > 275) { doc.addPage(); doc.setFillColor(9, 10, 15); doc.rect(0, 0, pageWidth, 297, "F"); y = 20; }
    doc.setFont("helvetica", "bold"); doc.setFontSize(10); doc.setTextColor(245, 245, 247); doc.text(chartTitle, margin, y + 5);
    doc.addImage(imgData, "PNG", margin, y + 8, pageWidth - margin * 2, height); y += height + 14;
  };
  if (insights.bars.length) addChart(insights.barTitle, buildChart("bar", { labels: insights.bars.map((item) => item.label.slice(0, 10)), values: insights.bars.map((item) => item.value), color: "#0a84ff", width: 540, height: 190 }), 44);
  if (insights.trend.length) addChart(insights.trendTitle, buildChart("area", { labels: insights.trend.map((item) => item.label), values: insights.trend.map((item) => item.value), color: "#bf5af2", width: 540, height: 190 }), 44);
  if (insights.donut.length) addChart(insights.donutTitle, buildChart("donut", { slices: insights.donut, width: 540, height: 200 }), 48);
  autoTable(doc, { startY: y, head: [[...fields.map((f) => f.label), "Created", "Updated"]], body: items.slice(0, 24).map((item) => [...fields.map((f) => item[f.key] || "—"), formatDateTime(item.createdAt), formatDateTime(item.updatedAt)]), theme: "plain", headStyles: { fillColor: [17, 19, 24], textColor: [160, 166, 176], fontSize: 8 }, bodyStyles: { fillColor: [9, 10, 15], textColor: [245, 245, 247], fontSize: 8 }, alternateRowStyles: { fillColor: [17, 19, 24] }, margin: { left: margin, right: margin } });
  const totalPages = doc.getNumberOfPages();
  for (let index = 1; index <= totalPages; index++) { doc.setPage(index); doc.setFillColor(9, 10, 15); doc.rect(0, 285, pageWidth, 12, "F"); doc.setFillColor(10, 132, 255); doc.rect(0, 295, pageWidth, 2, "F"); doc.setTextColor(160, 166, 176); doc.setFontSize(8); doc.text(`Page ${index} of ${totalPages}`, pageWidth / 2, 291, { align: "center" }); doc.text("iconX Admin Reports", margin, 291); }
  doc.save(insights.filename);
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^[0-9+\-\s()]{7,20}$/;

function validateCrudField(field, rawValue) {
  const value = typeof rawValue === "string" ? rawValue.trim() : rawValue;
  if (field.required && !String(value ?? "").trim()) return `${field.label} is required.`;
  if (!String(value ?? "").trim()) return "";
  if (field.type === "email" && !EMAIL_REGEX.test(String(value))) return `Please enter a valid ${field.label.toLowerCase()}.`;
  if (field.key === "phone" && !PHONE_REGEX.test(String(value))) return "Please enter a valid phone number.";
  if (field.type === "number") { const n = Number(value); if (Number.isNaN(n)) return `${field.label} must be a valid number.`; if (n < 0) return `${field.label} cannot be negative.`; }
  return "";
}

function CrudEntityModal({ title, fields, initialData, onClose, onSave }) {
  const [form, setForm] = useState(() => { const next = {}; fields.forEach((f) => { next[f.key] = initialData?.[f.key] ?? ""; }); return next; });
  const [error, setError] = useState("");
  const up = (key) => (e) => { setForm((prev) => ({ ...prev, [key]: e.target.value })); setError(""); };
  const submit = (e) => {
    e.preventDefault();
    for (const field of fields) { const message = validateCrudField(field, form[field.key]); if (message) { setError(message); return; } }
    onSave(form);
  };
  return (
    <div className="ap-modal-overlay" onClick={onClose}>
      <div className="ap-modal" style={{ maxWidth: 560 }} onClick={(e) => e.stopPropagation()}>
        <div className="ap-modal-header"><div className="ap-modal-title">{title}</div><button className="ap-modal-close" onClick={onClose}>×</button></div>
        <form onSubmit={submit}>
          {error && <div style={{ color: "#ff453a", fontSize: 13, marginBottom: 12 }}>{error}</div>}
          {fields.map((field) => (
            <div className="ap-form-group" key={field.key}>
              <label className="ap-form-label">{field.label}</label>
              <input className="ap-form-input" type={field.type || "text"} value={form[field.key]} onChange={up(field.key)} placeholder={field.placeholder} required={field.required} min={field.type === "number" ? "0" : undefined} />
            </div>
          ))}
          <button className="ap-submit-btn" type="submit">{initialData?.id ? "Update Record" : "Create Record"}</button>
        </form>
      </div>
    </div>
  );
}

function CrudPanel({ title, collectionName, fields, search, primaryKey, description }) {
  const [items, setItems] = useState([]);
  const [busy, setBusy] = useState(true);
  const [modal, setModal] = useState(null);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, collectionName), (snapshot) => { setItems(snapshot.docs.map((d) => normalizeCrudRecord(d.id, d.data()))); setBusy(false); }, (err) => { console.error(`Failed loading ${collectionName}:`, err); setItems([]); setBusy(false); });
    return unsub;
  }, [collectionName]);

  const filtered = items.filter((item) => JSON.stringify(item).toLowerCase().includes((search || "").toLowerCase()));
  const insights = buildCrudInsights(collectionName, filtered);

  const saveRecord = async (payload) => {
    const cleanPayload = Object.fromEntries(Object.entries(payload).map(([key, value]) => [key, typeof value === "string" ? value.trim() : value]));
    if (modal?.id) { await updateDoc(doc(db, collectionName, modal.id), { ...cleanPayload, updatedAt: serverTimestamp() }); }
    else { await addDoc(collection(db, collectionName), { ...cleanPayload, createdAt: serverTimestamp(), updatedAt: serverTimestamp() }); }
    setModal(null);
  };

  const removeRecord = async (id) => { await deleteDoc(doc(db, collectionName, id)); };

  return (
    <>
      <div className="ap-filter-bar">
        <div><div className="ap-settings-title">{title}</div><div className="ap-settings-sub">{description}</div></div>
        <div className="ap-filter-spacer" />
        <button className="ap-export-btn pdf" onClick={() => exportCrudPdf({ title, items: filtered, fields, collectionName })}>Export PDF</button>
        <button className="ap-export-btn excel" onClick={() => exportCrudCsv(title, filtered, fields)}>Export CSV</button>
        <button className="ap-add-btn" onClick={() => setModal({})}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Add New
        </button>
      </div>
      <div className="ap-grid-4">
        {insights.metrics.map((item) => (
          <div key={item.label} className={`ap-stat-card ${item.tone}`}>
            <div className={`ap-stat-icon ${item.tone}`}>{item.label.charAt(0)}</div>
            <div className="ap-stat-label">{item.label}</div>
            <div className="ap-stat-value" style={{ color: item.accent }}>{item.value}</div>
            <div className="ap-stat-sub">Filtered {primaryKey.toLowerCase()} insights</div>
          </div>
        ))}
      </div>
      <div className="ap-grid-2">
        <div className="ap-panel">
          <div className="ap-panel-title">{insights.barTitle}<span className="ap-panel-sub">Grouped from current results</span></div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={insights.bars.map((item) => ({ name: item.label, value: item.value }))}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#6e6e73" }} /><YAxis tick={{ fontSize: 10, fill: "#6e6e73" }} />
              <Tooltip content={<Tip />} /><Bar dataKey="value" fill="#0a84ff" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="ap-panel">
          <div className="ap-panel-title">{insights.donutTitle}<span className="ap-panel-sub">Live status distribution</span></div>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={insights.donut} dataKey="value" nameKey="label" innerRadius={50} outerRadius={80} paddingAngle={2}>
                {insights.donut.map((item) => <Cell key={item.label} fill={item.color} />)}
              </Pie>
              <Tooltip content={<Tip />} /><Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="ap-panel" style={{ marginBottom: 16 }}>
        <div className="ap-panel-title">{insights.trendTitle}<span className="ap-panel-sub">Recent activity across saved records</span></div>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={insights.trend.map((item) => ({ name: item.label, value: item.value }))}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#6e6e73" }} /><YAxis tick={{ fontSize: 10, fill: "#6e6e73" }} />
            <Tooltip content={<Tip />} />
            <Area type="monotone" dataKey="value" stroke="#bf5af2" fill="rgba(191,90,242,0.25)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div className="ap-panel">
        <div className="ap-table-wrap">
          <table className="ap-table">
            <thead><tr>{fields.map((f) => <th key={f.key}>{f.label}</th>)}<th>Actions</th></tr></thead>
            <tbody>
              {busy && <tr><td colSpan={fields.length + 1} style={{ textAlign: "center", padding: 24, color: "var(--muted)" }}>Loading...</td></tr>}
              {!busy && filtered.map((item) => (
                <tr key={item.id} className="data-row">
                  {fields.map((f, idx) => <td key={f.key} style={idx === 0 ? { fontFamily: "var(--syne)", fontWeight: 600 } : {}}>{item[f.key] || "—"}</td>)}
                  <td>
                    <button className="ap-action-btn" onClick={() => setModal(item)}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                      Edit
                    </button>
                    <button className="ap-action-btn del" onClick={() => removeRecord(item.id)}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
              {!busy && filtered.length === 0 && <tr><td colSpan={fields.length + 1} style={{ textAlign: "center", padding: 24, color: "var(--muted)" }}>No {primaryKey.toLowerCase()} records found</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
      {modal && <CrudEntityModal title={`${modal.id ? "Edit" : "Add"} ${primaryKey}`} fields={fields} initialData={modal} onClose={() => setModal(null)} onSave={saveRecord} />}
    </>
  );
}

/* ─── Users Customer Panel ─────────────────────────────────────────────────
   Reads from the `users` collection (role === "customer"), shows a Google
   badge for accounts that signed in via Google, and hides password-reset
   actions for Google-only users.
─────────────────────────────────────────────────────────────────────────── */
function UsersCustomerPanel({ search }) {
  const [users, setUsers] = useState([]);
  const [busy, setBusy] = useState(true);
  const [editModal, setEditModal] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [editError, setEditError] = useState('');

  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, 'users'),
      (snap) => {
        const customers = snap.docs
          .map((d) => ({ uid: d.id, ...d.data() }))
          .filter((u) => String(u.role || '').toLowerCase() === 'customer')
          .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
        setUsers(customers);
        setBusy(false);
      },
      (err) => { console.error('UsersCustomerPanel load error:', err); setUsers([]); setBusy(false); }
    );
    return unsub;
  }, []);

  const term = (search || '').trim().toLowerCase();
  const filtered = users.filter((u) =>
    !term ||
    [u.fullName, u.firstName, u.lastName, u.email, u.phone, u.status, u.provider]
      .filter(Boolean).some((v) => String(v).toLowerCase().includes(term))
  );

  const googleCount   = users.filter((u) => u.provider === 'google').length;
  const emailCount    = users.filter((u) => u.provider !== 'google').length;
  const activeCount   = users.filter((u) => String(u.status || '').toLowerCase() === 'active').length;

  const fmtDate = (value) => {
    if (!value) return '—';
    const d = value?.toDate ? value.toDate() : new Date(value);
    if (Number.isNaN(d.getTime())) return '—';
    return d.toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const getName = (u) =>
    u.fullName ||
    [u.firstName, u.lastName].filter(Boolean).join(' ').trim() ||
    u.email ||
    '—';

  const openEdit = (u) => {
    setEditForm({
      fullName: u.fullName || [u.firstName, u.lastName].filter(Boolean).join(' ').trim() || '',
      email:    u.email   || '',
      phone:    u.phone   || '',
      status:   u.status  || 'active',
    });
    setEditModal(u);
    setEditError('');
  };

  const saveEdit = async () => {
    if (!editForm.fullName?.trim()) { setEditError('Full name is required.'); return; }
    setSaving(true);
    try {
      await updateDoc(doc(db, 'users', editModal.uid), {
        fullName:  editForm.fullName.trim(),
        phone:     editForm.phone.trim(),
        status:    editForm.status.trim(),
        updatedAt: serverTimestamp(),
      });
      setEditModal(null);
    } catch (err) {
      console.error('Failed to update user:', err);
      setEditError('Save failed. Please try again.');
    } finally { setSaving(false); }
  };

  const GoogleBadge = () => (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 700,
      padding: '3px 9px', borderRadius: 20,
      background: 'rgba(66,133,244,0.15)', color: '#4285F4',
      border: '1px solid rgba(66,133,244,0.35)',
    }}>
      <svg width="11" height="11" viewBox="0 0 48 48">
        <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
        <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
        <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
        <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
      </svg>
      Google Login
    </span>
  );

  const EmailBadge = () => (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 700,
      padding: '3px 9px', borderRadius: 20,
      background: 'rgba(34,197,94,0.12)', color: 'var(--green)',
      border: '1px solid rgba(34,197,94,0.3)',
    }}>
      ✉ Email / Password
    </span>
  );

  return (
    <>
      {/* Stats row */}
      <div className="ap-grid-4">
        <div className="ap-stat-card blue">
          <div className="ap-stat-icon blue">👥</div>
          <div className="ap-stat-label">Total Customers</div>
          <div className="ap-stat-value">{users.length}</div>
          <div className="ap-stat-sub">Registered accounts</div>
        </div>
        <div className="ap-stat-card green">
          <div className="ap-stat-icon green">✓</div>
          <div className="ap-stat-label">Active</div>
          <div className="ap-stat-value" style={{ color: 'var(--green)' }}>{activeCount}</div>
          <div className="ap-stat-sub">Active accounts</div>
        </div>
        <div className="ap-stat-card blue" style={{ '--accent': '#4285F4' }}>
          <div className="ap-stat-icon blue" style={{ background: 'rgba(66,133,244,0.15)', color: '#4285F4' }}>G</div>
          <div className="ap-stat-label">Google Login</div>
          <div className="ap-stat-value" style={{ color: '#4285F4' }}>{googleCount}</div>
          <div className="ap-stat-sub">Signed in via Google</div>
        </div>
        <div className="ap-stat-card purple">
          <div className="ap-stat-icon purple">✉</div>
          <div className="ap-stat-label">Email / Password</div>
          <div className="ap-stat-value" style={{ color: 'var(--purple)' }}>{emailCount}</div>
          <div className="ap-stat-sub">Standard accounts</div>
        </div>
      </div>

      {/* Security notice for Google accounts */}
      <div className="ap-panel" style={{ marginBottom: 16, display: 'flex', alignItems: 'flex-start', gap: 14, padding: '14px 20px' }}>
        <div style={{ width: 34, height: 34, borderRadius: 8, background: 'rgba(66,133,244,0.14)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <svg width="16" height="16" viewBox="0 0 48 48">
            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
          </svg>
        </div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 3 }}>Google Login Customers — Security Note</div>
          <div style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.6 }}>
            Customers marked <strong style={{ color: '#4285F4' }}>Google Login</strong> authenticated via Google OAuth and have <strong style={{ color: 'var(--text)' }}>no password</strong>.
            Password reset emails are <strong style={{ color: 'var(--red)' }}>blocked</strong> for these accounts — even from the admin panel — to prevent account hijacking.
            These customers can only sign in using the <strong style={{ color: 'var(--text)' }}>"Continue with Google"</strong> button.
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="ap-panel">
        <div className="ap-panel-title">
          Customer Accounts
          <span className="ap-panel-sub">{filtered.length} {filtered.length === 1 ? 'customer' : 'customers'} · newest first</span>
        </div>
        <div className="ap-table-wrap">
          <table className="ap-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Login Method</th>
                <th>Status</th>
                <th>Joined</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {busy && <tr><td colSpan={7} style={{ textAlign: 'center', padding: 24, color: 'var(--muted)' }}>Loading...</td></tr>}
              {!busy && filtered.length === 0 && (
                <tr><td colSpan={7} style={{ textAlign: 'center', padding: 36, color: 'var(--muted)' }}>
                  {users.length === 0
                    ? 'No customer accounts yet. Customers appear here automatically when they register or sign in with Google.'
                    : 'No customers match your search.'}
                </td></tr>
              )}
              {!busy && filtered.map((u) => (
                <tr key={u.uid} className="data-row">
                  <td style={{ fontWeight: 600 }}>
                    {getName(u)}
                    {u.photoURL && (
                      <img
                        src={u.photoURL}
                        alt=""
                        style={{ width: 22, height: 22, borderRadius: '50%', marginLeft: 8, verticalAlign: 'middle', border: '1.5px solid rgba(66,133,244,0.4)' }}
                        referrerPolicy="no-referrer"
                      />
                    )}
                  </td>
                  <td style={{ fontSize: 12, color: 'var(--text-dim)' }}>{u.email || '—'}</td>
                  <td style={{ fontSize: 12, color: 'var(--text-dim)' }}>{u.phone || '—'}</td>
                  <td>{u.provider === 'google' ? <GoogleBadge /> : <EmailBadge />}</td>
                  <td>
                    <span style={{
                      fontSize: 11, fontWeight: 600, padding: '3px 9px', borderRadius: 20, display: 'inline-block',
                      background: String(u.status || '').toLowerCase() === 'active' ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)',
                      color: String(u.status || '').toLowerCase() === 'active' ? 'var(--green)' : 'var(--red)',
                      border: String(u.status || '').toLowerCase() === 'active' ? '1px solid rgba(34,197,94,0.3)' : '1px solid rgba(239,68,68,0.3)',
                    }}>
                      {u.status || 'active'}
                    </span>
                  </td>
                  <td style={{ fontSize: 12, color: 'var(--text-dim)' }}>{fmtDate(u.createdAt)}</td>
                  <td>
                    <button className="ap-action-btn" onClick={() => openEdit(u)}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit modal */}
      {editModal && (
        <div className="ap-modal-overlay" onClick={() => setEditModal(null)}>
          <div className="ap-modal" style={{ maxWidth: 520 }} onClick={(e) => e.stopPropagation()}>
            <div className="ap-modal-header">
              <div className="ap-modal-title">Edit Customer</div>
              <button className="ap-modal-close" onClick={() => setEditModal(null)}>×</button>
            </div>
            {editError && <div style={{ color: 'var(--red)', fontSize: 13, marginBottom: 12 }}>{editError}</div>}

            {/* Google account info banner */}
            {editModal.provider === 'google' && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px',
                background: 'rgba(66,133,244,0.1)', border: '1px solid rgba(66,133,244,0.25)',
                borderRadius: 10, marginBottom: 16, fontSize: 12, color: '#4285F4',
              }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                This is a <strong style={{ margin: '0 3px' }}>Google Login</strong> account. Email cannot be changed here — it is managed by Google.
              </div>
            )}

            <div className="ap-form-group">
              <label className="ap-form-label">Full Name</label>
              <input className="ap-form-input" value={editForm.fullName} onChange={(e) => setEditForm((p) => ({ ...p, fullName: e.target.value }))} placeholder="Kasun Perera" />
            </div>
            <div className="ap-form-group">
              <label className="ap-form-label">Email{editModal.provider === 'google' ? ' (Google — read only)' : ''}</label>
              <input className="ap-form-input" value={editForm.email} readOnly style={{ opacity: 0.5, cursor: 'not-allowed' }} />
            </div>
            <div className="ap-form-group">
              <label className="ap-form-label">Phone</label>
              <input className="ap-form-input" value={editForm.phone} onChange={(e) => setEditForm((p) => ({ ...p, phone: e.target.value }))} placeholder="077 123 4567" />
            </div>
            <div className="ap-form-group">
              <label className="ap-form-label">Status</label>
              <input className="ap-form-input" value={editForm.status} onChange={(e) => setEditForm((p) => ({ ...p, status: e.target.value }))} placeholder="active" />
            </div>
            <button className="ap-submit-btn" onClick={saveEdit} disabled={saving}>
              {saving ? 'Saving…' : 'Update Customer'}
            </button>
          </div>
        </div>
      )}
    </>
  );
}

function exportCommercePdf(orders, cartItems) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageWidth = 210, pageHeight = 297, margin = 14;
  const totalRevenue = orders.reduce((sum, o) => sum + (Number(o.total) || 0), 0);
  const totalOrderedItems = orders.reduce((sum, o) => sum + (o.items || []).reduce((inner, i) => inner + (i.quantity || 1), 0), 0);
  const totalCartQty = cartItems.reduce((sum, i) => sum + (i.quantity || 1), 0);
  const avgOrderValue = orders.length ? totalRevenue / orders.length : 0;
  const topOrder = [...orders].sort((a, b) => (Number(b.total) || 0) - (Number(a.total) || 0))[0] || null;
  const latestOrder = [...orders].sort((a, b) => `${b.createdAt || ""}`.localeCompare(`${a.createdAt || ""}`))[0] || null;
  const orderStatus = groupCounts(orders, (o) => o.status);
  const topProducts = groupCounts(orders.flatMap((o) => o.items || []), (i) => i.name);
  const revenueTrend = buildTimeline(orders, (o) => Number(o.total) || 0);

  const paintPage = () => { doc.setFillColor(9, 10, 15); doc.rect(0, 0, pageWidth, pageHeight, "F"); doc.setFillColor(10, 132, 255); doc.rect(0, 0, pageWidth, 2, "F"); };
  const ensureSpace = (needed, currentY) => { if (currentY + needed <= 276) return currentY; doc.addPage(); paintPage(); return 20; };

  paintPage();
  doc.setTextColor(245, 245, 247); doc.setFont("helvetica", "bold"); doc.setFontSize(21); doc.text("iconX Commerce Report", margin, 18);
  doc.setFont("helvetica", "normal"); doc.setFontSize(10); doc.setTextColor(160, 166, 176); doc.text("Cart and order performance summary", margin, 25);
  doc.setFontSize(9); doc.text(new Date().toLocaleDateString("en-GB"), pageWidth - margin, 18, { align: "right" }); doc.text(`Orders: ${orders.length}`, pageWidth - margin, 25, { align: "right" });

  const cards = [["Orders", orders.length, [10, 132, 255]], ["Revenue", fmt(totalRevenue), [48, 209, 88]], ["Cart Qty", totalCartQty, [191, 90, 242]], ["Pending", orders.filter((o) => String(o.status || "").toLowerCase() === "pending").length, [255, 159, 10]]];
  const cardWidth = (pageWidth - margin * 2 - 9) / 4;
  cards.forEach(([label, value, color], index) => {
    const x = margin + index * (cardWidth + 3);
    doc.setFillColor(17, 19, 24); doc.roundedRect(x, 30, cardWidth, 21, 2, 2, "F");
    doc.setFillColor(...color); doc.rect(x, 30, cardWidth, 1.3, "F");
    doc.setTextColor(160, 166, 176); doc.text(String(label), x + cardWidth / 2, 38, { align: "center" });
    doc.setTextColor(245, 245, 247); doc.setFont("helvetica", "bold"); doc.setFontSize(13); doc.text(String(value), x + cardWidth / 2, 46, { align: "center" });
    doc.setFont("helvetica", "normal"); doc.setFontSize(9);
  });

  let y = 59;
  doc.setFillColor(17, 19, 24); doc.roundedRect(margin, y, pageWidth - margin * 2, 28, 3, 3, "F");
  doc.setFont("helvetica", "bold"); doc.setFontSize(10); doc.setTextColor(245, 245, 247); doc.text("Commerce Snapshot", margin + 4, y + 7);
  doc.setFont("helvetica", "normal"); doc.setFontSize(9); doc.setTextColor(160, 166, 176);
  doc.text(`Average order value: ${fmt(avgOrderValue)}`, margin + 4, y + 14); doc.text(`Ordered item qty: ${totalOrderedItems}`, margin + 4, y + 20);
  doc.text(`Top order: ${topOrder ? `${topOrder.id} (${fmt(topOrder.total)})` : "-"}`, pageWidth / 2 + 4, y + 14);
  doc.text(`Latest order: ${latestOrder ? formatDateTime(latestOrder.createdAt) : "-"}`, pageWidth / 2 + 4, y + 20);

  y += 36;
  const addChart = (title, imgData, height = 44) => { y = ensureSpace(height + 16, y); doc.setFont("helvetica", "bold"); doc.setTextColor(245, 245, 247); doc.text(title, margin, y + 5); doc.addImage(imgData, "PNG", margin, y + 8, pageWidth - margin * 2, height); y += height + 14; };
  if (topProducts.length) addChart("Top Ordered Products", buildChart("bar", { labels: topProducts.slice(0, 10).map((i) => i.label.slice(0, 12)), values: topProducts.slice(0, 10).map((i) => i.value), color: "#0a84ff", width: 540, height: 190 }));
  if (revenueTrend.length) addChart("Revenue Trend", buildChart("area", { labels: revenueTrend.map((i) => i.label), values: revenueTrend.map((i) => i.value), color: "#30d158", width: 540, height: 190 }));
  if (orderStatus.length) addChart("Order Status Mix", buildChart("donut", { slices: orderStatus.map((i, index) => ({ ...i, color: ["#0a84ff", "#30d158", "#ff9f0a", "#ff453a"][index % 4] })), width: 540, height: 200 }), 48);

  y = ensureSpace(18, y); doc.setFont("helvetica", "bold"); doc.setFontSize(10); doc.setTextColor(245, 245, 247); doc.text("Recent Orders", margin, y + 5); y += 8;
  autoTable(doc, { startY: y, head: [["Order ID", "Customer", "Items", "Total", "Status", "Created"]], body: orders.slice(0, 20).map((o) => [o.id, o.customer?.fullName || "-", (o.items || []).reduce((s, i) => s + (i.quantity || 1), 0), fmt(o.total), o.status || "-", formatDateTime(o.createdAt)]), theme: "plain", headStyles: { fillColor: [17, 19, 24], textColor: [160, 166, 176], fontSize: 8.5, fontStyle: "bold", cellPadding: 2.8 }, bodyStyles: { fillColor: [9, 10, 15], textColor: [245, 245, 247], fontSize: 8.2, cellPadding: 2.8 }, alternateRowStyles: { fillColor: [17, 19, 24] }, didParseCell: (data) => { if (data.section === "body" && data.column.index === 4) { const s = String(data.cell.raw || "").toLowerCase(); data.cell.styles.textColor = s === "delivered" ? [48, 209, 88] : s === "pending" ? [255, 159, 10] : s === "cancelled" ? [255, 69, 58] : [10, 132, 255]; data.cell.styles.fontStyle = "bold"; } }, margin: { left: margin, right: margin } });

  let cartStartY = doc.lastAutoTable.finalY + 10; cartStartY = ensureSpace(22, cartStartY);
  doc.setFont("helvetica", "bold"); doc.setFontSize(10); doc.setTextColor(245, 245, 247); doc.text("Live Cart Snapshot", margin, cartStartY + 5);
  autoTable(doc, { startY: cartStartY + 8, head: [["Cart Item", "Price", "Qty", "Subtotal"]], body: cartItems.map((i) => [i.name || "-", fmt(i.price), i.quantity || 1, fmt((Number(i.price) || 0) * (i.quantity || 1))]), theme: "plain", headStyles: { fillColor: [17, 19, 24], textColor: [160, 166, 176], fontSize: 8.5, fontStyle: "bold", cellPadding: 2.8 }, bodyStyles: { fillColor: [9, 10, 15], textColor: [245, 245, 247], fontSize: 8.2, cellPadding: 2.8 }, alternateRowStyles: { fillColor: [17, 19, 24] }, margin: { left: margin, right: margin } });

  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) { doc.setPage(i); doc.setFillColor(9, 10, 15); doc.rect(0, 285, pageWidth, 12, "F"); doc.setFillColor(10, 132, 255); doc.rect(0, 295, pageWidth, 2, "F"); doc.setFont("helvetica", "normal"); doc.setFontSize(8); doc.setTextColor(160, 166, 176); doc.text(`Page ${i} of ${totalPages}`, pageWidth / 2, 291, { align: "center" }); doc.text("iconX Commerce Admin", margin, 291); }
  doc.save("iconX_commerce_report.pdf");
}

/* ─── COMMERCE PANEL (UPDATED) ─────────────────────────────── */
function CommercePanel({ search }) {
  const [orders, setOrders] = useState([]);
  const [cartItems, setCartItems] = useState([]);
  const [busy, setBusy] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    const syncCart = () => setCartItems(JSON.parse(localStorage.getItem('cart')) || []);
    syncCart();
    window.addEventListener(CART_EVENT, syncCart);
    window.addEventListener('storage', syncCart);
    const unsub = onSnapshot(collection(db, 'orders'), (snapshot) => {
      setOrders(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
      setBusy(false);
    });
    return () => {
      window.removeEventListener(CART_EVENT, syncCart);
      window.removeEventListener('storage', syncCart);
      unsub();
    };
  }, []);

  const updateCartQty = (id, qty) => {
    if (qty < 1) return;
    const cart = (JSON.parse(localStorage.getItem('cart')) || []).map((item) =>
      item.id === id ? { ...item, quantity: qty } : item
    );
    localStorage.setItem('cart', JSON.stringify(cart));
    window.dispatchEvent(new Event(CART_EVENT));
  };

  const deleteCartItem = (id) => {
    const cart = (JSON.parse(localStorage.getItem('cart')) || []).filter((item) => item.id !== id);
    localStorage.setItem('cart', JSON.stringify(cart));
    window.dispatchEvent(new Event(CART_EVENT));
  };

  const updateOrderStatus = async (id, status) => {
    await updateDoc(doc(db, 'orders', id), { status });
  };

  const deleteOrder = async (id) => {
    await deleteDoc(doc(db, 'orders', id));
  };

  const STATUS_FILTERS = ['all', 'pending', 'approved', 'delivered', 'cancelled'];

  const filteredOrders = orders.filter((o) => {
    const matchSearch = JSON.stringify(o).toLowerCase().includes((search || '').toLowerCase());
    const matchStatus = statusFilter === 'all' || String(o.status || '').toLowerCase() === statusFilter;
    return matchSearch && matchStatus;
  });

  const totalRevenue = orders.reduce((s, o) => s + (Number(o.total) || 0), 0);
  const pendingCount = orders.filter((o) => String(o.status || '').toLowerCase() === 'pending').length;
  const cartQty = cartItems.reduce((s, i) => s + (i.quantity || 1), 0);
  const cartTotal = cartItems.reduce((s, i) => s + (Number(i.price) || 0) * (i.quantity || 1), 0);

  const orderBadgeClass = (s) => {
    const lower = String(s || '').toLowerCase();
    if (lower === 'delivered') return 'optimal';
    if (lower === 'approved') return 'info';
    if (lower === 'cancelled') return 'critical';
    return 'stable';
  };

  const orderIcon = (s) => {
    const lower = String(s || '').toLowerCase();
    if (lower === 'delivered') return '✓';
    if (lower === 'cancelled') return '✕';
    if (lower === 'approved') return '✓';
    return '⏳';
  };

  const exportOrdersCsv = () => {
    const rows = [
      ['Order ID', 'Customer', 'Items', 'Total', 'Status', 'Created'],
      ...orders.map((o) => [o.id, o.customer?.fullName || '-', (o.items || []).length, o.total, o.status, formatDateTime(o.createdAt)]),
    ];
    const csv = rows.map((r) => r.join(',')).join('\n');
    const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(new Blob([csv], { type: 'text/csv' })), download: 'orders.csv' });
    a.click(); URL.revokeObjectURL(a.href);
  };

  return (
    <>
      {/* ── KPI Cards ── */}
      <div className="ap-grid-4">
        {[
          { color: 'blue',   icon: '🛒', label: 'Total Orders',   val: orders.length,      sub: 'across all statuses' },
          { color: 'green',  icon: '💰', label: 'Total Revenue',  val: fmt(totalRevenue),  sub: 'from all orders', small: true },
          { color: 'amber',  icon: '⏳', label: 'Pending',        val: pendingCount,        sub: 'awaiting approval' },
          { color: 'purple', icon: '🛍', label: 'Cart Items',     val: cartQty,             sub: fmt(cartTotal) + ' total' },
        ].map((k, i) => (
          <div key={i} className={`ap-stat-card ${k.color}`}>
            <div className={`ap-stat-icon ${k.color}`}>{k.icon}</div>
            <div className="ap-stat-label">{k.label}</div>
            <div className="ap-stat-value" style={{
              color: ['', 'var(--green)', 'var(--amber)', 'var(--purple)'][i] || undefined,
              fontSize: k.small ? 17 : undefined,
            }}>{k.val}</div>
            <div className="ap-stat-sub">{k.sub}</div>
          </div>
        ))}
      </div>

      {/* ── Filter bar ── */}
      <div className="ap-filter-bar">
        {STATUS_FILTERS.map((f) => (
          <button
            key={f}
            className={`ap-filter-btn ${statusFilter === f ? 'active' : ''}`}
            onClick={() => setStatusFilter(f)}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
            {' '}({f === 'all' ? orders.length : orders.filter((o) => String(o.status || '').toLowerCase() === f).length})
          </button>
        ))}
        <div className="ap-filter-spacer" />
        <button className="ap-export-btn pdf" onClick={() => exportCommercePdf(orders, cartItems)}>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          Export PDF
        </button>
        <button className="ap-export-btn excel" onClick={exportOrdersCsv}>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          Export CSV
        </button>
      </div>

      {/* ── Orders + Cart side by side ── */}
      <div className="ap-grid-2">

        {/* Orders Table */}
        <div className="ap-panel">
          <div className="ap-panel-title">
            Orders
            <span className="ap-panel-sub">{filteredOrders.length} record{filteredOrders.length !== 1 ? 's' : ''}</span>
          </div>
          <div className="ap-table-wrap">
            <table className="ap-table">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Customer</th>
                  <th>Items</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {busy && (
                  <tr><td colSpan={6} style={{ textAlign: 'center', padding: 28, color: 'var(--muted)' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: 'spin 1s linear infinite', display: 'inline-block', marginRight: 8 }}><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
                    Loading orders…
                  </td></tr>
                )}
                {!busy && filteredOrders.map((order) => (
                  <tr key={order.id} className="data-row">
                    <td style={{ fontFamily: 'var(--syne)', fontWeight: 700, fontSize: 11, color: 'var(--muted)', letterSpacing: '0.3px' }}>
                      #{String(order.id).slice(-6).toUpperCase()}
                    </td>
                    <td style={{ fontWeight: 600 }}>{order.customer?.fullName || '—'}</td>
                    <td style={{ color: 'var(--muted)' }}>
                      {(order.items || []).reduce((s, i) => s + (i.quantity || 1), 0)} items
                    </td>
                    <td style={{ fontFamily: 'var(--syne)', fontWeight: 700, color: 'var(--green)' }}>
                      {fmt(order.total)}
                    </td>
                    <td>
                      <span className={`ap-badge ${orderBadgeClass(order.status)}`}>
                        {orderIcon(order.status)} {order.status || 'Pending'}
                      </span>
                    </td>
                    <td onClick={(e) => e.stopPropagation()}>
                      <button
                        className="ap-action-btn success"
                        title="Approve order"
                        onClick={() => updateOrderStatus(order.id, 'approved')}
                      >
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                        Approve
                      </button>
                      <button
                        className="ap-action-btn"
                        title="Mark as delivered"
                        onClick={() => updateOrderStatus(order.id, 'delivered')}
                      >
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                        Deliver
                      </button>
                      <button
                        className="ap-action-btn del"
                        title="Delete order"
                        onClick={() => deleteOrder(order.id)}
                      >
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
                      </button>
                    </td>
                  </tr>
                ))}
                {!busy && filteredOrders.length === 0 && (
                  <tr><td colSpan={6} style={{ textAlign: 'center', padding: 36, color: 'var(--muted)' }}>
                    <div style={{ fontSize: 28, opacity: .2, marginBottom: 8 }}>🛒</div>
                    No orders match this filter
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Live Cart */}
        <div className="ap-panel">
          <div className="ap-panel-title">
            Live Cart
            <span className="ap-panel-sub">{cartQty} item{cartQty !== 1 ? 's' : ''} · {fmt(cartTotal)}</span>
          </div>

          {cartItems.length === 0 ? (
            <div className="ap-cart-empty">
              <div className="ap-cart-empty-icon">🛒</div>
              <div style={{ fontFamily: 'var(--syne)', fontWeight: 600, marginBottom: 4 }}>Cart is empty</div>
              <div style={{ fontSize: 12 }}>Items added from the storefront will appear here</div>
            </div>
          ) : (
            <>
              {cartItems.map((item) => (
                <div key={item.id} className="ap-cart-item">
                  <div className="ap-cart-thumb">📱</div>
                  <div className="ap-cart-info">
                    <div className="ap-cart-name">{item.name}</div>
                    <div className="ap-cart-price">{fmt(item.price)} each</div>
                  </div>
                  <div className="ap-qty-ctrl">
                    <button className="ap-qty-btn" onClick={() => updateCartQty(item.id, (item.quantity || 1) - 1)}>−</button>
                    <span className="ap-qty-val">{item.quantity || 1}</span>
                    <button className="ap-qty-btn" onClick={() => updateCartQty(item.id, (item.quantity || 1) + 1)}>+</button>
                  </div>
                  <button
                    className="ap-action-btn del"
                    style={{ marginLeft: 6, padding: '4px 8px' }}
                    onClick={() => deleteCartItem(item.id)}
                  >
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
                  </button>
                </div>
              ))}
              <div className="ap-cart-total-row">
                <span className="ap-cart-total-label">Cart Total</span>
                <span className="ap-cart-total-val">{fmt(cartTotal)}</span>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}

/* ─── TRADE-IN PANEL ───────────────────────────────────────── */
function exportTradeInPdf(items) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageWidth = 210, margin = 14;
  const mobileOnly = items.filter(isMobileTradeIn);
  const brandMix = groupCounts(mobileOnly, (item) => item.brand);
  const statusMix = groupCounts(mobileOnly, (item) => item.status).map((item, index) => ({ ...item, color: ["#0a84ff", "#30d158", "#ff9f0a", "#ff453a"][index % 4] }));
  const estimateTrend = buildTimeline(mobileOnly, (item) => getTradeInValue(item));

  doc.setFillColor(9, 10, 15); doc.rect(0, 0, pageWidth, 297, "F"); doc.setFillColor(10, 132, 255); doc.rect(0, 0, pageWidth, 2, "F");
  doc.setTextColor(245, 245, 247); doc.setFont("helvetica", "bold"); doc.setFontSize(20); doc.text("Mobile Trade-In Report", margin, 18);
  doc.setFont("helvetica", "normal"); doc.setFontSize(9); doc.setTextColor(160, 166, 176); doc.text(new Date().toLocaleDateString("en-GB"), pageWidth - margin, 18, { align: "right" });

  const cards = [["Mobile Leads", mobileOnly.length], ["Avg Estimate", fmt(mobileOnly.length ? Math.round(mobileOnly.reduce((s, i) => s + getTradeInValue(i), 0) / mobileOnly.length) : 0)], ["Pending", mobileOnly.filter((i) => String(i.status || "").toLowerCase() === "pending").length], ["Brands", new Set(mobileOnly.map((i) => i.brand || "Unknown")).size]];
  const cardWidth = (pageWidth - margin * 2 - 9) / 4;
  cards.forEach(([label, value], index) => {
    const x = margin + index * (cardWidth + 3);
    doc.setFillColor(17, 19, 24); doc.roundedRect(x, 28, cardWidth, 20, 2, 2, "F");
    doc.setTextColor(160, 166, 176); doc.text(String(label), x + 4, 36);
    doc.setTextColor(245, 245, 247); doc.setFont("helvetica", "bold"); doc.setFontSize(13); doc.text(String(value), x + 4, 44);
    doc.setFont("helvetica", "normal"); doc.setFontSize(9);
  });

  doc.text("Brand Mix", margin, 60); doc.addImage(buildChart("bar", { labels: brandMix.map((i) => i.label.slice(0, 10)), values: brandMix.map((i) => i.value), color: "#0a84ff", width: 540, height: 190 }), "PNG", margin, 64, pageWidth - margin * 2, 44);
  doc.text("Estimate Trend", margin, 116); doc.addImage(buildChart("area", { labels: estimateTrend.map((i) => i.label), values: estimateTrend.map((i) => i.value), color: "#30d158", width: 540, height: 190 }), "PNG", margin, 120, pageWidth - margin * 2, 44);
  if (statusMix.length) { doc.text("Status Mix", margin, 176); doc.addImage(buildChart("donut", { slices: statusMix, width: 540, height: 200 }), "PNG", margin, 180, pageWidth - margin * 2, 48); }

  doc.addPage(); doc.setFillColor(9, 10, 15); doc.rect(0, 0, pageWidth, 297, "F");
  autoTable(doc, { startY: 16, head: [["Customer", "Phone", "Brand", "Model", "IMEI", "Estimate", "Status", "Created"]], body: mobileOnly.map((i) => [getTradeInCustomerName(i), getTradeInPhone(i), i.brand || "—", getTradeInModel(i), getTradeInImei(i), fmt(getTradeInValue(i)), i.status || "—", formatDateTime(i.createdAt)]), theme: "plain", headStyles: { fillColor: [17, 19, 24], textColor: [160, 166, 176], fontSize: 8 }, bodyStyles: { fillColor: [9, 10, 15], textColor: [245, 245, 247], fontSize: 8 }, alternateRowStyles: { fillColor: [17, 19, 24] }, margin: { left: margin, right: margin } });
  doc.save("mobile_trade_in_report.pdf");
}

function TradeInPanel({ search }) {
  const [items, setItems] = useState([]);
  const [busy, setBusy] = useState(true);
  const [viewItem, setViewItem] = useState(null);
  const [editItem, setEditItem] = useState(null);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "tradeIns"), (snapshot) => { setItems(snapshot.docs.map((d) => ({ id: d.id, ...d.data() }))); setBusy(false); }, (error) => { console.error("Failed loading trade-ins:", error); setItems([]); setBusy(false); });
    return unsub;
  }, []);

  const handleUpdateTrade = async (id, data) => {
    try {
      await updateDoc(doc(db, "tradeIns", id), { customerName: data.customerName || "", phone: data.phone || "", brand: data.brand || "", model: data.model || "", imei: data.imei || "", storage: data.storage || "", estimatedValue: Number(data.estimatedValue) || 0, status: data.status || "Pending", notes: data.notes || "", updatedAt: serverTimestamp() });
      setEditItem(null); alert("Mobile trade-in updated successfully.");
    } catch (error) { console.error("Update failed:", error); alert("Failed to update mobile trade-in."); }
  };

  const handleDeleteTrade = async (id) => {
    if (!window.confirm("Are you sure you want to delete this mobile trade-in request?")) return;
    try { await deleteDoc(doc(db, "tradeIns", id)); alert("Mobile trade-in deleted successfully."); }
    catch (error) { console.error("Delete failed:", error); alert("Failed to delete mobile trade-in."); }
  };

  const filtered = items.filter((item) => JSON.stringify(item).toLowerCase().includes((search || "").toLowerCase()));
  const mobileOnly = filtered.filter(isMobileTradeIn);
  const avgEstimate = mobileOnly.length ? Math.round(mobileOnly.reduce((s, i) => s + getTradeInValue(i), 0) / mobileOnly.length) : 0;
  const brandMix = groupCounts(mobileOnly, (item) => item.brand);
  const statusMix = groupCounts(mobileOnly, (item) => item.status).map((item, index) => ({ ...item, color: ["#0a84ff", "#30d158", "#ff9f0a", "#ff453a"][index % 4] }));
  const estimateTrend = buildTimeline(mobileOnly, (item) => getTradeInValue(item));

  return (
    <>
      <div className="ap-filter-bar">
        <div><div className="ap-settings-title">Mobile Trade-In</div><div className="ap-settings-sub">Visual report for mobile trade-in requests saved from the trade-in calculator.</div></div>
        <div className="ap-filter-spacer" />
        <button className="ap-export-btn pdf" onClick={() => exportTradeInPdf(filtered)}>Export Trade-In PDF</button>
      </div>
      <div className="ap-grid-4">
        <div className="ap-stat-card blue"><div className="ap-stat-icon blue">M</div><div className="ap-stat-label">Mobile Leads</div><div className="ap-stat-value">{mobileOnly.length}</div><div className="ap-stat-sub">Smartphone trade-ins in current view</div></div>
        <div className="ap-stat-card green"><div className="ap-stat-icon green">A</div><div className="ap-stat-label">Avg Estimate</div><div className="ap-stat-value" style={{ color: "var(--green)", fontSize: 18 }}>{fmt(avgEstimate)}</div><div className="ap-stat-sub">Average expected value</div></div>
        <div className="ap-stat-card amber"><div className="ap-stat-icon amber">P</div><div className="ap-stat-label">Pending Requests</div><div className="ap-stat-value" style={{ color: "var(--amber)" }}>{mobileOnly.filter((i) => String(i.status || "").toLowerCase() === "pending").length}</div><div className="ap-stat-sub">Awaiting staff follow-up</div></div>
        <div className="ap-stat-card purple"><div className="ap-stat-icon purple">B</div><div className="ap-stat-label">Brands</div><div className="ap-stat-value" style={{ color: "var(--purple)" }}>{new Set(mobileOnly.map((i) => i.brand || "Unknown")).size}</div><div className="ap-stat-sub">Distinct mobile brands</div></div>
      </div>
      <div className="ap-grid-2">
        <div className="ap-panel">
          <div className="ap-panel-title">Brand Demand <span className="ap-panel-sub">Saved mobile trade-ins</span></div>
          <ResponsiveContainer width="100%" height={220}><BarChart data={brandMix.map((i) => ({ name: i.label, value: i.value }))}><CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" /><XAxis dataKey="name" tick={{ fontSize: 10, fill: "#6e6e73" }} /><YAxis tick={{ fontSize: 10, fill: "#6e6e73" }} /><Tooltip content={<Tip />} /><Bar dataKey="value" fill="#0a84ff" radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer>
        </div>
        <div className="ap-panel">
          <div className="ap-panel-title">Status Breakdown <span className="ap-panel-sub">Trade-in pipeline health</span></div>
          <ResponsiveContainer width="100%" height={220}><PieChart><Pie data={statusMix} dataKey="value" nameKey="label" innerRadius={50} outerRadius={80} paddingAngle={2}>{statusMix.map((i) => <Cell key={i.label} fill={i.color} />)}</Pie><Tooltip content={<Tip />} /><Legend /></PieChart></ResponsiveContainer>
        </div>
      </div>
      <div className="ap-panel" style={{ marginBottom: 16 }}>
        <div className="ap-panel-title">Estimate Trend <span className="ap-panel-sub">Recent mobile valuation movement</span></div>
        <ResponsiveContainer width="100%" height={220}><AreaChart data={estimateTrend.map((i) => ({ name: i.label, value: i.value }))}><CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" /><XAxis dataKey="name" tick={{ fontSize: 10, fill: "#6e6e73" }} /><YAxis tick={{ fontSize: 10, fill: "#6e6e73" }} /><Tooltip content={<Tip />} /><Area type="monotone" dataKey="value" stroke="#30d158" fill="rgba(48,209,88,0.25)" /></AreaChart></ResponsiveContainer>
      </div>
      <div className="ap-panel">
        <div className="ap-panel-title">Mobile Trade-In Requests <span className="ap-panel-sub">{busy ? "Loading…" : `${mobileOnly.length} mobile entries`}</span></div>
        <div className="ap-table-wrap">
          <table className="ap-table">
            <thead><tr><th>Customer</th><th>Phone</th><th>Brand</th><th>Model</th><th>IMEI</th><th>Storage</th><th>Estimate</th><th>Status</th><th>Created</th><th>Actions</th></tr></thead>
            <tbody>
              {busy && <tr><td colSpan={10} style={{ textAlign: "center", padding: 24, color: "var(--muted)" }}>Loading trade-in requests.</td></tr>}
              {!busy && mobileOnly.map((item) => (
                <tr key={item.id} className="data-row">
                  <td>{getTradeInCustomerName(item)}</td><td>{getTradeInPhone(item)}</td><td>{item.brand || "—"}</td><td>{getTradeInModel(item)}</td><td>{getTradeInImei(item)}</td><td>{getTradeInStorage(item)}</td><td>{fmt(getTradeInValue(item))}</td><td>{item.status || "Pending"}</td><td>{formatDateTime(item.createdAt)}</td>
                  <td>
                    <button className="ap-action-btn" onClick={() => setViewItem(item)}>Read</button>
                    <button className="ap-action-btn" onClick={() => setEditItem(item)}>Update</button>
                    <button className="ap-action-btn del" onClick={() => handleDeleteTrade(item.id)}>Delete</button>
                  </td>
                </tr>
              ))}
              {!busy && mobileOnly.length === 0 && <tr><td colSpan={10} style={{ textAlign: "center", padding: 24, color: "var(--muted)" }}>No mobile trade-in requests found</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
      <div className="ap-panel" style={{ marginTop: 16 }}>
        <div className="ap-panel-title">Condition Summary <span className="ap-panel-sub">Submitted exactly from the trade-in form</span></div>
        <div className="ap-table-wrap">
          <table className="ap-table">
            <thead><tr><th>Customer</th><th>Model</th><th>Condition Details</th><th>Notes</th></tr></thead>
            <tbody>
              {mobileOnly.map((item) => (<tr key={`${item.id}-condition`} className="data-row"><td>{getTradeInCustomerName(item)}</td><td>{getTradeInModel(item)}</td><td>{getTradeInConditionSummary(item)}</td><td>{item.notes || "—"}</td></tr>))}
              {mobileOnly.length === 0 && <tr><td colSpan={4} style={{ textAlign: "center", padding: 24, color: "var(--muted)" }}>No condition details found</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
      {viewItem && <TradeInReadModal item={viewItem} onClose={() => setViewItem(null)} />}
      {editItem && <TradeInUpdateModal item={editItem} onClose={() => setEditItem(null)} onSave={handleUpdateTrade} />}
    </>
  );
}

function TradeInReadModal({ item, onClose }) {
  return (
    <div className="ap-modal-overlay" onClick={onClose}>
      <div className="ap-modal" style={{ maxWidth: 520 }} onClick={(e) => e.stopPropagation()}>
        <div className="ap-modal-header"><div className="ap-modal-title">Mobile Trade-In Details</div><button className="ap-modal-close" onClick={onClose}>×</button></div>
        <div className="ap-detail-tiles" style={{ gridTemplateColumns: "repeat(2,1fr)" }}>
          {[["Customer", getTradeInCustomerName(item)], ["Phone", getTradeInPhone(item)], ["Brand", item.brand || "—"], ["Model", getTradeInModel(item)], ["IMEI", getTradeInImei(item)], ["Storage", getTradeInStorage(item)], ["Estimate", fmt(getTradeInValue(item))], ["Status", item.status || "Pending"]].map(([k, v]) => (
            <div key={k} className="ap-detail-tile"><div className="ap-detail-tile-label">{k}</div><div className="ap-detail-tile-val">{v}</div></div>
          ))}
        </div>
        <div className="ap-form-preview">
          <div className="ap-form-preview-row"><span className="ap-form-preview-key">Condition</span><span className="ap-form-preview-val">{getTradeInConditionSummary(item)}</span></div>
          <div className="ap-form-preview-row"><span className="ap-form-preview-key">Notes</span><span className="ap-form-preview-val">{item.notes || "—"}</span></div>
        </div>
      </div>
    </div>
  );
}

function TradeInUpdateModal({ item, onClose, onSave }) {
  const [form, setForm] = useState({ customerName: getTradeInCustomerName(item), phone: getTradeInPhone(item), brand: item.brand || "", model: getTradeInModel(item), imei: getTradeInImei(item), storage: getTradeInStorage(item), estimatedValue: getTradeInValue(item), status: item.status || "Pending", notes: item.notes || "" });
  const updateField = (key) => (e) => setForm((prev) => ({ ...prev, [key]: e.target.value }));
  return (
    <div className="ap-modal-overlay" onClick={onClose}>
      <div className="ap-modal" style={{ maxWidth: 520 }} onClick={(e) => e.stopPropagation()}>
        <div className="ap-modal-header"><div className="ap-modal-title">Update Mobile Trade-In</div><button className="ap-modal-close" onClick={onClose}>×</button></div>
        {[["customerName","Customer Name"],["phone","Phone"],["brand","Brand"],["model","Model"],["imei","IMEI"],["storage","Storage"]].map(([k,l])=>(
          <div key={k} className="ap-form-group"><label className="ap-form-label">{l}</label><input className="ap-form-input" value={form[k]} onChange={updateField(k)} /></div>
        ))}
        <div className="ap-form-group"><label className="ap-form-label">Estimated Value</label><input className="ap-form-input" type="number" value={form.estimatedValue} onChange={updateField("estimatedValue")} /></div>
        <div className="ap-form-group">
          <label className="ap-form-label">Status</label>
          <select className="ap-form-input" value={form.status} onChange={updateField("status")}>
            <option value="Pending">Pending</option><option value="Approved">Approved</option><option value="Rejected">Rejected</option><option value="Completed">Completed</option>
          </select>
        </div>
        <div className="ap-form-group"><label className="ap-form-label">Notes</label><textarea className="ap-form-input" rows="3" value={form.notes} onChange={updateField("notes")} /></div>
        <button className="ap-submit-btn" onClick={() => onSave(item.id, form)}>Save Changes</button>
      </div>
    </div>
  );
}

function formatRequestDate(value) {
  const parsed = value?.toDate ? value.toDate() : value ? new Date(value) : null;
  if (!parsed || Number.isNaN(parsed.getTime())) return "Not available";
  return parsed.toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function EmployeeAccessPanel({ requests, search, onUpdateStatus, savingId }) {
  const term = (search || "").trim().toLowerCase();
  const filtered = requests.filter((item) => !term || [item.fullName, item.firstName, item.lastName, item.email, item.phone, item.accessStatus].filter(Boolean).some((v) => String(v).toLowerCase().includes(term)));
  const pendingCount = requests.filter((i) => i.accessStatus === "pending").length;
  const approvedCount = requests.filter((i) => i.accessStatus === "approved").length;
  const rejectedCount = requests.filter((i) => i.accessStatus === "rejected").length;
  return (
    <>
      <div className="ap-grid-4">
        <div className="ap-stat-card amber"><div className="ap-stat-icon amber">P</div><div className="ap-stat-label">Pending Requests</div><div className="ap-stat-value" style={{ color: "var(--amber)" }}>{pendingCount}</div><div className="ap-stat-sub">Awaiting admin approval</div></div>
        <div className="ap-stat-card green"><div className="ap-stat-icon green">A</div><div className="ap-stat-label">Approved Staff</div><div className="ap-stat-value" style={{ color: "var(--green)" }}>{approvedCount}</div><div className="ap-stat-sub">Employees cleared for portal access</div></div>
        <div className="ap-stat-card red"><div className="ap-stat-icon red">R</div><div className="ap-stat-label">Rejected Requests</div><div className="ap-stat-value" style={{ color: "var(--red)" }}>{rejectedCount}</div><div className="ap-stat-sub">Blocked from staff portal</div></div>
        <div className="ap-stat-card blue"><div className="ap-stat-icon blue">T</div><div className="ap-stat-label">Total Requests</div><div className="ap-stat-value">{requests.length}</div><div className="ap-stat-sub">Employee signup records in users collection</div></div>
      </div>
      <div className="ap-panel" style={{ marginBottom: 16 }}>
        <div className="ap-panel-title">Employee Access Requests <span className="ap-panel-sub">Approve staff only after verifying their real identity</span></div>
        {filtered.length === 0 ? (
          <div className="ap-request-empty">No employee access requests match the current search.</div>
        ) : (
          <div className="ap-request-list">
            {filtered.map((item) => (
              <div key={item.uid} className="ap-request-card">
                <div className="ap-request-head">
                  <div>
                    <div className="ap-request-name">{item.fullName || `${item.firstName || ""} ${item.lastName || ""}`.trim() || "Unnamed Employee"}</div>
                    <div className="ap-request-email">{item.email || "No email"} {item.phone ? `• ${item.phone}` : ""}</div>
                  </div>
                  <span className={`ap-request-badge ${item.accessStatus || "pending"}`}>{item.accessStatus || "pending"}</span>
                </div>
                <div className="ap-request-meta">
                  <div className="ap-request-meta-card"><span>Requested</span><strong>{formatRequestDate(item.requestedAt || item.createdAt)}</strong></div>
                  <div className="ap-request-meta-card"><span>Role</span><strong>{item.role || "employee"}</strong></div>
                  <div className="ap-request-meta-card"><span>Approved By</span><strong>{item.approvedByName || item.approvedBy || "-"}</strong></div>
                  <div className="ap-request-meta-card"><span>Approved At</span><strong>{formatRequestDate(item.approvedAt)}</strong></div>
                </div>
                <div className="ap-request-actions">
                  <button className="ap-request-btn approve" onClick={() => onUpdateStatus(item.uid, "approved")} disabled={savingId === item.uid}>Approve Access</button>
                  <button className="ap-request-btn reject" onClick={() => onUpdateStatus(item.uid, "rejected")} disabled={savingId === item.uid}>Reject Request</button>
                  <button className="ap-request-btn pending" onClick={() => onUpdateStatus(item.uid, "pending")} disabled={savingId === item.uid}>Mark Pending</button>
                </div>
                {item.employeeSecurityCode && (
                  <div className="ap-request-code"><span>Employee Security Code</span><strong>{item.employeeSecurityCode}</strong></div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

function PasswordResetsPanel({ resets, search, onAdminSend, onResolve }) {
  const [sendingId, setSendingId] = useState('');
  const [resolvingId, setResolvingId] = useState('');
  const term = (search || '').trim().toLowerCase();
  const filtered = resets.filter((r) => !term || [r.email, r.status, r.note, r.initiatedBy].filter(Boolean).some((v) => String(v).toLowerCase().includes(term)));
  const pendingCount = resets.filter((r) => r.status === 'requested').length;
  const adminSentCount = resets.filter((r) => r.status === 'admin_sent').length;
  const resolvedCount = resets.filter((r) => r.status === 'resolved').length;

  const badgeStyle = (status) => {
    if (status === 'requested') return { background: 'rgba(245,158,11,0.15)', color: 'var(--amber)', border: '1px solid rgba(245,158,11,0.3)' };
    if (status === 'admin_sent') return { background: 'rgba(59,130,246,0.15)', color: 'var(--accent)', border: '1px solid rgba(59,130,246,0.3)' };
    if (status === 'resolved') return { background: 'rgba(34,197,94,0.12)', color: 'var(--green)', border: '1px solid rgba(34,197,94,0.3)' };
    if (status === 'blocked_google_account') return { background: 'rgba(239,68,68,0.12)', color: 'var(--red)', border: '1px solid rgba(239,68,68,0.3)' };
    return { background: 'rgba(255,255,255,0.05)', color: 'var(--muted)' };
  };
  const badgeLabel = (status) => ({
    requested: 'Requested',
    admin_sent: 'Email Sent',
    resolved: 'Resolved',
    blocked_google_account: '🔒 Google — Blocked',
  }[status] || status || 'Unknown');
  const fmtDate = (value) => { if (!value) return '—'; const d = value?.toDate ? value.toDate() : new Date(value); if (Number.isNaN(d.getTime())) return '—'; return d.toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }); };

  const handleSend = async (r) => { setSendingId(r.id); try { await onAdminSend(r.email, r.id); } finally { setSendingId(''); } };
  const handleResolve = async (r) => { setResolvingId(r.id); try { await onResolve(r.id); } finally { setResolvingId(''); } };

  return (
    <>
      <div className="ap-grid-4">
        <div className="ap-stat-card amber"><div className="ap-stat-icon amber">⏳</div><div className="ap-stat-label">Pending</div><div className="ap-stat-value" style={{ color: 'var(--amber)' }}>{pendingCount}</div><div className="ap-stat-sub">Awaiting admin action</div></div>
        <div className="ap-stat-card blue"><div className="ap-stat-icon blue">✉</div><div className="ap-stat-label">Admin Sent</div><div className="ap-stat-value">{adminSentCount}</div><div className="ap-stat-sub">Admin triggered reset email</div></div>
        <div className="ap-stat-card green"><div className="ap-stat-icon green">✓</div><div className="ap-stat-label">Resolved</div><div className="ap-stat-value" style={{ color: 'var(--green)' }}>{resolvedCount}</div><div className="ap-stat-sub">Marked as done</div></div>
        <div className="ap-stat-card purple"><div className="ap-stat-icon purple">#</div><div className="ap-stat-label">Total</div><div className="ap-stat-value" style={{ color: 'var(--purple)' }}>{resets.length}</div><div className="ap-stat-sub">All-time reset requests</div></div>
      </div>
      <div className="ap-panel" style={{ marginBottom: 16, display: 'flex', alignItems: 'flex-start', gap: 14, padding: '16px 20px' }}>
        <div style={{ width: 34, height: 34, borderRadius: 8, background: 'rgba(59,130,246,0.14)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        </div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 3 }}>How password resets work</div>
          <div style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.6 }}>
            When a customer or employee clicks <strong style={{ color: 'var(--text)' }}>"Forgot Password?"</strong> on the login page, Firebase emails them a secure reset link and the request is logged here automatically. You can also trigger a fresh reset email using <strong style={{ color: 'var(--text)' }}>"Send Reset Email"</strong> below. Passwords are never visible to admins — Firebase handles the change securely on the user's side.
          </div>
        </div>
      </div>
      <div className="ap-panel">
        <div className="ap-panel-title">Password Reset Log <span className="ap-panel-sub">{filtered.length} {filtered.length === 1 ? 'request' : 'requests'} · newest first</span></div>
        <div className="ap-table-wrap">
          <table className="ap-table">
            <thead><tr><th>Email Address</th><th>Status</th><th>Initiated By</th><th>Requested At</th><th>Admin Sent At</th><th>Note</th><th>Actions</th></tr></thead>
            <tbody>
              {filtered.length === 0 && <tr><td colSpan={7} style={{ textAlign: 'center', padding: 36, color: 'var(--muted)' }}>{resets.length === 0 ? 'No password reset requests yet. They will appear here automatically when users click "Forgot Password?".' : 'No requests match your search.'}</td></tr>}
              {filtered.map((r) => (
                <tr key={r.id} className="data-row">
                  <td style={{ fontFamily: 'var(--syne)', fontWeight: 600 }}>{r.email || '—'}</td>
                  <td><span style={{ fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 20, display: 'inline-block', ...badgeStyle(r.status) }}>{badgeLabel(r.status)}</span></td>
                  <td style={{ color: 'var(--muted)', fontSize: 12 }}>{r.initiatedBy === 'user' ? 'Customer / Employee' : r.initiatedBy === 'admin' ? 'Admin' : r.initiatedBy || '—'}</td>
                  <td style={{ fontSize: 12, color: 'var(--text-dim)' }}>{fmtDate(r.requestedAt)}</td>
                  <td style={{ fontSize: 12, color: 'var(--text-dim)' }}>{fmtDate(r.adminSentAt)}</td>
                  <td style={{ fontSize: 12, color: 'var(--muted)', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.note || '—'}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      {r.status !== 'resolved' && <button className="ap-action-btn" disabled={sendingId === r.id} onClick={() => handleSend(r)} title="Send a password reset email to this address">{sendingId === r.id ? 'Sending…' : '✉ Send Reset Email'}</button>}
                      {r.status !== 'resolved' && <button className="ap-action-btn" disabled={resolvingId === r.id} onClick={() => handleResolve(r)} title="Mark this request as resolved" style={{ color: 'var(--green)', borderColor: 'rgba(34,197,94,0.3)' }}>{resolvingId === r.id ? 'Saving…' : '✓ Resolved'}</button>}
                      {r.status === 'resolved' && <span style={{ fontSize: 12, color: 'var(--green)', padding: '5px 8px' }}>✓ Done</span>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

export default function AdminPanel() {
  const navigate = useNavigate();
  const [tab, setTab] = useState('dashboard');
  const [theme, setTheme] = useState(() => localStorage.getItem('iconx_admin_theme') || 'dark');
  const [records, setRecords] = useState([]);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(null);
  const [thresholds, setThresholds] = useState({ optimal: 75, stable: 45 });
  const [loading, setLoading] = useState(true);
  const [employeeMetrics, setEmployeeMetrics] = useState([]);
  const [employeeRequests, setEmployeeRequests] = useState([]);
  const [requestSavingId, setRequestSavingId] = useState("");
  const [adminPortalCode, setAdminPortalCode] = useState(DEFAULT_ADMIN_PORTAL_CODE);
  const [portalCodeSaving, setPortalCodeSaving] = useState(false);
  const [passwordResets, setPasswordResets] = useState([]);
  const injected = useRef(false);

  const liveRecords = records.map(r => ({ ...r, status: getStatus(r.efficiency, thresholds) }));
  const adminDisplayName = auth.currentUser?.displayName || auth.currentUser?.email || "Admin";
  const adminInitials = adminDisplayName.split(" ").filter(Boolean).slice(0, 2).map((p) => p.charAt(0).toUpperCase()).join("") || "A";

  useEffect(() => {
    if (injected.current) return; injected.current = true;
    const s = document.createElement('style'); s.textContent = STYLES; document.head.appendChild(s);
    return () => { try { document.head.removeChild(s); } catch {} };
  }, []);

  useEffect(() => { localStorage.setItem('iconx_admin_theme', theme); }, [theme]);

  useEffect(() => {
    setLoading(true);
    fbGetAll().then(data => setRecords(data.length ? data : MOCK)).catch(err => { console.error('Firebase load error:', err); setRecords(MOCK); }).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "employeeAttendance"), (snapshot) => { setEmployeeMetrics(snapshot.docs.map((item) => ({ id: item.id, ...item.data(), salesCount: Number(item.data().salesCount) || 0 })).sort((a, b) => `${b.date || ""}${b.checkIn || ""}`.localeCompare(`${a.date || ""}${a.checkIn || ""}`))); }, (error) => { console.error("Employee attendance metrics load error:", error); setEmployeeMetrics([]); });
    return unsub;
  }, []);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "users"), (snapshot) => { setEmployeeRequests(snapshot.docs.map((item) => ({ uid: item.id, ...item.data() })).filter((item) => String(item.role || "").toLowerCase() === "employee").sort((a, b) => (b.requestedAt?.seconds || b.createdAt?.seconds || 0) - (a.requestedAt?.seconds || a.createdAt?.seconds || 0))); }, (error) => { console.error("Employee request load error:", error); setEmployeeRequests([]); });
    return unsub;
  }, []);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, PORTAL_SETTINGS_COLLECTION, PORTAL_SETTINGS_DOC), (snapshot) => { const data = snapshot.exists() ? snapshot.data() : {}; setAdminPortalCode(String(data.adminCode || DEFAULT_ADMIN_PORTAL_CODE)); }, (error) => { console.error("Portal code load error:", error); setAdminPortalCode(DEFAULT_ADMIN_PORTAL_CODE); });
    return unsub;
  }, []);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'passwordResets'), (snapshot) => {
      const rows = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      rows.sort((a, b) => (b.requestedAt?.toMillis?.() || 0) - (a.requestedAt?.toMillis?.() || 0));
      setPasswordResets(rows);
    }, (err) => { console.error('passwordResets load error:', err); setPasswordResets([]); });
    return unsub;
  }, []);

  const openGroup = useCallback((g) => setModal({ type: 'group', group: g }), []);

  const adminSendPasswordReset = async (email, resetId) => {
    try {
      // Security check: do NOT send password reset to Google-only accounts.
      // Doing so would let anyone who knows the email hijack the account.
      let methods = [];
      try { methods = await fetchSignInMethodsForEmail(auth, email); } catch (_) {}
      if (methods.length > 0 && !methods.includes('password') && methods.includes('google.com')) {
        alert(
          `⚠️ Security Block\n\nThis email (${email}) belongs to a Google Sign-In account.\n\nPassword reset emails cannot be sent to Google accounts — the account has no password to reset. The customer must always sign in using the "Continue with Google" button.`
        );
        // Log the blocked attempt
        try {
          await updateDoc(doc(db, 'passwordResets', resetId), {
            status: 'blocked_google_account',
            blockedAt: serverTimestamp(),
            blockedBy: auth.currentUser?.email || 'Admin',
            note: 'Admin reset blocked — Google-only account has no password.',
          });
        } catch (_) {}
        return;
      }
      await sendPasswordResetEmail(auth, email);
      await updateDoc(doc(db, 'passwordResets', resetId), { status: 'admin_sent', adminSentAt: serverTimestamp(), adminSentBy: auth.currentUser?.email || 'Admin' });
    } catch (err) { console.error('Admin reset send failed:', err); alert('Failed to send reset email. Check the address is valid in Firebase Auth.'); }
  };

  const markResetResolved = async (resetId) => {
    try { await updateDoc(doc(db, 'passwordResets', resetId), { status: 'resolved', resolvedAt: serverTimestamp(), resolvedBy: auth.currentUser?.email || 'Admin' }); }
    catch (err) { console.error('markResetResolved failed:', err); }
  };

  const handleLogout = async () => {
    try { await signOut(auth); navigate('/login'); }
    catch (err) { console.error('Logout error:', err); }
  };

  const updateEmployeeAccess = async (uid, accessStatus) => {
    setRequestSavingId(uid);
    try {
      const target = employeeRequests.find((item) => item.uid === uid);
      const nextEmployeeSecurityCode = accessStatus === "approved" ? String(target?.employeeSecurityCode || generateEmployeePortalCode(target?.fullName || target?.email || uid)) : "";
      await updateDoc(doc(db, "users", uid), { accessStatus, status: accessStatus, approvedAt: accessStatus === "approved" ? serverTimestamp() : null, approvedBy: auth.currentUser?.uid || "", approvedByName: auth.currentUser?.displayName || auth.currentUser?.email || "Admin", employeeSecurityCode: nextEmployeeSecurityCode, updatedAt: serverTimestamp() });
    } catch (error) { console.error("Failed to update employee access:", error); }
    finally { setRequestSavingId(""); }
  };

  const saveAdminPortalCode = async (nextCode) => {
    setPortalCodeSaving(true);
    try { await setDoc(doc(db, PORTAL_SETTINGS_COLLECTION, PORTAL_SETTINGS_DOC), { adminCode: String(nextCode || DEFAULT_ADMIN_PORTAL_CODE), updatedAt: serverTimestamp(), updatedBy: auth.currentUser?.uid || "", updatedByName: auth.currentUser?.displayName || auth.currentUser?.email || "Admin" }, { merge: true }); }
    catch (error) { console.error("Failed to save admin portal code:", error); }
    finally { setPortalCodeSaving(false); }
  };

  const NAV = [
    { k: 'dashboard', l: 'Dashboard' }, { k: 'product', l: 'Product Details' },
    { k: 'customer', l: 'Customer Details' }, { k: 'passwordResets', l: 'Password Resets' },
    { k: 'reviews', l: 'Customer Reviews' }, { k: 'orders', l: 'Cart & Orders' },
    { k: 'tradeIn', l: 'Mobile Trade-In' }, { k: 'attendance', l: 'Salary' },
    { k: 'employeePerformance', l: 'Employee Insights' }, { k: 'employeeAccess', l: 'Employee Access' },
    { k: 'settings', l: 'Settings' },
  ];

  return (
    <div className="ap-root" data-theme={theme}>
      <div className="ap-sidebar">
        <div className="ap-brand">
          <img src={logo} alt="IconX Mobile Store" className="ap-brand-logo-img" />
          <div className="ap-brand-sub">Admin System</div>
        </div>
        <div className="ap-profile">
          <div className="ap-avatar">{adminInitials}</div>
          <div className="ap-profile-info">
            <div className="ap-profile-name">{adminDisplayName}</div>
            <div className="ap-profile-role">Super Administrator</div>
          </div>
          <div className="ap-online-dot" />
        </div>
        <div className="ap-nav">
          <div className="ap-nav-label">Navigation</div>
          {NAV.map(n => (
            <button key={n.k} className={`ap-nav-btn ${tab === n.k ? 'active' : ''}`} onClick={() => setTab(n.k)}>
              {I[n.k] || I.dashboard}
              {n.l}
            </button>
          ))}
        </div>
        <div className="ap-sidebar-bottom">
          <button className="ap-export-btn excel" onClick={() => navigate('/employee-admin')}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            Employee Attendance
          </button>
          <button className="ap-logout-btn" onClick={handleLogout}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            Logout
          </button>
        </div>
      </div>

      <div className="ap-main">
        <div className="ap-topbar">
          <div className="ap-topbar-title">{NAV.find(n => n.k === tab)?.l}</div>
          <div className="ap-topbar-right">
            <button className="ap-theme-btn" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
              {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
            </button>
            <input className="ap-search" placeholder={tab === 'employeePerformance' ? 'Search attendance or sales...' : tab === 'employeeAccess' ? 'Search employee requests...' : 'Search...'} value={search} onChange={e => setSearch(e.target.value)} />
            <div style={{ fontSize: 12, color: 'var(--muted)', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 8, padding: '7px 12px' }}>
              {loading ? 'Loading...' : (tab === 'employeePerformance' ? employeeMetrics.length : tab === 'employeeAccess' ? employeeRequests.length : tab === 'passwordResets' ? passwordResets.length : records.length) + ' records'}
            </div>
          </div>
        </div>
        <div className="ap-content">
          {loading ? (
            <div className="ap-placeholder">
              <div style={{ fontSize: 28, animation: 'spin 1s linear infinite' }}>⟳</div>
              <div className="ap-placeholder-text">Loading from Firebase...</div>
            </div>
          ) : (
            <>
              {tab === 'dashboard' && <Dashboard records={liveRecords} onGroup={openGroup} />}
              {tab === 'attendance' && (
                <AttendancePanel
                  records={liveRecords} setRecords={setRecords} employees={employeeRequests}
                  onGroup={openGroup} fbAdd={fbAdd} fbUpdate={fbUpdate} fbDelete={fbDelete}
                  statusColor={statusColor} statusLabel={statusLabel} statusIcon={statusIcon}
                  fmt={fmt} calcEff={calcEff} getStatus={getStatus} Gauge={Gauge} Tip={Tip}
                  onExportPdf={() => exportPDF(liveRecords)} onExportCsv={() => exportExcel(liveRecords)}
                />
              )}
              {tab === 'employeePerformance' && <EmployeeAnalyticsPanel records={employeeMetrics} search={search} />}
              {tab === 'employeeAccess' && <EmployeeAccessPanel requests={employeeRequests} search={search} onUpdateStatus={updateEmployeeAccess} savingId={requestSavingId} />}
              {tab === 'settings' && <Settings records={liveRecords} thresholds={thresholds} setThresholds={setThresholds} adminPortalCode={adminPortalCode} setAdminPortalCode={setAdminPortalCode} onSaveAdminPortalCode={saveAdminPortalCode} portalCodeSaving={portalCodeSaving} />}
              {tab === 'product' && <ProductAdmin />}
              {tab === 'customer' && <UsersCustomerPanel search={search} />}
              {tab === 'passwordResets' && <PasswordResetsPanel resets={passwordResets} search={search} onAdminSend={adminSendPasswordReset} onResolve={markResetResolved} />}
              {tab === 'reviews' && <CrudPanel title="Customer Reviews" collectionName="customerReviews" fields={REVIEW_FIELDS} primaryKey="Review" description="Messages submitted from the Contact Us page." search={search} />}
              {tab === 'orders' && <CommercePanel search={search} />}
              {tab === 'tradeIn' && <TradeInPanel search={search} />}
              {!['dashboard','attendance','employeePerformance','employeeAccess','settings','product','customer','passwordResets','reviews','orders','tradeIn'].includes(tab) && (
                <div className="ap-placeholder">
                  <div className="ap-placeholder-icon">🚧</div>
                  <div className="ap-placeholder-text">{NAV.find(n => n.k === tab)?.l}</div>
                  <div style={{ fontSize: 13, color: 'var(--muted)' }}>This section is under development</div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {modal?.type === 'group' && <GroupModal type={modal.group} records={liveRecords} onClose={() => setModal(null)} />}
    </div>
  );
}