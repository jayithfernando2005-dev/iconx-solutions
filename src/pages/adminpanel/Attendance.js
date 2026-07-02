/**
 * Attendance.js
 
 */

import { useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  Cell,
} from "recharts";
import "./Attendance.css";

function getDaysInMonth(monthValue) {
  if (!monthValue || !/^\d{4}-\d{2}$/.test(monthValue)) return 0;
  const [year, month] = monthValue.split("-").map(Number);
  return new Date(year, month, 0).getDate();
}

function getEmployeeStaffId(employee, index) {
  if (!employee) return "";
  const existing = String(employee.staffId || employee.salaryStaffId || "")
    .trim()
    .toUpperCase();
  if (/^STF-\d{4}$/.test(existing)) return existing;
  return `STF-${String(index + 1).padStart(4, "0")}`;
}

/* ── Group Modal (view-only, no edit) ── */
function GroupModal({ type, records, onClose, statusColor, fmt, Gauge, Tip }) {
  const list = records
    .filter((r) => r.status === type)
    .sort((a, b) => b.efficiency - a.efficiency);
  const color = statusColor(type);
  const avg = list.length
    ? Math.round(list.reduce((s, r) => s + r.efficiency, 0) / list.length)
    : 0;
  const barData = list.map((r) => ({
    name: r.staffId.slice(-4),
    eff: r.efficiency,
  }));

  return (
    <div className="at-modal-overlay" onClick={onClose}>
      <div
        className="at-modal at-group-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="at-modal-header">
          <div>
            <div className="at-modal-title" style={{ color }}>
              {type.charAt(0).toUpperCase() + type.slice(1)} Staff Group
            </div>
            <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 4 }}>
              {list.length} members · Avg:{" "}
              <span style={{ color, fontWeight: 600 }}>{avg}%</span>
            </div>
          </div>
          <button className="at-modal-close" onClick={onClose}>
            ×
          </button>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "center",
            marginBottom: 16,
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <Gauge value={avg} color={color} size={110} />
            <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 4 }}>
              Group Average Efficiency
            </div>
          </div>
        </div>

        {list.length > 0 && (
          <div
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: 12,
              padding: 18,
              marginBottom: 16,
            }}
          >
            <div
              style={{
                fontFamily: "var(--syne)",
                fontSize: 14,
                fontWeight: 600,
                marginBottom: 16,
              }}
            >
              Efficiency per Member{" "}
              <span
                style={{ fontSize: 11, color: "var(--muted)", fontWeight: 400 }}
              >
                {type} group
              </span>
            </div>
            <ResponsiveContainer width="100%" height={120}>
              <BarChart
                data={barData}
                margin={{ top: 4, right: 4, left: -20, bottom: 0 }}
              >
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 10, fill: "#6e6e73" }}
                />
                <YAxis
                  domain={[0, 100]}
                  tick={{ fontSize: 10, fill: "#6e6e73" }}
                />
                <Tooltip content={<Tip />} />
                <Bar dataKey="eff" name="efficiency" radius={[3, 3, 0, 0]}>
                  {barData.map((_, i) => (
                    <Cell key={i} fill={color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        <div
          style={{
            fontFamily: "var(--syne)",
            fontSize: 13,
            fontWeight: 600,
            color: "var(--muted)",
            textTransform: "uppercase",
            letterSpacing: 1,
            marginBottom: 12,
          }}
        >
          Ranked Members
        </div>
        <div className="at-group-list">
          {list.length === 0 && (
            <div
              style={{
                textAlign: "center",
                padding: 24,
                color: "var(--muted)",
              }}
            >
              No {type} staff found
            </div>
          )}
          {list.map((r, i) => (
            <div key={r.id} className="at-group-item">
              <div
                className="at-group-rank"
                style={{ color, borderColor: color + "44" }}
              >
                #{i + 1}
              </div>
              <div className="at-group-info">
                <div className="at-group-id">{r.staffId}</div>
                <div className="at-group-meta">
                  {r.hours}h · Rs {r.rate}/hr · {fmt(r.salary)}
                </div>
              </div>
              <div className="at-group-eff">
                <div className="at-group-eff-val" style={{ color }}>
                  {r.efficiency}%
                </div>
                <div className="at-group-eff-bar">
                  <div
                    className="at-group-eff-fill"
                    style={{ width: r.efficiency + "%", background: color }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── Record View Modal (view-only) ── */
function RecordModal({ record, onClose, statusColor, fmt, Gauge }) {
  return (
    <div className="at-modal-overlay" onClick={onClose}>
      <div
        className="at-modal"
        style={{ maxWidth: 480 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="at-modal-header">
          <div className="at-modal-title">Staff Record: {record.staffId}</div>
          <button className="at-modal-close" onClick={onClose}>
            ×
          </button>
        </div>
        <div className="at-record-gaugerow">
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <Gauge
              value={record.efficiency}
              color={statusColor(record.status)}
              size={100}
            />
            <div
              style={{
                fontFamily: "var(--syne)",
                fontSize: 15,
                fontWeight: 700,
                textAlign: "center",
                color: statusColor(record.status),
              }}
            >
              {record.status.toUpperCase()}
            </div>
          </div>
          <div className="at-detail-grid" style={{ flex: 1 }}>
            {[
              ["Staff ID", record.staffId],
              ["Salary Month", record.salaryMonth || "-"],
              [
                "Days Present",
                `${record.daysPresent || 0}/${record.daysInMonth || 0}`,
              ],
              ["Base Salary", "Rs " + record.rate],
              ["Net Payout", fmt(record.salary)],
              ["Efficiency", record.efficiency + "%"],
              ["Status", record.status.toUpperCase()],
            ].map(([k, v], i) => (
              <div key={i} className="at-detail-tile">
                <div className="at-detail-tile-label">{k}</div>
                <div
                  className="at-detail-tile-val"
                  style={i === 5 ? { color: statusColor(record.status) } : {}}
                >
                  {v}
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="at-record-hint">
          To edit this record, use the ✏️ button in the Attendance table.
        </div>
      </div>
    </div>
  );
}

/* ── Edit / Add Modal ── */
function EditModal({
  record,
  employees,
  onClose,
  onSave,
  calcEff,
  getStatus,
  statusColor,
  fmt,
}) {
  const employeeOptions = employees
    .filter(
      (employee) => String(employee.role || "").toLowerCase() === "employee",
    )
    .sort((a, b) =>
      String(a.fullName || a.email || "").localeCompare(
        String(b.fullName || b.email || ""),
      ),
    )
    .map((employee, index) => ({
      ...employee,
      generatedStaffId: getEmployeeStaffId(employee, index),
    }));

  const [f, setF] = useState({
    employeeUid: record?.employeeUid || "",
    staffId: record?.staffId || "",
    rate: record?.rate || "",
    salaryMonth: record?.salaryMonth || "",
    daysPresent: record?.daysPresent || "",
    daysInMonth: record?.daysInMonth || "",
  });
  const [error, setError] = useState("");
  const [salaryPreview, setSalaryPreview] = useState(
    () => Number(record?.salary) || 0,
  );
  const validateField = (key, value) => {
    const trimmedValue = String(value || "").trim();

    if (key === "staffId") {
      if (!trimmedValue) return "Staff ID is required.";
      if (!/^STF-\d{4}$/i.test(trimmedValue))
        return "Incorrect ID input. Staff ID must be in the format STF-xxxx.";
      return "";
    }

    if (key === "rate") {
      if (!trimmedValue) return "Base salary is required.";
      if (Number.isNaN(Number(trimmedValue)))
        return "Base salary must be a valid number.";
      if (Number(trimmedValue) <= 0)
        return "Base salary must be greater than 0.";
      return "";
    }

    if (key === "salaryMonth") {
      if (!trimmedValue) return "Salary month is required.";
      return "";
    }

    if (key === "daysInMonth") {
      if (!trimmedValue) return "Total month days are required.";
      if (Number.isNaN(Number(trimmedValue)))
        return "Total month days must be a valid number.";
      if (Number(trimmedValue) <= 0 || Number(trimmedValue) > 31)
        return "Total month days must be between 1 and 31.";
      return "";
    }

    if (key === "daysPresent") {
      if (!trimmedValue) return "Days present is required.";
      if (Number.isNaN(Number(trimmedValue)))
        return "Days present must be a valid number.";
      if (Number(trimmedValue) < 0)
        return "Days present cannot be less than 0.";
      if (
        Number(f.daysInMonth) > 0 &&
        Number(trimmedValue) > Number(f.daysInMonth)
      )
        return "Days present cannot be more than total month days.";
      return "";
    }

    return "";
  };
  const r = parseFloat(f.rate) || 0;
  const presentDays = parseFloat(f.daysPresent) || 0;
  const totalDays = parseFloat(f.daysInMonth) || 0;
  const salary =
    salaryPreview > 0
      ? salaryPreview
      : r > 0 && totalDays > 0
        ? (r / totalDays) * presentDays
        : 0;
  const eff = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0;
  const status = getStatus(eff);
  const selectedEmployee =
    employeeOptions.find((employee) => employee.uid === f.employeeUid) || null;
  const up = (k) => (e) => {
    const nextValue = e.target.value;
    setF((p) => {
      const next = { ...p, [k]: nextValue };
      if (k === "salaryMonth") {
        next.daysInMonth = String(getDaysInMonth(nextValue) || "");
      }
      if (k === "employeeUid") {
        const employee = employeeOptions.find((item) => item.uid === nextValue);
        if (employee) {
          next.staffId = employee.generatedStaffId;
        }
      }
      return next;
    });
    setError(validateField(k, nextValue));
  };

  const calculateAttendanceSalary = () => {
    const monthlySalary = parseFloat(f.rate) || 0;
    const daysPresent = parseFloat(f.daysPresent) || 0;
    const daysInMonth = parseFloat(f.daysInMonth) || 0;

    if (!monthlySalary || String(f.daysPresent).trim() === "" || !daysInMonth) {
      setError(
        "Enter base salary, days present, and total month days before calculating.",
      );
      return;
    }
    if (daysInMonth > 31) {
      setError("Total month days cannot be more than 31.");
      return;
    }
    if (daysPresent > daysInMonth) {
      setError("Days present cannot be more than total month days.");
      return;
    }

    setError("");
    setSalaryPreview((monthlySalary / daysInMonth) * daysPresent);
  };

  const save = () => {
    const staffIdError = validateField("staffId", f.staffId);
    if (staffIdError) return setError(staffIdError);
    const rateError = validateField("rate", f.rate);
    if (rateError) return setError(rateError);
    const salaryMonthError = validateField("salaryMonth", f.salaryMonth);
    if (salaryMonthError) return setError(salaryMonthError);
    const daysInMonthError = validateField("daysInMonth", f.daysInMonth);
    if (daysInMonthError) return setError(daysInMonthError);
    const daysPresentError = validateField("daysPresent", f.daysPresent);
    if (daysPresentError) return setError(daysPresentError);
    onSave({
      ...(record || {}),
      id: record?.id || Date.now().toString(),
      employeeUid: f.employeeUid || "",
      employeeName: selectedEmployee?.fullName || selectedEmployee?.email || "",
      staffId: f.staffId.trim().toUpperCase(),
      hours: presentDays,
      rate: r,
      salary,
      daysPresent: presentDays,
      daysInMonth: totalDays,
      salaryMonth: f.salaryMonth || "",
      salaryMode: "attendance",
      efficiency: eff,
      status,
    });
  };

  return (
    <div className="at-modal-overlay" onClick={onClose}>
      <div
        className="at-modal"
        style={{ maxWidth: 420 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="at-modal-header">
          <div className="at-modal-title">
            {record ? "Edit Record" : "Add Staff"}
          </div>
          <button className="at-modal-close" onClick={onClose}>
            ×
          </button>
        </div>
        {error && (
          <div style={{ color: "#ff453a", fontSize: 13, marginBottom: 12 }}>
            {error}
          </div>
        )}
        <div className="at-form-group">
          <label className="at-form-label">Employee STF</label>
          <select
            className="at-form-input"
            value={f.employeeUid}
            onChange={up("employeeUid")}
          >
            <option value="">Select employee account</option>
            {employeeOptions.map((employee) => (
              <option key={employee.uid} value={employee.uid}>
                {employee.generatedStaffId} -{" "}
                {employee.fullName || employee.email}
              </option>
            ))}
          </select>
        </div>
        {[
          ["staffId", "Staff ID", "STF-0001", "text"],
          ["rate", "Base Salary (Rs)", "45000", "number"],
        ].map(([k, label, ph, type]) => (
          <div key={k} className="at-form-group">
            <label className="at-form-label">{label}</label>
            <input
              className="at-form-input"
              type={type}
              value={f[k]}
              onChange={up(k)}
              placeholder={ph}
              min={type === "number" ? "0" : undefined}
              step={k === "hours" || k === "rate" ? "0.01" : undefined}
            />
          </div>
        ))}
        <div className="at-calc-box">
          <div className="at-calc-title">Attendance Salary Calculator</div>
          <div className="at-calc-grid">
            <div className="at-form-group">
              <label className="at-form-label">Salary Month</label>
              <input
                className="at-form-input"
                type="month"
                value={f.salaryMonth}
                onChange={up("salaryMonth")}
              />
            </div>
            <div className="at-form-group">
              <label className="at-form-label">Total Days In Month</label>
              <input
                className="at-form-input"
                type="number"
                min="1"
                value={f.daysInMonth}
                onChange={up("daysInMonth")}
                placeholder="30"
              />
            </div>
            <div className="at-form-group">
              <label className="at-form-label">Days Present</label>
              <input
                className="at-form-input"
                type="number"
                min="0"
                value={f.daysPresent}
                onChange={up("daysPresent")}
                placeholder="26"
              />
            </div>
          </div>
          <button
            type="button"
            className="at-calc-btn"
            onClick={calculateAttendanceSalary}
          >
            Calculate Salary
          </button>
        </div>
        {r > 0 && totalDays > 0 && (
          <div className="at-preview">
            {[
              ["Estimated Payout", fmt(salary)],
              ["Efficiency", eff + "%"],
              ["Status", status.toUpperCase()],
              ...(Number(f.daysPresent) > 0 && Number(f.daysInMonth) > 0
                ? [
                    [
                      "Attendance Basis",
                      `${f.daysPresent}/${f.daysInMonth} days`,
                    ],
                  ]
                : []),
            ].map(([k, v], i) => (
              <div key={i} className="at-preview-row">
                <span className="at-preview-key">{k}</span>
                <span
                  className="at-preview-val"
                  style={i > 0 ? { color: statusColor(status) } : {}}
                >
                  {v}
                </span>
              </div>
            ))}
          </div>
        )}
        <button className="at-submit-btn" onClick={save}>
          {record ? "Save Changes" : "Add Record"}
        </button>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════
   MAIN ATTENDANCE COMPONENT
══════════════════════════════════════════════ */
export default function Attendance({
  records,
  setRecords,
  employees = [],
  onGroup,
  fbAdd,
  fbUpdate,
  fbDelete,
  /* helpers passed from AdminPanel */
  statusColor,
  statusLabel,
  statusIcon,
  fmt,
  calcEff,
  getStatus,
  Gauge,
  Tip,
  onExportPdf,
  onExportCsv,
  notify,
}) {
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState(null);
  const [editing, setEditing] = useState(null);
  const [adding, setAdding] = useState(false);
  const [viewRecord, setViewRecord] = useState(null);
  const [groupType, setGroupType] = useState(null);
  const [saving, setSaving] = useState(false);

  const opt = records.filter((r) => r.status === "optimal");
  const stb = records.filter((r) => r.status === "stable");
  const crt = records.filter((r) => r.status === "critical");
  const pct = (n) =>
    records.length ? Math.round((n / records.length) * 100) : 0;

  const shown = records.filter(
    (r) =>
      (filter === "all" || r.status === filter) &&
      (!search || r.staffId.toLowerCase().includes(search.toLowerCase())),
  );

  const effData = records.map((r) => ({
    name: r.staffId.slice(-3),
    eff: r.efficiency,
    fill: statusColor(r.status),
  }));
  const payData = records.map((r) => ({
    name: r.staffId.slice(-3),
    payout: r.salary,
  }));

  const save = async (rec) => {
    setSaving(true);
    try {
      const isNew = !records.find((r) => r.id === rec.id);
      if (isNew) {
        const saved = await fbAdd(rec);
        setRecords((prev) => [...prev, saved]);
        notify && notify(`Salary record added for ${rec.staffId}.`, 'success', 'Salary');
      } else {
        await fbUpdate(rec.id, rec);
        setRecords((prev) => prev.map((r) => (r.id === rec.id ? rec : r)));
        notify && notify(`Salary record updated for ${rec.staffId}.`, 'success', 'Salary');
      }
    } catch (err) {
      console.error("Save failed:", err);
      const isNew = !records.find((r) => r.id === rec.id);
      setRecords((prev) =>
        isNew ? [...prev, rec] : prev.map((r) => (r.id === rec.id ? rec : r)),
      );
      notify && notify(`Failed to save record for ${rec.staffId}: ${err.message}`, 'error', 'Salary');
    } finally {
      setSaving(false);
      setEditing(null);
      setAdding(false);
    }
  };

  const remove = async (id) => {
    setSaving(true);
    try {
      await fbDelete(id);
      setRecords((prev) => prev.filter((x) => x.id !== id));
      notify && notify(`Salary record deleted.`, 'warn', 'Salary');
    } catch (err) {
      console.error("Delete failed:", err);
      setRecords((prev) => prev.filter((x) => x.id !== id));
      notify && notify(`Failed to delete record: ${err.message}`, 'error', 'Salary');
    } finally {
      setSaving(false);
    }
  };

  const openGroup = (type) => setGroupType(type);

  return (
    <>
      {/* Syncing toast */}
      {saving && (
        <div className="at-sync-toast">
          <svg
            className="at-spin"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M21 12a9 9 0 1 1-6.219-8.56" />
          </svg>
          Syncing with Firebase...
        </div>
      )}

      {/* ── Stat cards ── */}
      <div className="at-stat-grid">
        {[
          {
            color: "green",
            icon: "✓",
            label: "Optimal Staff",
            list: opt,
            g: "optimal",
          },
          {
            color: "amber",
            icon: "⚠",
            label: "Stable Staff",
            list: stb,
            g: "stable",
          },
          {
            color: "red",
            icon: "✕",
            label: "Critical Staff",
            list: crt,
            g: "critical",
          },
        ].map((k, i) => (
          <div
            key={i}
            className={`ap-stat-card ${k.color}`}
            style={{ cursor: "pointer" }}
            onClick={() => openGroup(k.g)}
          >
            <div className={`ap-stat-icon ${k.color}`}>{k.icon}</div>
            <div className="ap-stat-label">{k.label}</div>
            <div className="ap-stat-value" style={{ color: statusColor(k.g) }}>
              {k.list.length}
            </div>
            <div className="ap-stat-sub">
              {pct(k.list.length)}% of workforce · click to view
            </div>
          </div>
        ))}
      </div>

      {/* ── Mini charts ── */}
      <div className="at-chart-grid">
        <div className="ap-panel">
          <div className="ap-panel-title">
            Efficiency by Staff{" "}
            <span className="ap-panel-sub">color coded</span>
          </div>
          <ResponsiveContainer width="100%" height={110}>
            <BarChart
              data={effData}
              margin={{ top: 0, right: 0, left: -24, bottom: 0 }}
            >
              <XAxis dataKey="name" tick={{ fontSize: 9, fill: "#6e6e73" }} />
              <YAxis
                domain={[0, 100]}
                tick={{ fontSize: 9, fill: "#6e6e73" }}
              />
              <Tooltip content={<Tip />} />
              <Bar dataKey="eff" name="efficiency" radius={[3, 3, 0, 0]}>
                {effData.map((d, i) => (
                  <Cell key={i} fill={d.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="ap-panel">
          <div className="ap-panel-title">
            Payout Distribution <span className="ap-panel-sub">all staff</span>
          </div>
          <ResponsiveContainer width="100%" height={110}>
            <AreaChart
              data={payData}
              margin={{ top: 4, right: 4, left: -24, bottom: 0 }}
            >
              <defs>
                <linearGradient id="at-pg" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor="var(--purple)"
                    stopOpacity={0.4}
                  />
                  <stop
                    offset="95%"
                    stopColor="var(--purple)"
                    stopOpacity={0}
                  />
                </linearGradient>
              </defs>
              <XAxis dataKey="name" tick={{ fontSize: 9, fill: "#6e6e73" }} />
              <YAxis tick={{ fontSize: 9, fill: "#6e6e73" }} />
              <Tooltip content={<Tip />} />
              <Area
                type="monotone"
                dataKey="payout"
                name="payout"
                stroke="var(--purple)"
                fill="url(#at-pg)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Filter bar ── */}
      <div className="at-filter-bar">
        {[
          { val: "all", label: "All", cls: "" },
          { val: "optimal", label: "Optimal", cls: "green" },
          { val: "stable", label: "Stable", cls: "amber" },
          { val: "critical", label: "Critical", cls: "red" },
        ].map((f) => (
          <button
            key={f.val}
            className={
              "ap-filter-btn " + f.cls + (filter === f.val ? " active" : "")
            }
            onClick={() => setFilter(f.val)}
          >
            {f.label} (
            {f.val === "all"
              ? records.length
              : records.filter((r) => r.status === f.val).length}
            )
          </button>
        ))}
        <div style={{ flex: 1 }} />
        <input
          style={{
            background: "var(--surface2)",
            border: "1px solid var(--border)",
            borderRadius: 8,
            padding: "7px 12px",
            color: "var(--text)",
            fontFamily: "var(--dm)",
            fontSize: 13,
            outline: "none",
            width: 180,
          }}
          placeholder="Search staff ID..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button
          className="ap-export-btn pdf"
          style={{ width: "auto", marginBottom: 0 }}
          onClick={onExportPdf}
        >
          Export PDF
        </button>
        <button
          className="ap-export-btn excel"
          style={{ width: "auto", marginBottom: 0 }}
          onClick={onExportCsv}
        >
          Export CSV
        </button>
        <button className="ap-add-btn" onClick={() => setAdding(true)}>
          + Add Staff
        </button>
      </div>

      {/* ── Table ── */}
      <div className="at-table-panel">
        <div className="ap-table-wrap">
          <table className="ap-table">
            <thead>
              <tr>
                <th>Staff ID</th>
                <th>Month</th>
                <th>Attendance</th>
                <th>Base Salary</th>
                <th>Net Salary</th>
                <th>Efficiency</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {shown.map((r) => (
                <>
                  <tr
                    key={r.id}
                    className="data-row"
                    onClick={() => setExpanded(expanded === r.id ? null : r.id)}
                  >
                    <td style={{ fontFamily: "var(--syne)", fontWeight: 600 }}>
                      {r.staffId}
                    </td>
                    <td>{r.salaryMonth || "-"}</td>
                    <td>{`${r.daysPresent || 0}/${r.daysInMonth || 0}`}</td>
                    <td>Rs {r.rate}</td>
                    <td style={{ fontFamily: "var(--syne)", fontWeight: 600 }}>
                      {fmt(r.salary)}
                    </td>
                    <td>
                      <div className="at-eff-wrap">
                        <div className="at-eff-bar">
                          <div
                            className="at-eff-fill"
                            style={{
                              width: r.efficiency + "%",
                              background: statusColor(r.status),
                            }}
                          />
                        </div>
                        <span
                          className="at-eff-text"
                          style={{ color: statusColor(r.status) }}
                        >
                          {r.efficiency}%
                        </span>
                      </div>
                    </td>
                    <td>
                      <span className={"ap-badge " + r.status}>
                        {statusIcon(r.status)} {statusLabel(r.status)}
                      </span>
                    </td>
                    <td onClick={(e) => e.stopPropagation()}>
                      <button
                        className="ap-action-btn"
                        title="View"
                        onClick={() => setViewRecord(r)}
                      >
                        <svg
                          width="12"
                          height="12"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      </button>
                      <button
                        className="ap-action-btn"
                        title="Edit"
                        onClick={() => setEditing(r)}
                      >
                        <svg
                          width="12"
                          height="12"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                        </svg>
                      </button>
                      <button
                        className="ap-action-btn del"
                        title="Delete"
                        onClick={() => remove(r.id)}
                      >
                        <svg
                          width="12"
                          height="12"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                        </svg>
                      </button>
                    </td>
                  </tr>

                  {expanded === r.id && (
                    <tr key={r.id + "-x"}>
                      <td colSpan={8} className="at-expanded-td">
                        <div className="at-expanded-inner">
                          <div
                            style={{
                              display: "flex",
                              flexDirection: "column",
                              alignItems: "center",
                            }}
                          >
                            <Gauge
                              value={r.efficiency}
                              color={statusColor(r.status)}
                              size={90}
                            />
                            <div
                              style={{
                                fontFamily: "var(--syne)",
                                fontSize: 15,
                                fontWeight: 700,
                                color: statusColor(r.status),
                              }}
                            >
                              {r.status.toUpperCase()}
                            </div>
                            <div
                              style={{ fontSize: 11, color: "var(--muted)" }}
                            >
                              Efficiency
                            </div>
                          </div>
                          <div className="at-detail-grid">
                            {[
                              ["Staff ID", r.staffId],
                              ["Month", r.salaryMonth || "-"],
                              [
                                "Attendance",
                                `${r.daysPresent || 0}/${r.daysInMonth || 0}`,
                              ],
                              ["Base Salary", "Rs " + r.rate],
                              ["Net Payout", fmt(r.salary)],
                              ["Efficiency", r.efficiency + "%"],
                              ["Status", r.status.toUpperCase()],
                            ].map(([k, v], i) => (
                              <div key={i} className="at-detail-tile">
                                <div className="at-detail-tile-label">{k}</div>
                                <div
                                  className="at-detail-tile-val"
                                  style={
                                    i === 5
                                      ? { color: statusColor(r.status) }
                                      : {}
                                  }
                                >
                                  {v}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
              {shown.length === 0 && (
                <tr>
                  <td
                    colSpan={8}
                    style={{
                      textAlign: "center",
                      padding: 24,
                      color: "var(--muted)",
                    }}
                  >
                    No records found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Modals ── */}
      {viewRecord && (
        <RecordModal
          record={viewRecord}
          onClose={() => setViewRecord(null)}
          statusColor={statusColor}
          fmt={fmt}
          Gauge={Gauge}
        />
      )}
      {(editing || adding) && (
        <EditModal
          record={editing}
          employees={employees}
          onClose={() => {
            setEditing(null);
            setAdding(false);
          }}
          onSave={save}
          calcEff={calcEff}
          getStatus={getStatus}
          statusColor={statusColor}
          fmt={fmt}
        />
      )}
      {groupType && (
        <GroupModal
          type={groupType}
          records={records}
          onClose={() => setGroupType(null)}
          statusColor={statusColor}
          fmt={fmt}
          Gauge={Gauge}
          Tip={Tip}
        />
      )}
    </>
  );
}
