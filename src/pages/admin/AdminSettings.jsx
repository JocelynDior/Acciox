import React, { useState, useEffect } from 'react';
import {
  db, auth, doc, updateDoc, collection, addDoc, serverTimestamp, onSnapshot,
} from '../../firebase';
import {
  updatePassword, updateEmail, reauthenticateWithCredential, EmailAuthProvider,
} from 'firebase/auth';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-hot-toast';
import Navbar from '../../components/Navbar';
import Sidebar from '../../components/Sidebar';
import {
  FiUser, FiLock, FiSettings, FiAlertTriangle, FiInfo, FiEdit, FiEye, FiEyeOff,
} from 'react-icons/fi';

// ---- Inline Styles ----
const pageWrapper = {
  background: 'linear-gradient(135deg, #0f0a1a 0%, #1a0f2e 50%, #2d1b4e 100%)',
  minHeight: '100vh', display: 'flex',
  fontFamily: "'Inter', system-ui, sans-serif",
};
const mainContent = { marginLeft: 260, paddingTop: 80, padding: '80px 24px 40px', flex: 1 };
const mobileMain = { ...mainContent, marginLeft: 0 };
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
  outline: 'none', marginBottom: 12,
};
const toggleContainer = {
  display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12,
};
const toggleSwitch = (active) => ({
  width: 48, height: 26, borderRadius: 13, background: active ? '#c026d3' : 'rgba(255,255,255,0.2)',
  position: 'relative', cursor: 'pointer', transition: 'background 0.2s',
  border: 'none', outline: 'none',
});
const toggleKnob = (active) => ({
  position: 'absolute', top: 2, left: active ? 24 : 2,
  width: 22, height: 22, borderRadius: '50%', background: '#fff',
  transition: 'left 0.2s',
});

