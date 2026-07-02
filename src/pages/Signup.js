import { useState, useEffect } from "react";
import { auth, db } from "../firebase";
import {
  createUserWithEmailAndPassword,
  updateProfile,
  signOut,
} from "firebase/auth";
import {
  doc,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";
import { useNavigate, Link } from "react-router-dom";
import iconxLogo from "../assets/iconx-logo.jpg";
import "./Signup.css";

/* ── Password strength ─────────────────────────── */
function pwStrength(pw) {
  let s = 0;
  if (pw.length >= 8)           s++;
  if (/[A-Z]/.test(pw))         s++;
  if (/[0-9]/.test(pw))         s++;
  if (/[^A-Za-z0-9]/.test(pw))  s++;
  return s;
}
const SL = ['', 'Weak', 'Fair', 'Good', 'Strong'];
const SC = ['', '#ef4444', '#f59e0b', '#3b82f6', '#22c55e'];
const ADMIN_SECURITY_CODE = 'Admin1234';

function isStrongAdminPassword(pw) {
  return (
    pw.length >= 12 &&
    /[A-Z]/.test(pw) &&
    /[a-z]/.test(pw) &&
    /[0-9]/.test(pw) &&
    /[^A-Za-z0-9]/.test(pw)
  );
}

/* ── Friendly Firebase error messages ─────────── */
const AUTH_ERRORS = {
  'auth/email-already-in-use':  'An account with this email already exists.',
  'auth/invalid-email':         'Please enter a valid email address.',
  'auth/weak-password':         'Password is too weak. Use at least 6 characters.',
  'auth/operation-not-allowed': 'Email sign-up is not enabled. Contact support.',
  'auth/network-request-failed':'Network error. Check your internet connection.',
  'auth/too-many-requests':     'Too many attempts. Please try again later.',
};

/* ── Icons ─────────────────────────────────────── */
const Icon = {
  user:   () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  mail:   () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>,
  lock:   () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>,
  phone:  () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.56 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 9.91a16 16 0 0 0 6.16 6.16l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>,
  eyeOn:  () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>,
  eyeOff: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>,
  check:  () => <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>,
  ok:     () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>,
  err:    () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{flexShrink:0,marginTop:1}}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>,
  stepDone: () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>,
};

