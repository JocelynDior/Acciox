import React, { useState, useEffect } from 'react';
import { db, auth, doc, updateDoc, onSnapshot, addDoc, collection, serverTimestamp } from '../firebase';
import { updatePassword, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-hot-toast';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import { FiUser, FiLock, FiGlobe, FiBriefcase, FiSettings, FiEye, FiEyeOff } from 'react-icons/fi';

const pageWrapper = {
  background: 'linear-gradient(135deg, #0f0a1a 0%, #1a0f2e 50%, #2d1b4e 100%)',
  minHeight: '100vh', display: 'flex',
  fontFamily: "'Inter', system-ui, sans-serif",
};
const card = {
  background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.15)',
  borderRadius: 16, padding: 24, color: '#fff', marginBottom: 24,
};
const gradientTitle = {
  background: 'linear-gradient(to right, #c026d3, #e879f9)',
  WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
  backgroundClip: 'text', fontWeight: 700,
};
const inputStyle = {
  width: '100%', padding: '12px', background: 'rgba(255,255,255,0.07)',
  border: '1px solid rgba(255,255,255,0.15)', borderRadius: 10, color: '#fff',
  outline: 'none', marginBottom: 12, boxSizing: 'border-box', fontSize: '0.95rem',
};
const btnStyle = {
  background: 'linear-gradient(135deg, #7e22ce, #c026d3)', border: 'none',
  borderRadius: 12, color: '#fff', padding: '12px 24px', fontWeight: 600,
  cursor: 'pointer', marginTop: 8,
};
const langBtn = (active) => ({
  display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px',
  borderRadius: 12, border: active ? '2px solid #c026d3' : '1px solid rgba(255,255,255,0.15)',
  background: active ? 'rgba(192,38,211,0.15)' : 'rgba(255,255,255,0.05)',
  color: '#fff', cursor: 'pointer', fontSize: '0.9rem', fontWeight: active ? 600 : 400,
});

const LANGUAGES = [
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'es', label: 'Español', flag: '🇪🇸' },
  { code: 'fr', label: 'Français', flag: '🇫🇷' },
  { code: 'it', label: 'Italiano', flag: '🇮🇹' },
];

function getStrength(pwd) {
  let score = 0;
  if (pwd.length >= 8) score++;
  if (/[A-Z]/.test(pwd)) score++;
  if (/[0-9]/.test(pwd)) score++;
  if (/[^A-Za-z0-9]/.test(pwd)) score++;
  if (score <= 2) return { label: 'Weak', color: '#ef4444', width: 33 };
  if (score === 3) return { label: 'Medium', color: '#f59e0b', width: 66 };
  return { label: 'Strong', color: '#22c55e', width: 100 };
}

