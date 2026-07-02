import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { verifyPasswordResetCode, confirmPasswordReset } from 'firebase/auth';
import { collection, query, where, getDocs, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../firebase';
import iconxLogo from '../assets/iconx-logo.jpg';
import './Login.css';

// Inline Icons to keep visual style unified
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
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0, marginTop: 1 }}>
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
  </svg>
);

export default function Resetpassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const oobCode = searchParams.get('oobCode');
  
  const [email, setEmail] = useState('');
  const [isValidating, setIsValidating] = useState(true);
  const [validationError, setValidationError] = useState('');
  
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Verify the password reset code on mount
  useEffect(() => {
    if (!oobCode) {
      setValidationError('No password reset action code was provided in the link. Please request a new link.');
      setIsValidating(false);
      return;
    }

    const checkCode = async () => {
      try {
        const verifiedEmail = await verifyPasswordResetCode(auth, oobCode);
        setEmail(verifiedEmail);
      } catch (err) {
        console.error('Password reset code verification failed:', err);
        setValidationError('The password reset link is invalid or has expired. Please request a new link.');
      } finally {
        setIsValidating(false);
      }
    };

    checkCode();
  }, [oobCode]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newPassword || !confirmPassword) {
      setError('Please fill in all fields.');
      return;
    }

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    if (!/[a-zA-Z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
      setError('Password must contain both letters and numbers.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // 1. Update password in Firebase Auth
      await confirmPasswordReset(auth, oobCode, newPassword);

      // 2. Automatically resolve pending requests in Firestore
      try {
        const qResets = query(
          collection(db, 'passwordResets'),
          where('email', '==', email.toLowerCase().trim()),
          where('status', 'in', ['requested', 'admin_sent'])
        );
        const snap = await getDocs(qResets);
        const promises = snap.docs.map((d) =>
          updateDoc(doc(db, 'passwordResets', d.id), {
            status: 'resolved',
            resolvedAt: serverTimestamp(),
            resolvedBy: 'user (via reset link)',
          })
        );
        await Promise.all(promises);
      } catch (firestoreErr) {
        console.warn('Could not auto-resolve password resets log in Firestore:', firestoreErr);
      }

      setSuccess(true);
    } catch (err) {
      console.error('Failed to reset password:', err);
      setError({
        'auth/expired-action-code': 'The password reset link has expired. Please request a new one.',
        'auth/invalid-action-code': 'The action code is invalid. Please request a new link.',
        'auth/user-disabled': 'This account has been deactivated.',
        'auth/user-not-found': 'No account was found matching this reset request.',
      }[err.code] || 'Failed to update password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="lp-root">
      {/* Decorative animated background */}
      <div className="lp-bg">
        <div className="lp-bg-img" />
        <div className="lp-bg-overlay" />
        <div className="lp-blob lp-blob-1" />
        <div className="lp-blob lp-blob-2" />
        <div className="lp-blob lp-blob-3" />
      </div>

      <div className="lp-wrapper">
        <div className="lp-card">
          {/* Logo header */}
          <div className="lp-logo-wrap">
            <div className="lp-logo-ring">
              <img src={iconxLogo} alt="iconX Mobile Store" className="lp-logo-img" />
            </div>
            <div className="lp-logo-tagline">Mobile Store</div>
            <h2 style={{ fontSize: 20, fontWeight: 700, marginTop: 12, color: 'var(--text)', fontFamily: 'var(--font)' }}>
              Reset Password
            </h2>
          </div>

          {/* Loader or Validation Error state */}
          {isValidating && (
            <div style={{ textAlign: 'center', padding: '30px 0', color: 'var(--muted)', fontSize: 14 }}>
              Verifying your reset link...
            </div>
          )}

          {!isValidating && validationError && (
            <div style={{ textAlign: 'center', padding: '10px 0' }}>
              <div className="lp-alert lp-alert-error" style={{ marginBottom: 20 }}>
                <AlertIcon /> {validationError}
              </div>
              <button className="lp-google-btn" style={{ width: '100%' }} onClick={() => navigate('/login')}>
                Back to Login
              </button>
            </div>
          )}

          {/* Actual Form */}
          {!isValidating && !validationError && (
            <>
              {error && (
                <div className="lp-alert lp-alert-error">
                  <AlertIcon /> {error}
                </div>
              )}

              {success ? (
                <div style={{ textAlign: 'center', padding: '10px 0' }}>
                  <div className="lp-alert lp-alert-success" style={{ marginBottom: 24 }}>
                    <CheckIcon /> Password reset successful!
                  </div>
                  <p style={{ color: 'var(--muted)', fontSize: 13, marginBottom: 24, lineHeight: 1.6 }}>
                    You can now sign in with your new password.
                  </p>
                  <button className="lp-google-btn" style={{ width: '100%', background: 'var(--green)', color: '#fff', border: 'none' }} onClick={() => navigate('/login')}>
                    Go to Login
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} noValidate>
                  <p style={{ color: 'var(--muted)', fontSize: 12, marginBottom: 18, textAlign: 'center' }}>
                    Resetting password for: <strong style={{ color: 'var(--text)' }}>{email}</strong>
                  </p>

                  {/* New Password */}
                  <div className="lp-field">
                    <label className="lp-label" htmlFor="new-password">New Password</label>
                    <div className="lp-input-wrap">
                      <span className="lp-input-icon"><LockIcon /></span>
                      <input
                        id="new-password"
                        className="lp-input"
                        type={showPw ? 'text' : 'password'}
                        placeholder="Min 8 characters, letter + number"
                        value={newPassword}
                        onChange={(e) => { setNewPassword(e.target.value); setError(''); }}
                      />
                      <button type="button" className="lp-eye-btn" onClick={() => setShowPw((p) => !p)}>
                        {showPw ? <EyeOff /> : <EyeOn />}
                      </button>
                    </div>
                  </div>

                  {/* Confirm Password */}
                  <div className="lp-field">
                    <label className="lp-label" htmlFor="confirm-password">Confirm Password</label>
                    <div className="lp-input-wrap">
                      <span className="lp-input-icon"><LockIcon /></span>
                      <input
                        id="confirm-password"
                        className="lp-input"
                        type={showConfirmPw ? 'text' : 'password'}
                        placeholder="Re-enter password"
                        value={confirmPassword}
                        onChange={(e) => { setConfirmPassword(e.target.value); setError(''); }}
                      />
                      <button type="button" className="lp-eye-btn" onClick={() => setShowConfirmPw((p) => !p)}>
                        {showConfirmPw ? <EyeOff /> : <EyeOn />}
                      </button>
                    </div>
                  </div>

                  <button className="lp-google-btn" style={{ width: '100%', marginTop: 12, background: 'var(--blue)', color: '#fff', border: 'none' }} type="submit" disabled={loading}>
                    {loading ? 'Resetting Password...' : 'Save New Password'}
                  </button>
                </form>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
