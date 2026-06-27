import { useState, useEffect } from "react";
import { auth } from "../firebase";
import { signInWithEmailAndPassword, sendPasswordResetEmail, onAuthStateChanged, signOut } from "firebase/auth";
import { useNavigate, Link } from "react-router-dom";
import iconxLogo from "../assets/iconx-logo.jpg"; // place your logo in src/assets/
import "./Login.css";
import { getUserAccess } from "../utils/userAccess";
import { getPortalSecuritySettings } from "../utils/portalSecurity";

const ADMIN_PORTAL_SESSION_KEY = "iconx_admin_portal_verified";

/* ── SVG Icons ─────────────────────────────────── */
const MailIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
    <polyline points="22,6 12,13 2,6" />
  </svg>
);

const LockIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

const EyeOn = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const EyeOff = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </svg>
);

const AlertIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0, marginTop: 1 }}>
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
);

const CheckIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0 }}>
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const CheckMini = () => (
  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.5">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

function getRouteForRole(role) {
  if (role === "admin") return "/admin";
  if (role === "employee") return "/employee-admin";
  return "/home";
}

/* ── Login Page ─────────────────────────────────── */
export default function Login() {
  const [email, setEmail]         = useState('');
  const [password, setPassword]   = useState('');
  const [portalCode, setPortalCode] = useState('');
  const [adminMode, setAdminMode] = useState(false);
  const [portalRole, setPortalRole] = useState("admin");
  const [showPw, setShowPw]       = useState(false);
  const [showPortalCode, setShowPortalCode] = useState(false);
  const [remember, setRemember]   = useState(false);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState('');
  const [resetSent, setResetSent] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    let initialLoad = true;
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (initialLoad) {
        initialLoad = false;
        return;
      }

      if (!user) {
        return;
      }

      try {
        const { role, accessStatus } = await getUserAccess(user.uid);
        const verified = sessionStorage.getItem(ADMIN_PORTAL_SESSION_KEY) === "true";
        if (role === "employee" && accessStatus !== "approved") {
          await signOut(auth);
          sessionStorage.removeItem(ADMIN_PORTAL_SESSION_KEY);
          return;
        }
        if ((role === "admin" || role === "employee") && verified) {
          navigate(getRouteForRole(role), { replace: true });
          return;
        }
        if (role !== "admin" && role !== "employee") {
          navigate(getRouteForRole(role), { replace: true });
        }
      } catch (error) {
        console.error("Failed to resolve role during login redirect:", error);
      }
    });
    return unsub;
  }, [navigate]);

  /* Handle login */
  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) { setError('Please enter your email and password.'); return; }
    if (adminMode && !portalCode.trim()) { setError(`Enter the ${portalRole === "admin" ? "admin" : "staff"} portal access code.`); return; }
    setLoading(true); setError('');
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      const { role, accessStatus, profile } = await getUserAccess(cred.user.uid);
      const enteredCode = portalCode.trim();
      if (role === "admin" || role === "employee") {
        if (role === "employee" && accessStatus !== "approved") {
          await signOut(auth);
          sessionStorage.removeItem(ADMIN_PORTAL_SESSION_KEY);
          setError(
            accessStatus === "rejected"
              ? "Your employee access request was rejected. Please contact the admin team."
              : "Your employee account request is pending admin approval."
          );
          return;
        }
        if (!adminMode) {
          await signOut(auth);
          setError('Use Admin / Staff Portal mode to access the admin panel.');
          sessionStorage.removeItem(ADMIN_PORTAL_SESSION_KEY);
          return;
        }
        if (portalRole === "admin" && role !== "admin") {
          await signOut(auth);
          sessionStorage.removeItem(ADMIN_PORTAL_SESSION_KEY);
          setError('Admin code login is only for admin accounts.');
          return;
        }
        if (portalRole === "employee" && role !== "employee") {
          await signOut(auth);
          sessionStorage.removeItem(ADMIN_PORTAL_SESSION_KEY);
          setError('Staff code login is only for approved employee accounts.');
          return;
        }
        if (role === "admin") {
          const { adminCode } = await getPortalSecuritySettings();
          if (portalRole !== "admin" || enteredCode !== adminCode) {
            await signOut(auth);
            sessionStorage.removeItem(ADMIN_PORTAL_SESSION_KEY);
            setError('Invalid admin portal access code.');
            return;
          }
        }
        if (role === "employee") {
          const employeeCode = String(profile?.employeeSecurityCode || "");
          if (portalRole !== "employee" || enteredCode !== employeeCode) {
            await signOut(auth);
            sessionStorage.removeItem(ADMIN_PORTAL_SESSION_KEY);
            setError('Invalid staff portal access code.');
            return;
          }
        }
        sessionStorage.setItem(ADMIN_PORTAL_SESSION_KEY, "true");
        navigate(getRouteForRole(role), { replace: true });
        return;
      }

      sessionStorage.removeItem(ADMIN_PORTAL_SESSION_KEY);
      navigate(getRouteForRole(role), { replace: true });
    } catch (err) {
      sessionStorage.removeItem(ADMIN_PORTAL_SESSION_KEY);
      setError({
        'auth/user-not-found':     'No account found with this email.',
        'auth/wrong-password':     'Incorrect password. Please try again.',
        'auth/invalid-email':      'Please enter a valid email address.',
        'auth/too-many-requests':  'Too many attempts. Try again later.',
        'auth/invalid-credential': 'Invalid email or password.',
      }[err.code] || 'Something went wrong. Please try again.');
    } finally { setLoading(false); }
  };

  /* Handle forgot password */
  const handleReset = async () => {
    if (!email) { setError('Enter your email address first.'); return; }
    setLoading(true); setError('');
    try {
      await sendPasswordResetEmail(auth, email);
      setResetSent(true);
    } catch {
      setError('Could not send reset email. Check the address.');
    } finally { setLoading(false); }
  };

  return (
    <div className="lp-root">

      {/* ── Animated background ── */}
      <div className="lp-bg">
        <div className="lp-bg-img" />
        <div className="lp-bg-overlay" />
        <div className="lp-blob lp-blob-1" />
        <div className="lp-blob lp-blob-2" />
        <div className="lp-blob lp-blob-3" />
      </div>

      {/* ── Floating phone decorations ── */}
      <div className="lp-deco lp-deco-left">
        <div className="lp-phone lp-phone-1" />
        <div className="lp-phone lp-phone-2" />
      </div>
      <div className="lp-deco lp-deco-right">
        <div className="lp-phone lp-phone-3" />
        <div className="lp-phone lp-phone-4" />
      </div>

      {/* ── Card ── */}
      <div className="lp-wrapper">
        <div className="lp-card">

          {/* Logo */}
          <div className="lp-logo-wrap">
            <div className="lp-logo-ring">
              <img src={iconxLogo} alt="iconX Mobile Store" className="lp-logo-img" />
            </div>
            <div className="lp-logo-tagline">Mobile Store</div>
            <p className="lp-welcome">
            </p>
          </div>

          {/* Alerts */}
          {error && (
            <div className="lp-alert lp-alert-error">
              <AlertIcon /> {error}
            </div>
          )}
          {resetSent && (
            <div className="lp-alert lp-alert-success">
              <CheckIcon /> Reset link sent — check your inbox.
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleLogin} noValidate>

            <div className="lp-field">
              <label className="lp-label">Access Type</label>
              <div className="sp-role-wrap">
                {[
                  { val: false, label: 'Customer Login' },
                  { val: true, label: 'Admin / Staff Portal' },
                ].map(mode => (
                  <button
                    key={String(mode.val)}
                    type="button"
                    className={`sp-role-btn${adminMode === mode.val ? ' active' : ''}`}
                    onClick={() => {
                      setAdminMode(mode.val);
                      setPortalRole('admin');
                      setPortalCode('');
                      setError('');
                    }}
                  >
                    {mode.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Email */}
            <div className="lp-field">
              <label className="lp-label" htmlFor="lp-email">Email Address</label>
              <div className={`lp-input-wrap${error && !email ? ' error' : ''}`}>
                <span className="lp-input-icon"><MailIcon /></span>
                <input
                  id="lp-email"
                  className="lp-input"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  autoComplete="email"
                  onChange={e => { setEmail(e.target.value); setError(''); setResetSent(false); }}
                />
              </div>
            </div>

            {/* Password */}
            <div className="lp-field">
              <label className="lp-label" htmlFor="lp-password">Password</label>
              <div className={`lp-input-wrap${error && !password ? ' error' : ''}`}>
                <span className="lp-input-icon"><LockIcon /></span>
                <input
                  id="lp-password"
                  className="lp-input"
                  type={showPw ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={password}
                  autoComplete="current-password"
                  onChange={e => { setPassword(e.target.value); setError(''); }}
                />
                <button type="button" className="lp-eye-btn" onClick={() => setShowPw(p => !p)}>
                  {showPw ? <EyeOff /> : <EyeOn />}
                </button>
              </div>
            </div>

            {adminMode && (
              <>
                <div className="lp-field">
                  <label className="lp-label">Security Code Type</label>
                  <div className="sp-role-wrap">
                    {[
                      { val: 'admin', label: 'Admin Code' },
                      { val: 'employee', label: 'Staff Code' },
                    ].map(option => (
                      <button
                        key={option.val}
                        type="button"
                        className={`sp-role-btn${portalRole === option.val ? ' active' : ''}`}
                        onClick={() => {
                          setPortalRole(option.val);
                          setPortalCode('');
                          setError('');
                        }}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="lp-field">
                  <label className="lp-label" htmlFor="lp-portal-code">{portalRole === "admin" ? "Admin Security Code" : "Staff Security Code"}</label>
                  <div className={`lp-input-wrap${error && !portalCode ? ' error' : ''}`}>
                    <span className="lp-input-icon"><LockIcon /></span>
                    <input
                      id="lp-portal-code"
                      className="lp-input"
                      type={showPortalCode ? 'text' : 'password'}
                      placeholder={portalRole === "admin" ? "Enter admin security code" : "Enter staff security code"}
                      value={portalCode}
                      autoComplete="one-time-code"
                      onChange={e => { setPortalCode(e.target.value); setError(''); }}
                    />
                    <button type="button" className="lp-eye-btn" onClick={() => setShowPortalCode(p => !p)}>
                      {showPortalCode ? <EyeOff /> : <EyeOn />}
                    </button>
                  </div>
                </div>
              </>
            )}

            {/* Remember me + Forgot password */}
            <div className="lp-options">
              <label className="lp-remember">
                <div
                  className={`lp-checkmark${remember ? ' on' : ''}`}
                  onClick={() => setRemember(p => !p)}
                >
                  {remember && <CheckMini />}
                </div>
                Remember me
              </label>
              <button
                type="button"
                className="lp-forgot"
                onClick={handleReset}
                disabled={loading}
              >
                Forgot Password?
              </button>
            </div>

            {/* Submit */}
            <button className="lp-btn" type="submit" disabled={loading}>
              <span className="lp-btn-shimmer" />
              {loading
                ? <><span className="lp-spinner" /> Signing in...</>
                : 'Sign In'
              }
            </button>

          </form>

          {/* Sign up link */}
          <div className="lp-signup">
            {adminMode ? (
              'Admin and staff accounts must be approved before portal access is granted.'
            ) : (
              <>
                Don't have an account?{' '}
                <Link to="/signup">Create one free</Link>
              </>
            )}
          </div>

        </div>
      </div>

      {/* Footer */}
      <div className="lp-footer-bar">
        © 2025 iconX Mobile Store. All rights reserved.
      </div>

    </div>
  );
}
