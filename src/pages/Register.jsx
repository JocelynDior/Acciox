import React, { useState, useEffect } from 'react';
import { createUserWithEmailAndPassword, sendEmailVerification } from 'firebase/auth';
import { auth, db, doc, setDoc, serverTimestamp } from '../firebase';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';

// ---- Inline Styles ----
const pageStyle = {
  background: 'linear-gradient(135deg, #0f0a1a 0%, #1a0f2e 50%, #2d1b4e 100%)',
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
  maxWidth: 480,
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

const selectStyle = {
  ...inputStyle,
  appearance: 'none',
  cursor: 'pointer',
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

const checkboxLabelStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  marginBottom: 20,
  fontSize: '0.85rem',
  color: 'rgba(255,255,255,0.7)',
  lineHeight: 1.4,
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

const loginLinkStyle = {
  marginTop: 24,
  textAlign: 'center',
  fontSize: '0.85rem',
  color: 'rgba(255,255,255,0.7)',
};

const spinnerStyle = {
  width: 18,
  height: 18,
  borderRadius: '50%',
  border: '2px solid rgba(255,255,255,0.3)',
  borderTopColor: '#fff',
  animation: 'spin 0.7s linear infinite', // global spin
};

const errorTextStyle = {
  color: '#ef4444',
  fontSize: '0.8rem',
  marginBottom: 12,
};

// Password validation
function validatePassword(pwd) {
  const minLength = 8;
  const hasUpper = /[A-Z]/.test(pwd);
  const hasNumber = /[0-9]/.test(pwd);
  const hasSpecial = /[^A-Za-z0-9]/.test(pwd);
  return pwd.length >= minLength && hasUpper && hasNumber && hasSpecial;
}

export default function Register() {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('client');
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const sanitize = (str) => str.trim();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};

    // Sanitize inputs
    const sanitizedFullName = sanitize(fullName);
    const sanitizedEmail = email.trim().toLowerCase();
    const sanitizedCompany = sanitize(companyName);

    if (!sanitizedFullName) newErrors.fullName = 'Full name is required.';
    if (!sanitizedEmail) newErrors.email = 'Email is required.';
    if (!sanitizedCompany) newErrors.companyName = 'Company name is required.';
    if (!validatePassword(password)) {
      newErrors.password =
        'Password must be at least 8 characters with uppercase, number, and special character.';
    }
    if (password !== confirmPassword) newErrors.confirmPassword = 'Passwords do not match.';
    if (!agreeTerms) newErrors.terms = 'You must agree to the Terms and Privacy Policy.';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Never allow admin or accountant role from this form
    const userRole = 'client';

    setLoading(true);
    setErrors({});

    try {
      const userCred = await createUserWithEmailAndPassword(auth, sanitizedEmail, password);
      const user = userCred.user;

      // Create user document
      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        fullName: sanitizedFullName,
        email: sanitizedEmail,
        companyName: sanitizedCompany,
        role: userRole,
        status: 'unverified',
        createdAt: serverTimestamp(),
      });

      // Send email verification
      await sendEmailVerification(user);

      toast.success('Account created! Awaiting admin verification.');
      navigate('/not-activated');
    } catch (error) {
      if (error.code === 'auth/email-already-in-use') {
        toast.error('An account with this email already exists.');
      } else if (error.code === 'auth/weak-password') {
        toast.error('Password is too weak. Please use a stronger password.');
      } else {
        toast.error(error.message || 'Registration failed.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={pageStyle}>
      <div style={cardStyle}>
        <h1 style={logoStyle}>Acciox</h1>
        <p style={subtitleStyle}>Create Your Account</p>

        <form onSubmit={handleSubmit}>
          {/* Full Name */}
          <div style={inputContainerStyle}>
            <span style={iconStyle}>👤</span>
            <input
              type="text"
              placeholder="Full Name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              style={inputStyle}
              disabled={loading}
            />
            {errors.fullName && <p style={errorTextStyle}>{errors.fullName}</p>}
          </div>

          {/* Email */}
          <div style={inputContainerStyle}>
            <span style={iconStyle}>✉️</span>
            <input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={inputStyle}
              disabled={loading}
            />
            {errors.email && <p style={errorTextStyle}>{errors.email}</p>}
          </div>

          {/* Company Name */}
          <div style={inputContainerStyle}>
            <span style={iconStyle}>🏢</span>
            <input
              type="text"
              placeholder="Company Name"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              style={inputStyle}
              disabled={loading}
            />
            {errors.companyName && <p style={errorTextStyle}>{errors.companyName}</p>}
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
              disabled={loading}
            />
            <button
              type="button"
              style={eyeIconStyle}
              onClick={() => setShowPassword((prev) => !prev)}
              tabIndex={-1}
            >
              {showPassword ? '🙈' : '👁️'}
            </button>
            {errors.password && <p style={errorTextStyle}>{errors.password}</p>}
          </div>

          {/* Confirm Password */}
          <div style={inputContainerStyle}>
            <span style={iconStyle}>🔒</span>
            <input
              type={showConfirm ? 'text' : 'password'}
              placeholder="Confirm Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              style={inputStyle}
              disabled={loading}
            />
            <button
              type="button"
              style={eyeIconStyle}
              onClick={() => setShowConfirm((prev) => !prev)}
              tabIndex={-1}
            >
              {showConfirm ? '🙈' : '👁️'}
            </button>
            {errors.confirmPassword && <p style={errorTextStyle}>{errors.confirmPassword}</p>}
          </div>

          {/* Role selector – client only */}
          <div style={inputContainerStyle}>
            <span style={iconStyle}>🛡️</span>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              style={selectStyle}
              disabled={loading}
            >
              <option value="client">Client</option>
            </select>
            <small style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.7rem', display: 'block', marginTop: 4 }}>
              (Admin & Accountant accounts created by platform admin)
            </small>
          </div>

          {/* Terms checkbox */}
          <label style={checkboxLabelStyle}>
            <input
              type="checkbox"
              checked={agreeTerms}
              onChange={(e) => setAgreeTerms(e.target.checked)}
              disabled={loading}
            />
            <span>
              I agree to the{' '}
              <Link to="/terms" target="_blank" style={{ color: '#e879f9' }}>
                Terms of Service
              </Link>{' '}
              and{' '}
              <Link to="/privacy" target="_blank" style={{ color: '#e879f9' }}>
                Privacy Policy
              </Link>
            </span>
          </label>
          {errors.terms && <p style={errorTextStyle}>{errors.terms}</p>}

          {/* Submit */}
          <button type="submit" style={loading ? btnDisabledStyle : btnStyle} disabled={loading}>
            {loading ? <div style={spinnerStyle} /> : null}
            {loading ? 'Creating Account…' : 'Create Account'}
          </button>
        </form>

        <div style={loginLinkStyle}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: '#e879f9', textDecoration: 'none' }}>
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
