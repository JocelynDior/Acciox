import React, { useState, useEffect, useRef } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { Link, useNavigate } from 'react-router-dom';
import { auth, db, doc, getDoc } from '../firebase';
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
};

const logoStyle = {
  background: 'linear-gradient(to right, #c026d3, #e879f9)',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  backgroundClip: 'text',
  fontSize: '2.2rem',
  fontWeight: 800,
  marginBottom: 4,
  textAlign: 'center',
};

const subtitleStyle = {
  color: 'rgba(255,255,255,0.6)',
  fontSize: '0.9rem',
  marginBottom: 32,
  textAlign: 'center',
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
};

const eyeIconStyle = {
  position: 'absolute',
  right: 14,
  top: '50%',
  transform: 'translateY(-50%)',
  background: 'none',
  border: 'none',
  color: 'rgba(255,255,255,0.5)',
  cursor: 'pointer',
  fontSize: '0.9rem',
};

const checkboxContainerStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  marginBottom: 20,
  fontSize: '0.85rem',
  color: 'rgba(255,255,255,0.7)',
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
};

const btnDisabledStyle = {
  ...btnStyle,
  opacity: 0.6,
  cursor: 'not-allowed',
  boxShadow: 'none',
};

const linksContainerStyle = {
  marginTop: 24,
  display: 'flex',
  justifyContent: 'space-between',
  fontSize: '0.85rem',
};

const dividerStyle = {
  display: 'flex',
  alignItems: 'center',
  margin: '24px 0',
  color: 'rgba(255,255,255,0.4)',
  fontSize: '0.8rem',
};

const footerLinksStyle = {
  marginTop: 20,
  textAlign: 'center',
  fontSize: '0.75rem',
  color: 'rgba(255,255,255,0.4)',
  display: 'flex',
  justifyContent: 'center',
  gap: 16,
};

const spinnerStyle = {
  width: 18,
  height: 18,
  borderRadius: '50%',
  border: '2px solid rgba(255,255,255,0.3)',
  borderTopColor: '#fff',
  animation: 'spin 0.7s linear infinite', // global spin
};

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const tooManyAttempts = attempts >= 5;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (tooManyAttempts) {
      toast.error('Too many attempts. Please try again later.');
      return;
    }

    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail || !password) {
      toast.error('Please enter email and password.');
      return;
    }

    setLoading(true);
    try {
      const userCred = await signInWithEmailAndPassword(auth, trimmedEmail, password);
      // Fetch user role and status from Firestore
      const userDoc = await getDoc(doc(db, 'users', userCred.user.uid));
      if (userDoc.exists()) {
        const { role, status } = userDoc.data();
        switch (role) {
          case 'admin':
            navigate('/admin', { replace: true });
            break;
          case 'accountant':
            navigate('/accountant', { replace: true });
            break;
          case 'client':
            if (status === 'unverified') navigate('/not-activated', { replace: true });
            else navigate('/client', { replace: true });
            break;
          default:
            navigate('/', { replace: true });
        }
      } else {
        // Fallback if user doc missing
        navigate('/', { replace: true });
      }
      setAttempts(0); // reset attempts on success
    } catch (error) {
      setAttempts((prev) => prev + 1);
      const remaining = 5 - (attempts + 1);
      if (remaining <= 0) {
        toast.error('Too many attempts. Please try again later.');
      } else {
        const msg =
          error.code === 'auth/wrong-password' || error.code === 'auth/user-not-found'
            ? `Invalid email or password. ${remaining} attempts left.`
            : error.message;
        toast.error(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={pageStyle}>
      <div style={cardStyle}>
        <h1 style={logoStyle}>Acciox</h1>
        <p style={subtitleStyle}>AI-Powered Finance Platform</p>

        <form onSubmit={handleSubmit}>
          {/* Email */}
          <div style={inputContainerStyle}>
            <span style={iconStyle}>✉️</span>
            <input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={inputStyle}
              disabled={loading || tooManyAttempts}
              autoComplete="email"
            />
          </div>

          {/* Password */}
          <div style={inputContainerStyle}>
            <span style={iconStyle}>🔒</span>
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={inputStyle}
              disabled={loading || tooManyAttempts}
              autoComplete="current-password"
            />
            <button
              type="button"
              style={eyeIconStyle}
              onClick={() => setShowPassword((prev) => !prev)}
              tabIndex={-1}
            >
              {showPassword ? '🙈' : '👁️'}
            </button>
          </div>

          {/* Remember me */}
          <label style={checkboxContainerStyle}>
            <input
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
              disabled={loading || tooManyAttempts}
            />
            Remember me
          </label>

          {/* Submit */}
          <button
            type="submit"
            style={loading || tooManyAttempts ? btnDisabledStyle : btnStyle}
            disabled={loading || tooManyAttempts}
          >
            {loading ? <div style={spinnerStyle} /> : null}
            {loading ? 'Signing in…' : tooManyAttempts ? 'Too many attempts' : 'Sign In'}
          </button>
        </form>

        <div style={linksContainerStyle}>
          <Link to="/forgot-password" style={{ color: '#e879f9', textDecoration: 'none' }}>
            Forgot Password?
          </Link>
          <Link to="/register" style={{ color: '#e879f9', textDecoration: 'none' }}>
            Create account
          </Link>
        </div>

        <div style={dividerStyle}>
          <span style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.15)' }} />
          <span style={{ padding: '0 12px' }}>or</span>
          <span style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.15)' }} />
        </div>

        <div style={footerLinksStyle}>
          <Link to="/terms" style={{ color: 'rgba(255,255,255,0.4)', textDecoration: 'none' }}>
            Terms
          </Link>
          <Link to="/privacy" style={{ color: 'rgba(255,255,255,0.4)', textDecoration: 'none' }}>
            Privacy
          </Link>
        </div>
      </div>
    </div>
  );
}
