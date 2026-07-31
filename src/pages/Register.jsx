import React, { useState } from 'react';
import { createUserWithEmailAndPassword, sendEmailVerification } from 'firebase/auth';
import { auth, db, doc, setDoc, serverTimestamp, collection, query, where, getDocs } from '../firebase';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';

const SERVER_URL = 'https://accioxserver.onrender.com';

// ---- Styles ----
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
  marginBottom: 24,
  textAlign: 'center',
};

const tabContainerStyle = {
  display: 'flex',
  borderRadius: 12,
  background: 'rgba(255,255,255,0.05)',
  padding: 4,
  marginBottom: 28,
  gap: 4,
};

const tabStyle = (active) => ({
  flex: 1,
  padding: '10px 6px',
  borderRadius: 10,
  border: 'none',
  cursor: 'pointer',
  fontWeight: 600,
  fontSize: '0.82rem',
  transition: 'all 0.2s',
  background: active ? 'linear-gradient(135deg, #7e22ce, #c026d3)' : 'transparent',
  color: active ? '#fff' : 'rgba(255,255,255,0.5)',
  boxShadow: active ? '0 4px 12px rgba(192,38,211,0.3)' : 'none',
});

const inputContainerStyle = {
  position: 'relative',
  marginBottom: 16,
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
  padding: '13px 14px 13px 42px',
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
  animation: 'spin 0.7s linear infinite',
};

const errorTextStyle = {
  color: '#ef4444',
  fontSize: '0.8rem',
  marginTop: 4,
};

function validatePassword(pwd) {
  return (
    pwd.length >= 8 &&
    /[A-Z]/.test(pwd) &&
    /[0-9]/.test(pwd) &&
    /[^A-Za-z0-9]/.test(pwd)
  );
}

