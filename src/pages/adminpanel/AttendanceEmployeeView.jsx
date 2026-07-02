import { useEffect, useMemo, useState } from "react";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../../firebase";
import {
  SALES_CATEGORIES,
  formatDateLabel,
  formatStatus,
  getSalesTotal,
  normalizeSalesByCategory,
  summarizeSales,
  todayKey,
} from "./attendanceShared";

function validateAttendanceForm(form) {
  if (!form.date) return "Date is required.";

  const salesValues = Object.values(form.salesByCategory || {});
  if (salesValues.some((value) => Number.isNaN(Number(value)) || Number(value) < 0)) {
    return "Sales by category must be valid non-negative numbers.";
  }

  if ((form.checkIn && !form.checkOut) || (!form.checkIn && form.checkOut)) {
    return "Both check-in and check-out times are required together.";
  }

  if (form.checkIn && form.checkOut && form.checkOut <= form.checkIn) {
    return "Check-out time must be later than check-in time.";
  }

  return "";
}

function buildMonthDays(monthAnchor) {
  const year = monthAnchor.getFullYear();
  const month = monthAnchor.getMonth();
  const firstDay = new Date(year, month, 1);
  const startOffset = (firstDay.getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = [];

  for (let i = 0; i < startOffset; i += 1) cells.push(null);
  for (let day = 1; day <= daysInMonth; day += 1) {
    const date = new Date(year, month, day);
    cells.push({ label: day, value: date.toISOString().slice(0, 10) });
  }

  return cells;
}

function buildEmployeeForm(employeeUid, date, record) {
  return {
    id: record?.id,
    employeeUid,
    date,
    status: record?.status || "present",
    checkIn: record?.checkIn || "09:00",
    checkOut: record?.checkOut || "18:00",
    note: record?.note || "",
    salesByCategory: normalizeSalesByCategory(record?.salesByCategory),
  };
}

export default function AttendanceEmployeeView({ currentEmployee, attendanceRecords, onSave }) {
  const [monthAnchor, setMonthAnchor] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(todayKey());
  const [form, setForm] = useState(() => buildEmployeeForm(currentEmployee?.uid, todayKey(), null));
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  
  const [securityCode, setSecurityCode] = useState(currentEmployee?.employeeSecurityCode || "");
  const [codeSaving, setCodeSaving] = useState(false);
  const [codeMessage, setCodeMessage] = useState("");

  const handleSaveSecurityCode = async (e) => {
    e.preventDefault();
    if (!securityCode.trim()) {
      setCodeMessage("Security code cannot be empty.");
      return;
    }
    setCodeSaving(true);
    setCodeMessage("");
    try {
      await updateDoc(doc(db, "users", currentEmployee.uid), {
        employeeSecurityCode: securityCode.trim(),
        updatedAt: serverTimestamp()
      });
      setCodeMessage("Security code updated successfully.");
    } catch (err) {
      console.error("Failed to update security code:", err);
      setCodeMessage("Failed to update security code. Please try again.");
    } finally {
      setCodeSaving(false);
    }
  };

  const employeeRecords = useMemo(
    () => attendanceRecords
      .filter((record) => record.employeeUid === currentEmployee?.uid)
      .sort((a, b) => `${b.date || ""}${b.checkIn || ""}`.localeCompare(`${a.date || ""}${a.checkIn || ""}`)),
    [attendanceRecords, currentEmployee?.uid]
  );

  const activeRecord = employeeRecords.find((record) => record.date === selectedDate);
  const monthDays = buildMonthDays(monthAnchor);
  const monthKey = `${monthAnchor.getFullYear()}-${String(monthAnchor.getMonth() + 1).padStart(2, "0")}`;
  const recordedDates = new Set(employeeRecords.filter((record) => record.date?.startsWith(monthKey)).map((record) => record.date));

  useEffect(() => {
    setForm(buildEmployeeForm(currentEmployee?.uid, selectedDate, activeRecord));
  }, [activeRecord, currentEmployee?.uid, selectedDate]);

  const updateCategory = (key, value) => {
    setForm((current) => ({
      ...current,
      salesByCategory: {
        ...current.salesByCategory,
        [key]: Math.max(0, Number(value) || 0),
      },
    }));
  };

  const submit = async (event) => {
    event.preventDefault();
    const validationMessage = validateAttendanceForm(form);
    if (validationMessage) {
      setMessage(validationMessage);
      return;
    }
    setSaving(true);
    setMessage("");

    try {
      await onSave({
        ...form,
        employeeUid: currentEmployee.uid,
        salesByCategory: normalizeSalesByCategory(form.salesByCategory),
      });
      setMessage("Attendance updated successfully.");
    } catch (error) {
      console.error("Employee attendance save failed:", error);
      setMessage("Could not save your attendance right now.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <header className="employee-admin-header">
        <div>
          <h1>My Attendance Panel</h1>
          <p>Mark your attendance from the calendar and enter sales counts by category for the selected day.</p>
        </div>
      </header>

      <section className="employee-admin-stats">
        <article className="employee-admin-stat-card success">
          <span>Recorded Days</span>
          <strong>{employeeRecords.length}</strong>
          <small>Total attendance records in your history</small>
        </article>
        <article className="employee-admin-stat-card info">
          <span>Sales On Selected Day</span>
          <strong>{getSalesTotal(form)}</strong>
          <small>{formatDateLabel(selectedDate)}</small>
        </article>
        <article className="employee-admin-stat-card warning">
          <span>Status</span>
          <strong>{formatStatus(form.status)}</strong>
          <small>Current mark for the selected day</small>
        </article>
      </section>

      <section className="employee-admin-grid">
        <div className="employee-admin-panel">
          <div className="employee-admin-panel-head">
            <div>
              <h2>Attendance Calendar</h2>
              <p>Days with a tick already have an attendance record.</p>
            </div>
            <div className="employee-admin-calendar-nav">
              <button type="button" className="employee-admin-secondary" onClick={() => setMonthAnchor(new Date(monthAnchor.getFullYear(), monthAnchor.getMonth() - 1, 1))}>Prev</button>
              <strong>{monthAnchor.toLocaleDateString("en-GB", { month: "long", year: "numeric" })}</strong>
              <button type="button" className="employee-admin-secondary" onClick={() => setMonthAnchor(new Date(monthAnchor.getFullYear(), monthAnchor.getMonth() + 1, 1))}>Next</button>
            </div>
          </div>

          <div className="employee-admin-calendar-head">
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => <span key={day}>{day}</span>)}
          </div>
          <div className="employee-admin-calendar-grid">
            {monthDays.map((cell, index) => (
              <button
                key={cell?.value || `blank-${index}`}
                type="button"
                className={`employee-admin-day ${cell?.value === selectedDate ? "active" : ""} ${recordedDates.has(cell?.value) ? "recorded" : ""}`}
                disabled={!cell}
                onClick={() => cell && setSelectedDate(cell.value)}
              >
                {cell ? (
                  <>
                    <span>{cell.label}</span>
                    {recordedDates.has(cell.value) && <em>Tick</em>}
                  </>
                ) : null}
              </button>
            ))}
          </div>
        </div>

        <div className="employee-admin-panel">
          <div className="employee-admin-panel-head">
            <div>
              <h2>Mark Attendance</h2>
              <p>{formatDateLabel(selectedDate)} for {currentEmployee?.fullName || currentEmployee?.email}</p>
            </div>
          </div>

          <form className="employee-admin-form" onSubmit={submit}>
            <div className="employee-admin-status-row">
              {["present", "late", "absent", "leave"].map((status) => (
                <button key={status} type="button" className={`employee-admin-filter ${form.status === status ? "active" : ""}`} onClick={() => setForm((current) => ({ ...current, status }))}>
                  {formatStatus(status)}
                </button>
              ))}
            </div>

            <div className="employee-admin-form-row">
              <label>
                Check In
                <input className="employee-admin-date" type="time" value={form.checkIn} onChange={(event) => setForm((current) => ({ ...current, checkIn: event.target.value }))} />
              </label>
              <label>
                Check Out
                <input className="employee-admin-date" type="time" value={form.checkOut} onChange={(event) => setForm((current) => ({ ...current, checkOut: event.target.value }))} />
              </label>
            </div>

            <div>
              <div className="employee-admin-field-label">Sales By Product Category</div>
              <div className="employee-admin-category-grid">
                {SALES_CATEGORIES.map((category) => (
                  <label key={category.key} className="employee-admin-category-card">
                    <span>{category.label}</span>
                    <input className="employee-admin-date" type="number" min="0" value={form.salesByCategory[category.key]} onChange={(event) => updateCategory(category.key, event.target.value)} />
                  </label>
                ))}
              </div>
            </div>

            <label>
              Note
              <textarea className="employee-admin-textarea" value={form.note} onChange={(event) => setForm((current) => ({ ...current, note: event.target.value }))} placeholder="Optional note for leave, field visit, or exception" />
            </label>

            {message && <div className="employee-admin-message">{message}</div>}
            <button className="employee-admin-primary" type="submit" disabled={saving}>
              {saving ? "Saving..." : "Save My Attendance"}
            </button>
          </form>
        </div>
      </section>

      <section className="employee-admin-panel employee-admin-history">
        <div className="employee-admin-panel-head">
          <div>
            <h2>My Attendance History</h2>
            <p>Your history view hides admin-only details like marker identity and other employee data.</p>
          </div>
        </div>

        <div className="employee-admin-table-wrap">
          <table className="employee-admin-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Status</th>
                <th>Sales</th>
                <th>Categories</th>
                <th>Check In</th>
                <th>Check Out</th>
                <th>Note</th>
              </tr>
            </thead>
            <tbody>
              {employeeRecords.length === 0 && <tr><td colSpan="7" className="employee-admin-empty-row">No attendance history yet.</td></tr>}
              {employeeRecords.map((record) => (
                <tr key={record.id}>
                  <td>{formatDateLabel(record.date)}</td>
                  <td><span className={`employee-admin-status-pill ${record.status}`}>{formatStatus(record.status)}</span></td>
                  <td>{getSalesTotal(record)}</td>
                  <td>{summarizeSales(record)}</td>
                  <td>{record.checkIn || "-"}</td>
                  <td>{record.checkOut || "-"}</td>
                  <td>{record.note || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="employee-admin-panel" style={{ marginTop: 24 }}>
        <div className="employee-admin-panel-head">
          <div>
            <h2>Staff Portal Access Code</h2>
            <p>Set a custom security code for logging into the Staff Portal. Keep it secure like a password.</p>
          </div>
        </div>
        <form className="employee-admin-form" onSubmit={handleSaveSecurityCode} style={{ maxWidth: 480 }}>
          <label>
            Custom Staff Security Code
            <input 
              className="employee-admin-date" 
              type="text" 
              value={securityCode} 
              onChange={(e) => setSecurityCode(e.target.value)} 
              placeholder="e.g. MyCode123!"
              required
              style={{ width: '100%', marginTop: 6 }}
            />
          </label>
          {codeMessage && <div className="employee-admin-message" style={{ color: codeMessage.includes('successfully') ? 'var(--green)' : 'var(--red)', marginTop: 10 }}>{codeMessage}</div>}
          <button className="employee-admin-primary" type="submit" disabled={codeSaving} style={{ marginTop: 12 }}>
            {codeSaving ? "Updating Code..." : "Update Security Code"}
          </button>
        </form>
      </section>
    </>
  );
}
