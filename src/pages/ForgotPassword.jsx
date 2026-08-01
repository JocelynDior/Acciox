import React, { useState, useRef, useEffect } from 'react';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../firebase';
import { Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';

// ---- Inline Styles ----
const pageStyle = {
  background: 'transparent',
  minHeight: '100vh',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '20px',
  fontFamily: "'Inter', system-ui, sans-serif",
};

const cardStyle = {
  background: 'rgba(255,255,255,0.08)',
  backdropFilter: 'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)',
  border: '1px solid rgba(255,255,255,0.15)',
  borderRadius: 20,
  padding: '40px 32px',
  maxWidth: 420,
  width: '100%',
  color: '#fff',
  boxShadow: '0 20px 50px rgba(0,0,0,0.4)',
  animation: 'fadeIn 0.7s ease forwards', // global fadeIn
  textAlign: 'center',
};

const logoStyle = {
  background: 'linear-gradient(to right, #c026d3, #e879f9)',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  backgroundClip: 'text',
  fontSize: '2.2rem',
  fontWeight: 800,
  marginBottom: 8,
};

const subtitleStyle = {
  color: 'rgba(255,255,255,0.6)',
  fontSize: '0.9rem',
  marginBottom: 28,
};

const iconCircle = {
  width: 64,
  height: 64,
  borderRadius: '50%',
  background: 'linear-gradient(135deg, #7e22ce, #c026d3)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  margin: '0 auto 24px',
  fontSize: '1.8rem',
};

const inputContainerStyle = {
  position: 'relative',
  marginBottom: 20,
};

const iconStyle = {
  position: 'absolute',
  left: 14,
  top: '50%',
  transform: 'translateY(-50%)',
  color: 'rgba(255,255,255,0.5)',
  fontSize: '1rem',
};

const inputStyle = {
  width: '100%',
  padding: '14px 14px 14px 42px',
  background: 'rgba(255,255,255,0.07)',
  border: '1px solid rgba(255,255,255,0.15)',
  borderRadius: 12,
  color: '#fff',
  fontSize: '0.95rem',
  outline: 'none',
  transition: 'border 0.2s',
  boxSizing: 'border-box',
  textAlign: 'left',
};

const btnStyle = {
  width: '100%',
  padding: '14px',
  background: 'linear-gradient(135deg, #7e22ce, #c026d3)',
  border: 'none',
  borderRadius: 12,
  color: '#fff',
  fontWeight: 600,
  fontSize: '1rem',
  cursor: 'pointer',
  transition: 'all 0.2s',
  boxShadow: '0 4px 15px rgba(192,38,211,0.3)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 8,
  marginTop: 8,
};

const btnDisabledStyle = {
  ...btnStyle,
  opacity: 0.6,
  cursor: 'not-allowed',
  boxShadow: 'none',
};

const linkText = {
  color: '#e879f9',
  textDecoration: 'none',
  fontSize: '0.9rem',
  display: 'inline-block',
  marginTop: 20,
};

const spinnerStyle = {
  width: 18,
  height: 18,
  borderRadius: '50%',
  border: '2px solid rgba(255,255,255,0.3)',
  borderTopColor: '#fff',
  animation: 'spin 0.7s linear infinite', // global spin
};

const successCheckStyle = {
  width: 64,
  height: 64,
  borderRadius: '50%',
  background: 'linear-gradient(135deg, #22c55e, #16a34a)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  margin: '0 auto 24px',
  fontSize: '2rem',
};

const sentMessageStyle = {
  color: 'rgba(255,255,255,0.8)',
  fontSize: '0.9rem',
  marginBottom: 24,
  lineHeight: 1.6,
};

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const timerRef = useRef(null);

  useEffect(() => {
    return () => clearInterval(timerRef.current);
  }, []);

  // Countdown timer for resend
  useEffect(() => {
    if (resendCooldown > 0) {
      timerRef.current = setInterval(() => {
        setResendCooldown((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [resendCooldown]);

  const handleSendReset = async (e) => {
    e.preventDefault();
    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail) {
      toast.error('Please enter your email address.');
      return;
    }
    // Basic email format check
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      toast.error('Please enter a valid email address.');
      return;
    }

    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, trimmedEmail);
      toast.success('Reset link sent! Check your inbox.');
      setSent(true);
      setResendCooldown(60); // 60 seconds cooldown for resend
    } catch (error) {
      if (error.code === 'auth/user-not-found') {
        toast.error('No account found with that email.');
      } else {
        toast.error('Failed to send reset email. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail) return;

    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, trimmedEmail);
      toast.success('Reset link resent!');
      setResendCooldown(60);
    } catch {
      toast.error('Could not resend. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={pageStyle}>
      <div style={cardStyle}>
        <h1 style={logoStyle}>Acciox</h1>
        {!sent ? (
          <>
            <p style={subtitleStyle}>Reset Your Password</p>
            <div style={iconCircle}>🔒</div>
            <p style={{ color: 'rgba(255,255,255,0.7)', marginBottom: 24, fontSize: '0.9rem' }}>
              Enter your email address and we'll send you a reset link.
            </p>
            <form onSubmit={handleSendReset}>
              <div style={inputContainerStyle}>
                <span style={iconStyle}>✉️</span>
                <input
                  type="email"
                  placeholder="Email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={inputStyle}
                  disabled={loading}
                  autoComplete="email"
                />
              </div>
              <button type="submit" style={loading ? btnDisabledStyle : btnStyle} disabled={loading}>
                {loading ? <div style={spinnerStyle} /> : null}
                {loading ? 'Sending…' : 'Send Reset Link'}
              </button>
            </form>
            <Link to="/login" style={linkText}>Back to Login</Link>
          </>
        ) : (
          <>
            <p style={subtitleStyle}>Check Your Email</p>
            <div style={successCheckStyle}>✅</div>
            <p style={sentMessageStyle}>
              We sent a password reset link to <strong>{email.trim().toLowerCase()}</strong>.<br />
              Check your inbox and spam folder.
            </p>
            <button
              onClick={handleResend}
              style={resendCooldown > 0 || loading ? btnDisabledStyle : btnStyle}
              disabled={resendCooldown > 0 || loading}
            >
              {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend Email'}
            </button>
            <Link to="/login" style={linkText}>Back to Login</Link>
          </>
        )}
      </div>
    </div>
  );
}
