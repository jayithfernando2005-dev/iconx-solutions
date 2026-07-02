import { useState, useEffect } from "react";
import { auth, db } from "../firebase";
import { signInWithEmailAndPassword, sendPasswordResetEmail, onAuthStateChanged, signOut, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { addDoc, collection, serverTimestamp, setDoc, doc, query, where, getDocs, updateDoc } from "firebase/firestore";
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

  /* ── Auto-resolve a pending password reset ───────────────────────────────
     Firebase never tells our app when someone finishes the reset flow on
     the emailed link (that page lives outside our app entirely). The next
     best signal that a reset actually worked is: this email just signed in
     successfully. So on every successful login, we flip the newest
     'requested' / 'admin_sent' entry for that email over to 'resolved'.
  ──────────────────────────────────────────────────────────────────────── */
  const autoResolvePendingReset = async (userEmail) => {
    try {
      const snap = await getDocs(query(collection(db, 'passwordResets'), where('email', '==', userEmail)));
      const pending = snap.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .filter((r) => r.status === 'requested' || r.status === 'admin_sent')
        .sort((a, b) => (b.requestedAt?.toMillis?.() || 0) - (a.requestedAt?.toMillis?.() || 0));
      if (pending.length > 0) {
        await updateDoc(doc(db, 'passwordResets', pending[0].id), {
          status: 'resolved',
          resolvedAt: serverTimestamp(),
          resolvedBy: 'user (auto — signed in successfully)',
        });
      }
    } catch (err) {
      // Never let this block login
      console.warn('Auto-resolve password reset check failed:', err);
    }
  };

  /* Handle login */
  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) { setError('Please enter your email and password.'); return; }
    if (adminMode && !portalCode.trim()) { setError(`Enter the ${portalRole === "admin" ? "admin" : "staff"} portal access code.`); return; }
    setLoading(true); setError('');
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      autoResolvePendingReset(email.trim().toLowerCase()); // fire-and-forget, don't block navigation
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

  /* ── Handle forgot password ──────────────────────────────────────────────
     Security: before sending a reset email we check which provider this
     address is linked to.
     • If linked to "google.com" → block the reset. The user must sign in
       via Google; there is no password to reset, and sending a reset would
       let anyone who knows the email address hijack the account.
     • Otherwise → safe to send.
     • If the address is not registered at all → we still show the generic
       success message to avoid leaking which emails exist.

     NOTE: this used to check `fetchSignInMethodsForEmail`, but Google
     disabled that API for every Firebase project created after 15 Sep 2023
     (the "email enumeration protection" setting, on by default for new
     projects). With that setting on, fetchSignInMethodsForEmail ALWAYS
     resolves to an empty array — for every address, real or not — which
     meant this code always fell into the "address not registered" branch
     and silently skipped sendPasswordResetEmail entirely. That's why the
     button looked like it worked (it showed "Reset link sent") but no
     email ever actually went out, and nothing was ever logged to
     `passwordResets` for the admin panel — including Google-account
     attempts, which never even reached the block condition. We now read
     the provider directly from the `users` collection (already stored
     there — see handleGoogleLogin below) instead of asking Firebase Auth.
  ──────────────────────────────────────────────────────────────────────── */
  const handleReset = async () => {
    if (!email) { setError('Enter your email address first.'); return; }

    const trimmedEmail = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setError('Please enter a valid email address.');
      return;
    }

    // Rate Limiting Cooldown: 60 seconds
    const lastRequestTime = localStorage.getItem(`lastResetTime_${trimmedEmail}`);
    const now = Date.now();
    if (lastRequestTime && now - parseInt(lastRequestTime, 10) < 60000) {
      const waitSec = Math.ceil((60000 - (now - parseInt(lastRequestTime, 10))) / 1000);
      setError(`Please wait ${waitSec} seconds before requesting another password reset email.`);
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Look up this email's provider in Firestore instead of the now-broken
      // fetchSignInMethodsForEmail.
      let userDoc = null;
      try {
        const snap = await getDocs(query(collection(db, 'users'), where('email', '==', trimmedEmail)));
        userDoc = snap.docs[0]?.data() || null;
      } catch (lookupErr) {
        console.warn('User lookup for password reset failed, proceeding anyway:', lookupErr);
      }

      // Deactivated account check
      if (userDoc && String(userDoc.status || '').toLowerCase() === 'inactive') {
        setError('This account has been deactivated. Please contact support.');
        setLoading(false);
        return;
      }

      // Google-only account: sending a password reset would be a security
      // hole — block it, explain to the user, and log the attempt so it's
      // visible in the admin panel's Password Resets tab.
      if (userDoc?.provider === 'google') {
        setError(
          'This email is linked to a Google account. Please sign in with the "Continue with Google" button instead. Password reset is not available for Google accounts.'
        );
        try {
          await addDoc(collection(db, 'passwordResets'), {
            email: trimmedEmail,
            requestedAt: serverTimestamp(),
            status: 'blocked_google_account',
            initiatedBy: 'user',
            note: 'Blocked — Google-only account has no password.',
          });
        } catch (logErr) {
          console.warn('Could not log blocked reset request:', logErr);
        }
        return;
      }

      // Not a Google-only account (or not found) → safe to send reset.
      // actionCodeSettings routes the emailed link to our own in-app
      // ResetPassword page (instead of Firebase's default hosted page) so
      // we can mark this request "resolved" the instant the user actually
      // sets their new password. (The login-time auto-resolve in
      // handleLogin below stays too, as a fallback for admin-sent resets
      // or anyone who lands on Firebase's default page anyway.)
      await sendPasswordResetEmail(auth, trimmedEmail, {
        url: `${window.location.origin}/reset-password`,
        handleCodeInApp: true,
      });
      // Store timestamp of successful request
      localStorage.setItem(`lastResetTime_${trimmedEmail}`, Date.now().toString());
      setResetSent(true);

      // Log reset request to Firestore so admin panel can track it
      try {
        await addDoc(collection(db, 'passwordResets'), {
          email: trimmedEmail,
          requestedAt: serverTimestamp(),
          status: 'requested',
          initiatedBy: 'user',
          note: 'User initiated password reset from login page',
        });
      } catch (logErr) {
        // Don't block the user if logging fails — reset email already sent
        console.warn('Could not log password reset request:', logErr);
      }
    } catch (err) {
      if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-email') {
        // Show generic success so we don't reveal which emails exist
        setResetSent(true);
        return;
      }
      setError('Could not send reset email. Check the address and try again.');
    } finally {
      setLoading(false);
    }
  };

  /* Handle Google Sign-In — customers only */
  const handleGoogleLogin = async () => {
    if (adminMode) {
      setError('Google Sign-In is only available for customer accounts. Admins and staff must use email + security code.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      const cred = await signInWithPopup(auth, provider);
      const user = cred.user;

      // Try to get existing role from Firestore
      let role = null;
      let profile = null;
      let hasFirestoreDoc = false;
      try {
        const access = await getUserAccess(user.uid);
        if (access && access.source !== 'fallback') {
          role = access.role;
          profile = access.profile;
          hasFirestoreDoc = true;
        }
      } catch {
        // No Firestore doc yet — first-time Google sign-in, will create below
      }

      // Block admins/employees from using Google login
      if (role === 'admin' || role === 'employee') {
        await signOut(auth);
        sessionStorage.removeItem(ADMIN_PORTAL_SESSION_KEY);
        setError('Admin and staff accounts must log in with email and security code, not Google.');
        return;
      }

      // In case of a previous bug, the document might exist but be an incomplete stub (missing role, email, or name)
      const isStub = hasFirestoreDoc && profile && (!profile.role || !profile.email || !profile.fullName);

      // First-time Google user (or incomplete stub) — create/complete their Firestore user document
      if (!hasFirestoreDoc || isStub) {
        await setDoc(doc(db, 'users', user.uid), {
          fullName: user.displayName || '',
          firstName: (user.displayName || '').split(' ')[0] || '',
          lastName: (user.displayName || '').split(' ').slice(1).join(' ') || '',
          email: user.email || '',
          phone: profile?.phone || '',
          role: 'customer',
          status: profile?.status || 'active',
          provider: 'google',           // ← marks this as a Google account
          photoURL: user.photoURL || '',
          createdAt: profile?.createdAt || serverTimestamp(),
          updatedAt: serverTimestamp(),
        }, { merge: true });
      } else {
        // Returning Google user — ensure provider field is always set
        await setDoc(doc(db, 'users', user.uid), {
          provider: 'google',
          updatedAt: serverTimestamp(),
        }, { merge: true });
      }

      sessionStorage.removeItem(ADMIN_PORTAL_SESSION_KEY);
      navigate('/home', { replace: true });
    } catch (err) {
      sessionStorage.removeItem(ADMIN_PORTAL_SESSION_KEY);
      if (err.code === 'auth/popup-closed-by-user' || err.code === 'auth/cancelled-popup-request') {
        // User closed the popup — not an error worth showing
        return;
      }
      setError({
        'auth/popup-blocked':          'Pop-up was blocked by your browser. Please allow pop-ups for this site.',
        'auth/account-exists-with-different-credential': 'An account already exists with this email using a different sign-in method.',
      }[err.code] || 'Google Sign-In failed. Please try again.');
    } finally {
      setLoading(false);
    }
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

          {/* Google Sign-In — customers only */}
          {!adminMode && (
            <>
              <div className="lp-divider">
                <span>or continue with</span>
              </div>
              <button
                type="button"
                className="lp-google-btn"
                onClick={handleGoogleLogin}
                disabled={loading}
              >
                 <span className="lp-btn-shimmer" />  
                <svg width="18" height="18" viewBox="0 0 48 48" style={{ flexShrink: 0 }}>
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                  <path fill="none" d="M0 0h48v48H0z"/>
                </svg>
                Continue with Google
              </button>
            </>
          )}

          {/* Sign up link */}
          <div className="lp-signup">
            {adminMode ? (
              'Admin and staff accounts must be approved before portal access is granted.'
            ) : (
              <>
                Don't have an account?{' '}
                <Link to="/signup">Create new account</Link>
              </>
            )}
          </div>

        </div>
      </div>


    </div>
  );
}