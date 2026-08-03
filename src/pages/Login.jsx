import React, { useState, useEffect, useRef } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { Link, useNavigate } from 'react-router-dom';
import { auth, db, doc, getDoc } from '../firebase';
import { toast } from 'react-hot-toast';

// ---- Inline Styles (unchanged) ----
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
  animation: 'fadeIn 0.7s ease forwards',
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
  animation: 'spin 0.7s linear infinite',
};

// ---- Rate limiting helpers ----
const getRateLimitKey = (email) => `rl_${email.toLowerCase()}`;

const getRateLimitData = (email) => {
  if (!email) return null;
  const raw = localStorage.getItem(getRateLimitKey(email));
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    // Validate shape
    if (
      typeof parsed.attempts === 'number' &&
      typeof parsed.lastFailure === 'number' &&
      typeof parsed.blockDuration === 'number'
    ) {
      return parsed;
    }
  } catch (e) {
    // ignore corrupt data
  }
  return null;
};

const saveRateLimitData = (email, data) => {
  localStorage.setItem(getRateLimitKey(email), JSON.stringify(data));
};

const clearRateLimitData = (email) => {
  localStorage.removeItem(getRateLimitKey(email));
};

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);

  // Rate limiting state
  const [rateLimit, setRateLimit] = useState(null); // { attempts, lastFailure, blockDuration }
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const intervalRef = useRef(null);

  // Derive blocked status and blockedUntil from rateLimit
  const isBlocked =
    rateLimit &&
    rateLimit.attempts >= 10 &&
    Date.now() < rateLimit.lastFailure + rateLimit.blockDuration;

  const blockedUntil =
    isBlocked ? rateLimit.lastFailure + rateLimit.blockDuration : null;

  // Load rate limit data when email changes
  useEffect(() => {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed) {
      setRateLimit(null);
      return;
    }
    const data = getRateLimitData(trimmed);
    setRateLimit(data);
  }, [email]);

  // Countdown timer when blocked
  useEffect(() => {
    if (isBlocked && blockedUntil) {
      const updateRemaining = () => {
        const now = Date.now();
        const diff = Math.max(0, Math.ceil((blockedUntil - now) / 1000));
        setRemainingSeconds(diff);
      };
      updateRemaining();
      intervalRef.current = setInterval(updateRemaining, 1000);
      return () => {
        clearInterval(intervalRef.current);
      };
    } else {
      setRemainingSeconds(0);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }
  }, [isBlocked, blockedUntil]);

  const formatCountdown = (totalSeconds) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail || !password) {
      toast.error('Please enter email and password.');
      return;
    }

    if (isBlocked) {
      // Already blocked, don't allow submission
      return;
    }

    setLoading(true);
    try {
      const userCred = await signInWithEmailAndPassword(auth, trimmedEmail, password);
      // Successful login – clear rate limit for this email
      clearRateLimitData(trimmedEmail);
      setRateLimit(null);

      // Fetch user role and status from Firestore
      const userDoc = await getDoc(doc(db, 'users', userCred.user.uid));
      if (userDoc.exists()) {
        const { role, status } = userDoc.data();
        switch (role) {
          case 'admin':
            navigate('/admin', { replace: true });
            break;
          case 'accountant':
          case 'agent':
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
        navigate('/', { replace: true });
      }
    } catch (error) {
      // Update rate limit on failure
      const existing = getRateLimitData(trimmedEmail) || { attempts: 0, lastFailure: 0, blockDuration: 60000 };
      const newAttempts = existing.attempts + 1;
      let newBlockDuration = existing.blockDuration;

      if (newAttempts === 10) {
        // First time reaching 10 attempts → start with 1 minute
        newBlockDuration = 60000;
      } else if (newAttempts > 10 && existing.attempts >= 10) {
        // Already blocked before, and block has expired (they waited and tried again)
        if (Date.now() > existing.lastFailure + existing.blockDuration) {
          newBlockDuration = existing.blockDuration * 2;
        }
        // If still in the previous block period, don't double (they shouldn't be able to submit,
        // but just in case they bypass frontend, keep same blockDuration)
      }

      const newData = {
        attempts: newAttempts,
        lastFailure: Date.now(),
        blockDuration: newBlockDuration,
      };
      saveRateLimitData(trimmedEmail, newData);
      setRateLimit(newData);

      toast.error(
        error.code === 'auth/wrong-password' || error.code === 'auth/user-not-found'
          ? 'Invalid email or password.'
          : error.message
      );
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
              disabled={loading || isBlocked}
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
              disabled={loading || isBlocked}
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
              disabled={loading || isBlocked}
            />
            Remember me
          </label>

          {/* Rate limit countdown */}
          {isBlocked && (
            <div style={{ color: '#ef4444', fontSize: '0.9rem', marginBottom: 16, textAlign: 'center' }}>
              Too many attempts. Try again in {formatCountdown(remainingSeconds)}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            style={loading || isBlocked ? btnDisabledStyle : btnStyle}
            disabled={loading || isBlocked}
          >
            {loading ? <div style={spinnerStyle} /> : null}
            {loading ? 'Signing in…' : isBlocked ? 'Too many attempts' : 'Sign In'}
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