export default function Settings() {
  const { currentUser, userRole } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  // Profile state
  const [profile, setProfile] = useState({ fullName: '', username: '', email: '', companyName: '' });

  // Password state
  const [pw, setPw] = useState({ current: '', new: '', confirm: '' });
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [loadingPw, setLoadingPw] = useState(false);

  // Language state
  const [language, setLanguage] = useState('en');

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (!currentUser) return;
    const unsub = onSnapshot(doc(db, 'users', currentUser.uid), (snap) => {
      if (snap.exists()) {
        const d = snap.data();
        setProfile({
          fullName: d.fullName || '',
          username: d.username || '',
          email: d.email || currentUser.email || '',
          companyName: d.companyName || '',
        });
        setLanguage(d.language || 'en');
      }
    });
    return () => unsub();
  }, [currentUser]);

  const mainContent = {
    marginLeft: isMobile ? 0 : 260,
    paddingTop: 80,
    padding: isMobile ? '80px 16px 40px' : '80px 24px 40px',
    flex: 1,
  };

  const handleSaveProfile = async () => {
    if (!profile.fullName.trim()) return toast.error('Full name is required.');
    try {
      const updates = {
        fullName: profile.fullName.trim(),
        username: profile.username.trim(),
      };
      if (userRole === 'client') {
        updates.companyName = profile.companyName.trim();
      }
      await updateDoc(doc(db, 'users', currentUser.uid), updates);
      toast.success('Profile updated!');
    } catch (err) {
      toast.error(err.message || 'Failed to update profile');
    }
  };

  const handleChangePassword = async () => {
    if (!pw.current) return toast.error('Enter your current password.');
    if (pw.new !== pw.confirm) return toast.error('Passwords do not match.');
    const strength = getStrength(pw.new);
    if (strength.label === 'Weak') return toast.error('Password too weak.');
    setLoadingPw(true);
    try {
      const cred = EmailAuthProvider.credential(currentUser.email, pw.current);
      await reauthenticateWithCredential(currentUser, cred);
      await updatePassword(currentUser, pw.new);
      toast.success('Password updated!');
      setPw({ current: '', new: '', confirm: '' });
    } catch (err) {
      toast.error(err.message || 'Failed to update password');
    } finally {
      setLoadingPw(false);
    }
  };

  const handleSaveLanguage = async (code) => {
    setLanguage(code);
    try {
      await updateDoc(doc(db, 'users', currentUser.uid), { language: code });
      toast.success('Language updated!');
    } catch (err) {
      toast.error('Failed to save language');
    }
  };

  const pwStrength = getStrength(pw.new);

  return (
    <>
      <Navbar onMenuClick={() => setSidebarOpen(prev => !prev)} />
      <div style={pageWrapper}>
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <main style={mainContent}>
          <h1 style={{ ...gradientTitle, fontSize: '1.8rem', display: 'flex', alignItems: 'center', gap: 10, marginBottom: 28 }}>
            <FiSettings /> Settings
          </h1>

          {/* Profile */}
          <div style={card}>
            <h2 style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
              <FiUser /> Profile
            </h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
              <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'linear-gradient(135deg, #7e22ce, #c026d3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.8rem', fontWeight: 700, color: '#fff', flexShrink: 0 }}>
                {profile.fullName?.charAt(0)?.toUpperCase() || '?'}
              </div>
              <div>
                <p style={{ color: 'rgba(255,255,255,0.7)', margin: 0 }}>{profile.email}</p>
                <span style={{ background: '#7e22ce', color: '#fff', padding: '2px 10px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase' }}>{userRole}</span>
              </div>
            </div>
            <label style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem' }}>Full Name</label>
            <input value={profile.fullName} onChange={e => setProfile(p => ({ ...p, fullName: e.target.value }))} style={inputStyle} placeholder="Full Name" />
            <label style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem' }}>Username</label>
            <input value={profile.username} onChange={e => setProfile(p => ({ ...p, username: e.target.value }))} style={inputStyle} placeholder="Username" />
            {userRole === 'client' && (
              <>
                <label style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem' }}>Company Name</label>
                <input value={profile.companyName} onChange={e => setProfile(p => ({ ...p, companyName: e.target.value }))} style={inputStyle} placeholder="Company Name" />
              </>
            )}
            <button onClick={handleSaveProfile} style={btnStyle}>Save Profile</button>
          </div>

          {/* Change Password */}
          <div style={card}>
            <h2 style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
              <FiLock /> Change Password
            </h2>
            <label style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem' }}>Current Password</label>
            <div style={{ position: 'relative' }}>
              <input type={showCurrent ? 'text' : 'password'} placeholder="Current Password" value={pw.current} onChange={e => setPw(p => ({ ...p, current: e.target.value }))} style={inputStyle} />
              <button onClick={() => setShowCurrent(p => !p)} style={{ position: 'absolute', right: 12, top: 10, background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer' }}>
                {showCurrent ? <FiEyeOff /> : <FiEye />}
              </button>
            </div>
            <label style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem' }}>New Password</label>
            <div style={{ position: 'relative' }}>
              <input type={showNew ? 'text' : 'password'} placeholder="New Password" value={pw.new} onChange={e => setPw(p => ({ ...p, new: e.target.value }))} style={inputStyle} />
              <button onClick={() => setShowNew(p => !p)} style={{ position: 'absolute', right: 12, top: 10, background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer' }}>
                {showNew ? <FiEyeOff /> : <FiEye />}
              </button>
            </div>
            {pw.new && (
              <div style={{ marginBottom: 12 }}>
                <div style={{ height: 6, borderRadius: 3, background: pwStrength.color, width: pwStrength.width + '%', transition: 'width 0.3s' }} />
                <small style={{ color: pwStrength.color }}>{pwStrength.label}</small>
              </div>
            )}
            <label style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem' }}>Confirm New Password</label>
            <input type="password" placeholder="Confirm New Password" value={pw.confirm} onChange={e => setPw(p => ({ ...p, confirm: e.target.value }))} style={inputStyle} />
            <button onClick={handleChangePassword} disabled={loadingPw} style={{ ...btnStyle, opacity: loadingPw ? 0.6 : 1 }}>
              {loadingPw ? 'Updating…' : 'Update Password'}
            </button>
          </div>

          {/* Language */}
          <div style={card}>
            <h2 style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
              <FiGlobe /> Language
            </h2>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              {LANGUAGES.map(lang => (
                <button key={lang.code} style={langBtn(language === lang.code)} onClick={() => handleSaveLanguage(lang.code)}>
                  <span style={{ fontSize: '1.4rem' }}>{lang.flag}</span>
                  {lang.label}
                </button>
              ))}
            </div>
          </div>

          {/* Admin only: Platform Settings */}
          {userRole === 'admin' && (
            <div style={card}>
              <h2 style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
                <FiSettings /> Platform Settings
              </h2>
              <p style={{ color: 'rgba(255,255,255,0.6)' }}>Session timeout, email verification, and platform configuration options will appear here.</p>
            </div>
          )}

          {/* Client only: App Plugins */}
          {userRole === 'client' && (
            <div style={card}>
              <h2 style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
                <FiBriefcase /> App Plugins
              </h2>
              <p style={{ color: 'rgba(255,255,255,0.6)', marginBottom: 16 }}>Connect your accounting software to sync data automatically.</p>
              <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 12, padding: 20, flex: 1, minWidth: 200 }}>
                  <div style={{ fontSize: '1.5rem', marginBottom: 8 }}>📊</div>
                  <strong>Xero</strong>
                  <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem', margin: '8px 0' }}>Sync your Xero accounting data</p>
                  <button style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 8, color: '#fff', padding: '8px 16px', cursor: 'pointer' }} onClick={() => toast('Xero integration coming soon!')}>
                    Connect Xero
                  </button>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 12, padding: 20, flex: 1, minWidth: 200 }}>
                  <div style={{ fontSize: '1.5rem', marginBottom: 8 }}>📗</div>
                  <strong>QuickBooks</strong>
                  <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem', margin: '8px 0' }}>Sync your QuickBooks data</p>
                  <button style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 8, color: '#fff', padding: '8px 16px', cursor: 'pointer' }} onClick={() => toast('QuickBooks integration coming soon!')}>
                    Connect QuickBooks
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* About */}
          <div style={card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ ...gradientTitle, fontSize: '1.2rem' }}>Acciox</span>
              <span style={{ color: 'rgba(255,255,255,0.6)' }}>v1.0</span>
            </div>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem', marginTop: 8 }}>AI-Powered Finance Platform</p>
            <div style={{ marginTop: 8, display: 'flex', gap: 16 }}>
              <a href="/terms" style={{ color: '#e879f9', textDecoration: 'none' }}>Terms</a>
              <a href="/privacy" style={{ color: '#e879f9', textDecoration: 'none' }}>Privacy</a>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