/* ── Signup Page ────────────────────────────────── */
export default function Signup() {
  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '',
    phone: '', password: '', confirmPassword: '',
    role: 'customer', securityCode: '',
  });
  const [showPw, setShowPw]     = useState(false);
  const [showCpw, setShowCpw]   = useState(false);
  const [agreed, setAgreed]     = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const [success, setSuccess]   = useState(false);
  const [step, setStep]         = useState(1);
  const navigate = useNavigate();


  /* Auto-advance step indicator */
  useEffect(() => {
    if (form.email && form.password && form.confirmPassword)
      setStep(s => Math.max(s, 2));
    else
      setStep(s => Math.min(s, 1));
  }, [form.email, form.password, form.confirmPassword]);

  const up = k => e => { setForm(p => ({ ...p, [k]: e.target.value })); setError(''); };
  const upPhone = e => {
    const digitsOnly = e.target.value.replace(/\D/g, '').slice(0, 10);
    setForm(p => ({ ...p, phone: digitsOnly }));
    setError('');
  };
  const strength    = pwStrength(form.password);
  const progressPct = step === 1 ? 33 : step === 2 ? 66 : 100;

  /* ── Validation ── */
  const validate = () => {
    if (!form.firstName.trim())                 return 'First name is required.';
    if (!form.lastName.trim())                  return 'Last name is required.';
    if (!form.email.trim())                     return 'Email address is required.';
    if (!/\S+@\S+\.\S+/.test(form.email))       return 'Enter a valid email address.';
    if (form.phone && form.phone.length !== 10) return 'Contact number must be exactly 10 digits.';
    if (form.password.length < 6)               return 'Password must be at least 6 characters.';
    if (form.role === 'admin' && !isStrongAdminPassword(form.password)) {
      return 'Admin password must be at least 12 characters and include uppercase, lowercase, number, and special character.';
    }
    if (form.password !== form.confirmPassword)  return 'Passwords do not match.';
    if (form.role === 'admin' && form.securityCode.trim() !== ADMIN_SECURITY_CODE) {
      return 'Invalid admin security code.';
    }
    if (!agreed)                                return 'Please agree to the Terms of Service.';
    return null;
  };

  /* ── Handle signup ── */
  const handleSignup = async e => {
    e.preventDefault();
    const validationError = validate();
    if (validationError) { setError(validationError); return; }

    setLoading(true);
    setError('');

    let cred = null;

    try {
      // Step 1 — Create Firebase Auth user
      console.log('[Signup] Creating auth user for:', form.email);
      cred = await createUserWithEmailAndPassword(auth, form.email, form.password);
      console.log('[Signup] Auth user created:', cred.user.uid);

      // Step 2 — Update display name
      await updateProfile(cred.user, {
        displayName: `${form.firstName.trim()} ${form.lastName.trim()}`,
      });
      console.log('[Signup] Display name updated');

      // Step 3 — Write customer document to Firestore
      const customerData = {
        uid:        cred.user.uid,
        firstName:  form.firstName.trim(),
        lastName:   form.lastName.trim(),
        fullName:   `${form.firstName.trim()} ${form.lastName.trim()}`,
        email:      form.email.trim().toLowerCase(),
        phone:      form.phone.trim() || '',
        role:       form.role,
        createdAt:  serverTimestamp(),
        updatedAt:  serverTimestamp(),
        status:     form.role === 'employee' ? 'pending' : 'active',
        accessStatus: form.role === 'employee' ? 'pending' : 'active',
        requestedAt: form.role === 'employee' ? serverTimestamp() : null,
        approvedAt: null,
        approvedBy: '',
        approvedByName: '',
      };

      console.log('[Signup] Writing to Firestore users/', cred.user.uid);
      await setDoc(doc(db, 'users', cred.user.uid), customerData);

      if (form.role === 'customer') {
        console.log('[Signup] Writing to Firestore customers/', cred.user.uid);
        await setDoc(doc(db, 'customers', cred.user.uid), customerData);
      }
      console.log('[Signup] Firestore write successful ✅');

      // Sign out immediately — prevents Login page's onAuthStateChanged
      // from detecting this new session and auto-redirecting to /admin
      await signOut(auth);
      console.log('[Signup] Signed out, redirecting to login...');

      // Show success screen then go to login
      setSuccess(true);
      setStep(3);
      setTimeout(() => navigate('/login'), 2000);

    } catch (err) {
      console.error('[Signup] Error code:', err.code);
      console.error('[Signup] Error message:', err.message);
      console.error('[Signup] Full error:', err);

      // If auth succeeded but Firestore failed, still show partial success
      if (cred && err.code && !err.code.startsWith('auth/')) {
        console.warn('[Signup] Auth OK but Firestore failed. User:', cred.user.uid);
        setError(
          `Account created but profile save failed: ${err.message}. ` +
          `Please contact support with ID: ${cred.user.uid}`
        );
      } else {
        setError(AUTH_ERRORS[err.code] || `Error: ${err.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="sp-root">

      {/* ── Animated background ── */}
      <div className="sp-bg">
        <div className="sp-bg-img" />
        <div className="sp-bg-overlay" />
        <div className="sp-blob sp-blob-1" />
        <div className="sp-blob sp-blob-2" />
        <div className="sp-blob sp-blob-3" />
      </div>

      {/* ── Floating phone decorations ── */}
      <div className="sp-deco sp-deco-left">
        <div className="sp-phone sp-phone-1" />
        <div className="sp-phone sp-phone-2" />
      </div>
      <div className="sp-deco sp-deco-right">
        <div className="sp-phone sp-phone-3" />
        <div className="sp-phone sp-phone-4" />
      </div>

      {/* ── Main layout ── */}
      <div className="sp-wrapper">

        {/* Step sidebar */}
        <div className="sp-sidebar">
          <div className="sp-sidebar-logo">
            <div className="sp-logo-ring">
              <img src={iconxLogo} alt="iconX" className="sp-logo-img" />
            </div>
            <div className="sp-logo-tagline">Mobile Store</div>
          </div>

          <div className="sp-steps-title">Getting Started</div>

          {[
            { n: 1, label: 'Account Setup',  desc: 'Enter your email and set a secure password.' },
            { n: 2, label: 'Your Profile',   desc: 'Add your name and contact details.' },
            { n: 3, label: 'All Done!',      desc: 'Your iconX account is ready to use.' },
          ].map((s, i) => (
            <div key={s.n}>
              <div className={`sp-step${step === s.n ? ' active' : step > s.n ? ' done' : ''}`}>
                <div className="sp-step-num">
                  {step > s.n ? <Icon.stepDone /> : s.n}
                </div>
                <div className="sp-step-text">
                  <div className="sp-step-label">{s.label}</div>
                  <div className="sp-step-desc">{s.desc}</div>
                </div>
              </div>
              {i < 2 && <div className="sp-step-line" />}
            </div>
          ))}

          <div className="sp-progress-wrap">
            <div className="sp-progress-bar" style={{ width: progressPct + '%' }} />
          </div>
        </div>

        {/* White form card */}
        <div className="sp-card">
          {success ? (
            <div className="sp-success-screen">
              <div className="sp-success-emoji">🎉</div>
              <div className="sp-success-title">Account Created!</div>
              <div className="sp-success-sub">
                {form.role === 'employee'
                  ? <>Thanks {form.firstName}, your employee account request was sent to admin for approval.<br />Redirecting to login page...</>
                  : <>Welcome to iconX, {form.firstName}!<br />Redirecting to login page...</>}
              </div>
            </div>
          ) : (
            <>
              <h2 className="sp-form-title">Create your account</h2>
              <p className="sp-form-sub">
                Already have one? <Link to="/login">Sign in instead</Link>
              </p>

              {error && (
                <div className="sp-alert sp-alert-error">
                  <Icon.err /> <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSignup} noValidate>

                {/* Role selector */}
                <div className="sp-field">
                  <label className="sp-label">I am a</label>
                  <div className="sp-role-wrap">
                    {[
                      { val: 'customer', icon: '👤', label: 'Customer' },
                      { val: 'employee', icon: '🏷️', label: 'Employee' },
                      { val: 'admin',    icon: '⚙️', label: 'Admin' },
                    ].map(r => (
                      <button
                        key={r.val} type="button"
                        className={`sp-role-btn${form.role === r.val ? ' active' : ''}`}
                        onClick={() => setForm(p => ({ ...p, role: r.val }))}
                      >
                        <span className="sp-role-icon">{r.icon}</span>
                        {r.label}
                      </button>
                    ))}
                  </div>
                  {form.role === 'employee' && (
                    <div className="sp-match-msg">
                      Employee accounts stay pending until an admin reviews and approves the request.
                    </div>
                  )}
                </div>

                {/* Name row */}
                <div className="sp-grid-2">
                  <div className="sp-field">
                    <label className="sp-label">First Name</label>
                    <div className="sp-input-wrap">
                      <span className="sp-input-icon"><Icon.user /></span>
                      <input
                        className={`sp-input${!form.firstName && error ? ' error' : form.firstName ? ' valid' : ''}`}
                        type="text" placeholder="John"
                        value={form.firstName} onChange={up('firstName')}
                        autoComplete="given-name"
                      />
                    </div>
                  </div>
                  <div className="sp-field">
                    <label className="sp-label">Last Name</label>
                    <div className="sp-input-wrap">
                      <span className="sp-input-icon"><Icon.user /></span>
                      <input
                        className={`sp-input${!form.lastName && error ? ' error' : form.lastName ? ' valid' : ''}`}
                        type="text" placeholder="Doe"
                        value={form.lastName} onChange={up('lastName')}
                        autoComplete="family-name"
                      />
                    </div>
                  </div>
                </div>

                {/* Email */}
                <div className="sp-field">
                  <label className="sp-label">Email Address</label>
                  <div className="sp-input-wrap">
                    <span className="sp-input-icon"><Icon.mail /></span>
                    <input
                      className={`sp-input${!form.email && error ? ' error' : form.email ? ' valid' : ''}`}
                      type="email" placeholder="you@example.com"
                      value={form.email} onChange={up('email')}
                      autoComplete="email"
                    />
                  </div>
                </div>

                {/* Phone */}
                <div className="sp-field">
                  <label className="sp-label">
                    Phone <span className="sp-label-opt">(optional)</span>
                  </label>
                  <div className="sp-input-wrap">
                    <span className="sp-input-icon"><Icon.phone /></span>
                    <input
                      className="sp-input"
                      type="tel" placeholder="0771234567"
                      value={form.phone} onChange={upPhone}
                      autoComplete="tel"
                      inputMode="numeric"
                      maxLength={10}
                    />
                  </div>
                </div>

                {/* Password */}
                <div className="sp-field">
                  <label className="sp-label">Password</label>
                  <div className="sp-input-wrap">
                    <span className="sp-input-icon"><Icon.lock /></span>
                    <input
                      className={`sp-input${form.password && strength < 2 ? ' error' : form.password && strength >= 3 ? ' valid' : ''}`}
                      type={showPw ? 'text' : 'password'}
                      placeholder="At least 6 characters"
                      value={form.password} onChange={up('password')}
                      autoComplete="new-password"
                    />
                    <button type="button" className="sp-input-eye" onClick={() => setShowPw(p => !p)}>
                      {showPw ? <Icon.eyeOff /> : <Icon.eyeOn />}
                    </button>
                  </div>
                  {form.password && (
                    <div className="sp-pw-strength">
                      <div className="sp-pw-bars">
                        {[1, 2, 3, 4].map(i => (
                          <div key={i} className={`sp-pw-bar${strength >= i ? ' s' + strength : ''}`} />
                        ))}
                      </div>
                      <div className="sp-pw-label" style={{ color: SC[strength] }}>
                        {SL[strength]} password
                      </div>
                    </div>
                  )}
                  {form.role === 'admin' && (
                    <div className="sp-match-msg">
                      Admin accounts require a 12+ character password with uppercase, lowercase, number, and special character.
                    </div>
                  )}
                </div>

                {/* Confirm password */}
                <div className="sp-field">
                  <label className="sp-label">Confirm Password</label>
                  <div className="sp-input-wrap">
                    <span className="sp-input-icon"><Icon.lock /></span>
                    <input
                      className={`sp-input${
                        form.confirmPassword && form.confirmPassword !== form.password ? ' error' :
                        form.confirmPassword && form.confirmPassword === form.password ? ' valid' : ''
                      }`}
                      type={showCpw ? 'text' : 'password'}
                      placeholder="Repeat your password"
                      value={form.confirmPassword} onChange={up('confirmPassword')}
                      autoComplete="new-password"
                    />
                    <button type="button" className="sp-input-eye" onClick={() => setShowCpw(p => !p)}>
                      {showCpw ? <Icon.eyeOff /> : <Icon.eyeOn />}
                    </button>
                  </div>
                  {form.confirmPassword && form.password !== form.confirmPassword && (
                    <div className="sp-match-msg error">Passwords don't match</div>
                  )}
                  {form.confirmPassword && form.password === form.confirmPassword && (
                    <div className="sp-match-msg ok"><Icon.ok /> Passwords match</div>
                  )}
                </div>

                {form.role === 'admin' && (
                  <div className="sp-field">
                    <label className="sp-label">Admin Security Code</label>
                    <div className="sp-input-wrap">
                      <span className="sp-input-icon"><Icon.lock /></span>
                      <input
                        className={`sp-input${error && !form.securityCode ? ' error' : form.securityCode ? ' valid' : ''}`}
                        type="password"
                        placeholder="Enter admin security code"
                        value={form.securityCode}
                        onChange={up('securityCode')}
                        autoComplete="one-time-code"
                      />
                    </div>
                    <div className="sp-match-msg">
                      Enter the fixed admin security code to create an admin account.
                    </div>
                  </div>
                )}

                {/* Terms */}
                <div className="sp-terms">
                  <div
                    className={`sp-checkbox${agreed ? ' checked' : ''}`}
                    onClick={() => setAgreed(p => !p)}
                    role="checkbox"
                    aria-checked={agreed}
                  >
                    {agreed && <Icon.check />}
                  </div>
                  <span>
                    I agree to the Icox{' '}
                    <a href="#terms">Terms & Conditions</a> and{' '}
                    <a href="#privacy">Privacy Policy</a>
                  </span>
                </div>

                {/* Submit */}
                <button className="sp-btn" type="submit" disabled={loading}>
                  <span className="sp-btn-shimmer" />
                  {loading
                    ? <><span className="sp-spinner" /> Creating account...</>
                    : 'Create Account '
                  }
                </button>

              </form>

      
            </>
          )}
        </div>

      </div>



    </div>
  );
}