// ---- Client Form ----
function ClientForm() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    fullName: '', username: '', email: '', companyName: '',
    password: '', confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const set = (field) => (e) => setForm((p) => ({ ...p, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!form.fullName.trim()) errs.fullName = 'Full name is required.';
    if (!form.username.trim()) errs.username = 'Username is required.';
    if (!form.email.trim()) errs.email = 'Email is required.';
    if (!form.companyName.trim()) errs.companyName = 'Company name is required.';
    if (!validatePassword(form.password)) errs.password = 'Min 8 chars, uppercase, number & special character.';
    if (form.password !== form.confirmPassword) errs.confirmPassword = 'Passwords do not match.';
    if (!agreeTerms) errs.terms = 'You must agree to Terms and Privacy Policy.';
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setLoading(true);
    setErrors({});
    try {
      const userCred = await createUserWithEmailAndPassword(auth, form.email.trim().toLowerCase(), form.password);
      await setDoc(doc(db, 'users', userCred.user.uid), {
        uid: userCred.user.uid,
        fullName: form.fullName.trim(),
        username: form.username.trim(),
        email: form.email.trim().toLowerCase(),
        companyName: form.companyName.trim(),
        role: 'client',
        status: 'unverified',
        createdAt: serverTimestamp(),
      });
      await sendEmailVerification(userCred.user);
      toast.success('Account created! Please login.');
      navigate('/login');
    } catch (err) {
      if (err.code === 'auth/email-already-in-use') toast.error('Email already in use.');
      else toast.error(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div style={inputContainerStyle}>
        <span style={iconStyle}>👤</span>
        <input placeholder="Full Name" value={form.fullName} onChange={set('fullName')} style={inputStyle} disabled={loading} />
        {errors.fullName && <p style={errorTextStyle}>{errors.fullName}</p>}
      </div>
      <div style={inputContainerStyle}>
        <span style={iconStyle}>🏷️</span>
        <input placeholder="Username" value={form.username} onChange={set('username')} style={inputStyle} disabled={loading} />
        {errors.username && <p style={errorTextStyle}>{errors.username}</p>}
      </div>
      <div style={inputContainerStyle}>
        <span style={iconStyle}>✉️</span>
        <input type="email" placeholder="Email address" value={form.email} onChange={set('email')} style={inputStyle} disabled={loading} />
        {errors.email && <p style={errorTextStyle}>{errors.email}</p>}
      </div>
      <div style={inputContainerStyle}>
        <span style={iconStyle}>🏢</span>
        <input placeholder="Company Name" value={form.companyName} onChange={set('companyName')} style={inputStyle} disabled={loading} />
        {errors.companyName && <p style={errorTextStyle}>{errors.companyName}</p>}
      </div>
      <div style={inputContainerStyle}>
        <span style={iconStyle}>🔒</span>
        <input type={showPassword ? 'text' : 'password'} placeholder="Password" value={form.password} onChange={set('password')} style={inputStyle} disabled={loading} />
        <button type="button" style={eyeIconStyle} onClick={() => setShowPassword(p => !p)} tabIndex={-1}>{showPassword ? '🙈' : '👁️'}</button>
        {errors.password && <p style={errorTextStyle}>{errors.password}</p>}
      </div>
      <div style={inputContainerStyle}>
        <span style={iconStyle}>🔒</span>
        <input type={showConfirm ? 'text' : 'password'} placeholder="Confirm Password" value={form.confirmPassword} onChange={set('confirmPassword')} style={inputStyle} disabled={loading} />
        <button type="button" style={eyeIconStyle} onClick={() => setShowConfirm(p => !p)} tabIndex={-1}>{showConfirm ? '🙈' : '👁️'}</button>
        {errors.confirmPassword && <p style={errorTextStyle}>{errors.confirmPassword}</p>}
      </div>
      <label style={checkboxLabelStyle}>
        <input type="checkbox" checked={agreeTerms} onChange={(e) => setAgreeTerms(e.target.checked)} disabled={loading} />
        <span>I agree to the <Link to="/terms" target="_blank" style={{ color: '#e879f9' }}>Terms of Service</Link> and <Link to="/privacy" target="_blank" style={{ color: '#e879f9' }}>Privacy Policy</Link></span>
      </label>
      {errors.terms && <p style={errorTextStyle}>{errors.terms}</p>}
      <button type="submit" style={loading ? btnDisabledStyle : btnStyle} disabled={loading}>
        {loading && <div style={spinnerStyle} />}
        {loading ? 'Creating Account…' : 'Create Account'}
      </button>
    </form>
  );
}

// ---- Accountant Form ----
function AccountantForm() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    fullName: '', username: '', email: '',
    password: '', confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const set = (field) => (e) => setForm((p) => ({ ...p, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!form.fullName.trim()) errs.fullName = 'Full name is required.';
    if (!form.username.trim()) errs.username = 'Username is required.';
    if (!form.email.trim()) errs.email = 'Email is required.';
    if (!validatePassword(form.password)) errs.password = 'Min 8 chars, uppercase, number & special character.';
    if (form.password !== form.confirmPassword) errs.confirmPassword = 'Passwords do not match.';
    if (!agreeTerms) errs.terms = 'You must agree to Terms and Privacy Policy.';
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setLoading(true);
    setErrors({});
    try {
      const userCred = await createUserWithEmailAndPassword(auth, form.email.trim().toLowerCase(), form.password);
      await setDoc(doc(db, 'users', userCred.user.uid), {
        uid: userCred.user.uid,
        fullName: form.fullName.trim(),
        username: form.username.trim(),
        email: form.email.trim().toLowerCase(),
        role: 'accountant',
        status: 'unverified',
        createdAt: serverTimestamp(),
      });
      await sendEmailVerification(userCred.user);
      toast.success('Account created! Please login.');
      navigate('/login');
    } catch (err) {
      if (err.code === 'auth/email-already-in-use') toast.error('Email already in use.');
      else toast.error(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div style={inputContainerStyle}>
        <span style={iconStyle}>👤</span>
        <input placeholder="Full Name" value={form.fullName} onChange={set('fullName')} style={inputStyle} disabled={loading} />
        {errors.fullName && <p style={errorTextStyle}>{errors.fullName}</p>}
      </div>
      <div style={inputContainerStyle}>
        <span style={iconStyle}>🏷️</span>
        <input placeholder="Username" value={form.username} onChange={set('username')} style={inputStyle} disabled={loading} />
        {errors.username && <p style={errorTextStyle}>{errors.username}</p>}
      </div>
      <div style={inputContainerStyle}>
        <span style={iconStyle}>✉️</span>
        <input type="email" placeholder="Email address" value={form.email} onChange={set('email')} style={inputStyle} disabled={loading} />
        {errors.email && <p style={errorTextStyle}>{errors.email}</p>}
      </div>
      <div style={inputContainerStyle}>
        <span style={iconStyle}>🔒</span>
        <input type={showPassword ? 'text' : 'password'} placeholder="Password" value={form.password} onChange={set('password')} style={inputStyle} disabled={loading} />
        <button type="button" style={eyeIconStyle} onClick={() => setShowPassword(p => !p)} tabIndex={-1}>{showPassword ? '🙈' : '👁️'}</button>
        {errors.password && <p style={errorTextStyle}>{errors.password}</p>}
      </div>
      <div style={inputContainerStyle}>
        <span style={iconStyle}>🔒</span>
        <input type={showConfirm ? 'text' : 'password'} placeholder="Confirm Password" value={form.confirmPassword} onChange={set('confirmPassword')} style={inputStyle} disabled={loading} />
        <button type="button" style={eyeIconStyle} onClick={() => setShowConfirm(p => !p)} tabIndex={-1}>{showConfirm ? '🙈' : '👁️'}</button>
        {errors.confirmPassword && <p style={errorTextStyle}>{errors.confirmPassword}</p>}
      </div>
      <label style={checkboxLabelStyle}>
        <input type="checkbox" checked={agreeTerms} onChange={(e) => setAgreeTerms(e.target.checked)} disabled={loading} />
        <span>I agree to the <Link to="/terms" target="_blank" style={{ color: '#e879f9' }}>Terms of Service</Link> and <Link to="/privacy" target="_blank" style={{ color: '#e879f9' }}>Privacy Policy</Link></span>
      </label>
      {errors.terms && <p style={errorTextStyle}>{errors.terms}</p>}
      <button type="submit" style={loading ? btnDisabledStyle : btnStyle} disabled={loading}>
        {loading && <div style={spinnerStyle} />}
        {loading ? 'Creating Account…' : 'Create Account'}
      </button>
    </form>
  );
}

// ---- Admin Form ----
function AdminForm() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    email: '', adminKey: '', password: '', confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showAdminKey, setShowAdminKey] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const set = (field) => (e) => setForm((p) => ({ ...p, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!form.email.trim()) errs.email = 'Email is required.';
    if (!form.adminKey.trim()) errs.adminKey = 'Admin key is required.';
    if (!validatePassword(form.password)) errs.password = 'Min 8 chars, uppercase, number & special character.';
    if (form.password !== form.confirmPassword) errs.confirmPassword = 'Passwords do not match.';
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setLoading(true);
    setErrors({});

    try {
      // 1. Verify admin key via Render backend
      const verifyRes = await fetch(`${SERVER_URL}/verify-admin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminKey: form.adminKey.trim() }),
      });
      const verifyData = await verifyRes.json();
      if (!verifyData.success) {
        setErrors({ adminKey: 'Invalid admin key.' });
        setLoading(false);
        return;
      }

      // 2. Check if admin already exists in Firestore
      const adminQuery = query(collection(db, 'users'), where('role', '==', 'admin'));
      const adminSnapshot = await getDocs(adminQuery);
      if (!adminSnapshot.empty) {
        toast.error('An admin account already exists.');
        setLoading(false);
        return;
      }

      // 3. Create admin account
      const userCred = await createUserWithEmailAndPassword(auth, form.email.trim().toLowerCase(), form.password);
      await setDoc(doc(db, 'users', userCred.user.uid), {
        uid: userCred.user.uid,
        email: form.email.trim().toLowerCase(),
        role: 'admin',
        status: 'active',
        createdAt: serverTimestamp(),
      });

      toast.success('Admin account created! Please login.');
      navigate('/login');
    } catch (err) {
      if (err.code === 'auth/email-already-in-use') toast.error('Email already in use.');
      else toast.error(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div style={inputContainerStyle}>
        <span style={iconStyle}>✉️</span>
        <input type="email" placeholder="Admin Email" value={form.email} onChange={set('email')} style={inputStyle} disabled={loading} />
        {errors.email && <p style={errorTextStyle}>{errors.email}</p>}
      </div>
      <div style={inputContainerStyle}>
        <span style={iconStyle}>🔑</span>
        <input type={showAdminKey ? 'text' : 'password'} placeholder="Admin Key" value={form.adminKey} onChange={set('adminKey')} style={inputStyle} disabled={loading} />
        <button type="button" style={eyeIconStyle} onClick={() => setShowAdminKey(p => !p)} tabIndex={-1}>{showAdminKey ? '🙈' : '👁️'}</button>
        {errors.adminKey && <p style={errorTextStyle}>{errors.adminKey}</p>}
      </div>
      <div style={inputContainerStyle}>
        <span style={iconStyle}>🔒</span>
        <input type={showPassword ? 'text' : 'password'} placeholder="Password" value={form.password} onChange={set('password')} style={inputStyle} disabled={loading} />
        <button type="button" style={eyeIconStyle} onClick={() => setShowPassword(p => !p)} tabIndex={-1}>{showPassword ? '🙈' : '👁️'}</button>
        {errors.password && <p style={errorTextStyle}>{errors.password}</p>}
      </div>
      <div style={inputContainerStyle}>
        <span style={iconStyle}>🔒</span>
        <input type={showConfirm ? 'text' : 'password'} placeholder="Confirm Password" value={form.confirmPassword} onChange={set('confirmPassword')} style={inputStyle} disabled={loading} />
        <button type="button" style={eyeIconStyle} onClick={() => setShowConfirm(p => !p)} tabIndex={-1}>{showConfirm ? '🙈' : '👁️'}</button>
        {errors.confirmPassword && <p style={errorTextStyle}>{errors.confirmPassword}</p>}
      </div>
      <button type="submit" style={loading ? btnDisabledStyle : btnStyle} disabled={loading}>
        {loading && <div style={spinnerStyle} />}
        {loading ? 'Verifying…' : 'Create Admin Account'}
      </button>
    </form>
  );
}

// ---- Main Register Page ----
export default function Register() {
  const [activeTab, setActiveTab] = useState('client');

  return (
    <div style={pageStyle}>
      <div style={cardStyle}>
        <h1 style={logoStyle}>Acciox</h1>
        <p style={subtitleStyle}>Create Your Account</p>

        {/* Tabs */}
        <div style={tabContainerStyle}>
          {['client', 'accountant', 'admin'].map((tab) => (
            <button
              key={tab}
              type="button"
              style={tabStyle(activeTab === tab)}
              onClick={() => setActiveTab(tab)}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {activeTab === 'client' && <ClientForm />}
        {activeTab === 'accountant' && <AccountantForm />}
        {activeTab === 'admin' && <AdminForm />}

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