export default function AdminSettings() {
  const { currentUser } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [profile, setProfile] = useState({ fullName: '', email: '' });
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [platformSettings, setPlatformSettings] = useState({
    sessionTimeout: 30,
    requireEmailVerification: true,
    autoNotifyAdmin: true,
  });
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [loadingPw, setLoadingPw] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Fetch current user data
  useEffect(() => {
    if (!currentUser) return;
    const unsub = onSnapshot(doc(db, 'users', currentUser.uid), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setProfile({ fullName: data.fullName || '', email: data.email || currentUser.email });
      }
    });
    return () => unsub();
  }, [currentUser]);

  // Fetch platform settings (if exists)
  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'settings', 'platform'), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setPlatformSettings({
          sessionTimeout: data.sessionTimeout || 30,
          requireEmailVerification: data.requireEmailVerification !== false,
          autoNotifyAdmin: data.autoNotifyAdmin !== false,
        });
      }
    });
    return () => unsub();
  }, []);

  const logAudit = async (action) => {
    try {
      await addDoc(collection(db, 'auditLogs'), {
        action,
        performedBy: currentUser?.email || 'admin',
        timestamp: serverTimestamp(),
      });
    } catch (e) { console.error('Audit log failed', e); }
  };

  // Password strength indicator
  const getStrength = (pwd) => {
    let score = 0;
    if (pwd.length >= 8) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;
    if (score <= 2) return { label: 'Weak', color: '#ef4444' };
    if (score === 3) return { label: 'Medium', color: '#f59e0b' };
    return { label: 'Strong', color: '#22c55e' };
  };
  const pwStrength = getStrength(newPw);

  // Calculate width percentage for password strength bar – using plain concatenation
  const strengthWidth = (() => {
    if (newPw.length >= 8) {
      if (pwStrength.label === 'Strong') return 100;
      if (pwStrength.label === 'Medium') return 66;
      return 33;
    }
    return 10;
  })();

  // Profile update
  const handleProfileUpdate = async () => {
    if (!profile.fullName.trim()) return toast.error('Name cannot be empty.');
    setLoadingProfile(true);
    try {
      await updateDoc(doc(db, 'users', currentUser.uid), { fullName: profile.fullName.trim() });
      if (profile.email !== currentUser.email) {
        const credential = EmailAuthProvider.credential(currentUser.email, currentPw);
        await reauthenticateWithCredential(currentUser, credential);
        await updateEmail(currentUser, profile.email.trim().toLowerCase());
        await updateDoc(doc(db, 'users', currentUser.uid), { email: profile.email.trim().toLowerCase() });
      }
      toast.success('Profile updated');
      logAudit('UPDATE_PROFILE');
    } catch (err) {
      toast.error(err.message || 'Failed to update profile');
    } finally { setLoadingProfile(false); }
  };

  // Change password
  const handlePasswordChange = async () => {
    if (!currentPw) return toast.error('Current password required.');
    if (newPw !== confirmPw) return toast.error('Passwords do not match.');
    if (pwStrength.label === 'Weak') return toast.error('Password too weak.');
    setLoadingPw(true);
    try {
      const credential = EmailAuthProvider.credential(currentUser.email, currentPw);
      await reauthenticateWithCredential(currentUser, credential);
      await updatePassword(currentUser, newPw);
      toast.success('Password updated');
      setCurrentPw(''); setNewPw(''); setConfirmPw('');
      logAudit('CHANGE_PASSWORD');
    } catch (err) {
      toast.error(err.message || 'Failed to update password');
    } finally { setLoadingPw(false); }
  };

  // Save platform settings
  const handleSavePlatformSettings = async () => {
    try {
      await setDoc(doc(db, 'settings', 'platform'), platformSettings);
      toast.success('Platform settings saved');
      logAudit('UPDATE_PLATFORM_SETTINGS');
    } catch (err) {
      toast.error(err.message);
    }
  };

  // Danger zone actions
  const handleExportData = () => {
    toast('Data export will be available soon.', { icon: '🚧' });
    logAudit('EXPORT_DATA_REQUEST');
  };
  const handleClearAuditLogs = async () => {
    if (!window.confirm('Delete all audit logs? This cannot be undone.')) return;
    // Placeholder for clearing
    toast.success('Audit logs cleared (simulated)');
    logAudit('CLEAR_AUDIT_LOGS');
  };

  return (
    <>
      <Navbar onMenuClick={() => setSidebarOpen(prev => !prev)} />
      <div style={pageWrapper}>
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <main style={isMobile ? mobileMain : mainContent}>
          <h1 style={{ ...gradientTitle, fontSize: '1.8rem', display: 'flex', alignItems: 'center', gap: 10, marginBottom: 28 }}>
            <FiSettings /> Settings
          </h1>

          {/* Profile Section */}
          <div style={card}>
            <h2 style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}><FiUser /> Profile</h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 16 }}>
              <div style={{ position: 'relative', width: 72, height: 72, borderRadius: '50%', background: 'linear-gradient(135deg, #7e22ce, #c026d3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', fontWeight: 700, color: '#fff' }}>
                {profile.fullName?.charAt(0)?.toUpperCase() || 'A'}
                <div style={{ position: 'absolute', bottom: 0, right: 0, background: '#c026d3', borderRadius: '50%', width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                  <FiEdit size={14} color="#fff" />
                </div>
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.6)' }}>Full Name</label>
                <input value={profile.fullName} onChange={e => setProfile(p => ({ ...p, fullName: e.target.value }))} style={inputStyle} />
                <label style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.6)' }}>Email</label>
                <input value={profile.email} onChange={e => setProfile(p => ({ ...p, email: e.target.value }))} style={inputStyle} />
                <input type={showCurrentPw ? 'text' : 'password'} placeholder="Current password (to change email)" value={currentPw} onChange={e => setCurrentPw(e.target.value)} style={inputStyle} />
              </div>
            </div>
            <button
              onClick={handleProfileUpdate}
              disabled={loadingProfile}
              style={{ background: 'linear-gradient(135deg, #7e22ce, #c026d3)', border: 'none', borderRadius: 12, padding: '12px 24px', color: '#fff', fontWeight: 600, cursor: 'pointer', opacity: loadingProfile ? 0.6 : 1 }}
            >{loadingProfile ? 'Saving…' : 'Save Profile'}</button>
          </div>

          {/* Change Password */}
          <div style={card}>
            <h2 style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}><FiLock /> Change Password</h2>
            <div style={{ position: 'relative' }}>
              <input type={showCurrentPw ? 'text' : 'password'} placeholder="Current Password" value={currentPw} onChange={e => setCurrentPw(e.target.value)} style={inputStyle} />
              <button onClick={() => setShowCurrentPw(!showCurrentPw)} style={{ position: 'absolute', right: 12, top: 10, background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer' }}>
                {showCurrentPw ? <FiEyeOff /> : <FiEye />}
              </button>
            </div>
            <div style={{ position: 'relative' }}>
              <input type={showNewPw ? 'text' : 'password'} placeholder="New Password" value={newPw} onChange={e => setNewPw(e.target.value)} style={inputStyle} />
              <button onClick={() => setShowNewPw(!showNewPw)} style={{ position: 'absolute', right: 12, top: 10, background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer' }}>
                {showNewPw ? <FiEyeOff /> : <FiEye />}
              </button>
            </div>
            {newPw && (
              <div style={{ marginBottom: 12 }}>
                <div style={{ height: 6, borderRadius: 3, background: pwStrength.color, width: strengthWidth + '%', transition: 'width 0.3s' }} />
                <small style={{ color: pwStrength.color }}>{pwStrength.label}</small>
              </div>
            )}
            <input type="password" placeholder="Confirm New Password" value={confirmPw} onChange={e => setConfirmPw(e.target.value)} style={inputStyle} />
            <button
              onClick={handlePasswordChange}
              disabled={loadingPw}
              style={{ background: 'linear-gradient(135deg, #7e22ce, #c026d3)', border: 'none', borderRadius: 12, padding: '12px 24px', color: '#fff', fontWeight: 600, cursor: 'pointer', opacity: loadingPw ? 0.6 : 1 }}
            >{loadingPw ? 'Updating…' : 'Update Password'}</button>
          </div>

          {/* Platform Settings */}
          <div style={card}>
            <h2 style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}><FiSettings /> Platform Settings</h2>
            <div style={toggleContainer}>
              <span>Session timeout (minutes)</span>
              <select value={platformSettings.sessionTimeout} onChange={e => setPlatformSettings(p => ({ ...p, sessionTimeout: Number(e.target.value) }))} style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 8, color: '#fff', padding: '8px 12px' }}>
                <option value={15}>15</option>
                <option value={30}>30</option>
                <option value={60}>60</option>
              </select>
            </div>
            <div style={toggleContainer}>
              <span>Require email verification</span>
              <button style={toggleSwitch(platformSettings.requireEmailVerification)} onClick={() => setPlatformSettings(p => ({ ...p, requireEmailVerification: !p.requireEmailVerification }))}>
                <span style={toggleKnob(platformSettings.requireEmailVerification)} />
              </button>
            </div>
            <div style={toggleContainer}>
              <span>Auto-notify on new registration</span>
              <button style={toggleSwitch(platformSettings.autoNotifyAdmin)} onClick={() => setPlatformSettings(p => ({ ...p, autoNotifyAdmin: !p.autoNotifyAdmin }))}>
                <span style={toggleKnob(platformSettings.autoNotifyAdmin)} />
              </button>
            </div>
            <button
              onClick={handleSavePlatformSettings}
              style={{ background: 'linear-gradient(135deg, #7e22ce, #c026d3)', border: 'none', borderRadius: 12, padding: '12px 24px', color: '#fff', fontWeight: 600, cursor: 'pointer', marginTop: 8 }}
            >Save Settings</button>
          </div>

          {/* Danger Zone */}
          <div style={{ ...card, borderColor: '#ef4444', border: '1px solid #ef4444' }}>
            <h2 style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, color: '#ef4444' }}><FiAlertTriangle /> Danger Zone</h2>
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              <button onClick={handleExportData} style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 10, padding: '10px 20px', color: '#fff', cursor: 'pointer' }}>Export All Data</button>
              <button onClick={handleClearAuditLogs} style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 10, padding: '10px 20px', color: '#fff', cursor: 'pointer' }}>Clear Audit Logs</button>
            </div>
          </div>

          {/* About */}
          <div style={card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ ...gradientTitle, fontSize: '1.2rem' }}>Acciox</span>
              <span style={{ color: 'rgba(255,255,255,0.6)' }}>v1.0</span>
            </div>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem' }}>AI-Powered Finance Platform</p>
            <div style={{ marginTop: 8, display: 'flex', gap: 16 }}>
              <a href="/terms" style={{ color: '#e879f9' }}>Terms</a>
              <a href="/privacy" style={{ color: '#e879f9' }}>Privacy</a>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
