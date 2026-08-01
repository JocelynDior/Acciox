import React, { useState, useEffect } from 'react';
import {
  db, auth, doc, updateDoc, onSnapshot, collection, addDoc, serverTimestamp,
} from '../../firebase';
import {
  updatePassword, reauthenticateWithCredential, EmailAuthProvider,
} from 'firebase/auth';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-hot-toast';
import Navbar from '../../components/Navbar';
import Sidebar from '../../components/Sidebar';
import {
  FiUser, FiLock, FiBell, FiSettings, FiInfo, FiEdit,
} from 'react-icons/fi';

const pageWrapper = {
  background: 'transparent',
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

export default function AccountantSettings() {
  const { currentUser } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [profile, setProfile] = useState({ fullName: '', email: '', accountantRole: '' }); // added accountantRole
  const [pw, setPw] = useState({ current: '', new: '', confirm: '' });
  const [notifPrefs, setNotifPrefs] = useState({
    newTx: true, lowConfidence: true, syncErrors: true,
  });
  const [aiPrefs, setAiPrefs] = useState({
    autoApprove: false, confidenceThreshold: 85,
  });

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
        setProfile({ fullName: d.fullName || '', email: d.email || currentUser.email, accountantRole: d.accountantRole || '' });
        setNotifPrefs(d.notifPrefs || notifPrefs);
        setAiPrefs(d.aiPrefs || aiPrefs);
      }
    });
    return () => unsub();
  }, [currentUser]);

  const handleSaveProfile = async () => {
    try {
      await updateDoc(doc(db, 'users', currentUser.uid), {
        fullName: profile.fullName,
        accountantRole: profile.accountantRole,
      });
      toast.success('Profile saved');
    } catch (e) { toast.error(e.message); }
  };

  const handleChangePassword = async () => {
    if (!pw.current || pw.new !== pw.confirm) return toast.error('Check passwords');
    try {
      const cred = EmailAuthProvider.credential(currentUser.email, pw.current);
      await reauthenticateWithCredential(currentUser, cred);
      await updatePassword(currentUser, pw.new);
      toast.success('Password updated');
      setPw({ current: '', new: '', confirm: '' });
    } catch (e) { toast.error(e.message); }
  };

  const handleSaveNotifPrefs = async () => {
    await updateDoc(doc(db, 'users', currentUser.uid), { notifPrefs });
    toast.success('Notification preferences saved');
  };

  const handleSaveAiPrefs = async () => {
    await updateDoc(doc(db, 'users', currentUser.uid), { aiPrefs });
    toast.success('AI preferences saved');
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

          {/* Profile */}
          <div style={card}>
            <h2><FiUser /> Profile</h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginTop: 16 }}>
              <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'linear-gradient(135deg, #7e22ce, #c026d3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', color: '#fff', fontWeight: 700 }}>{profile.fullName?.charAt(0).toUpperCase() || 'A'}</div>
              <div style={{ flex: 1 }}>
                <input value={profile.fullName} onChange={e => setProfile(p => ({ ...p, fullName: e.target.value }))} style={inputStyle} placeholder="Full Name" />
                <input value={profile.email} readOnly style={{ ...inputStyle, opacity: 0.6 }} placeholder="Email" />
                {/* Accountant Role Dropdown */}
                <select
                  value={profile.accountantRole}
                  onChange={e => setProfile(p => ({ ...p, accountantRole: e.target.value }))}
                  style={{ ...inputStyle, marginBottom: 0 }}
                >
                  <option value="">Select Role</option>
                  <option value="Bookkeeper">Bookkeeper</option>
                  <option value="Chartered Accountant">Chartered Accountant</option>
                  <option value="Financial Advisor">Financial Advisor</option>
                  <option value="Auditor">Auditor</option>
                  <option value="Tax Consultant">Tax Consultant</option>
                </select>
              </div>
            </div>
            <button onClick={handleSaveProfile} style={{ background: 'linear-gradient(135deg, #7e22ce, #c026d3)', border: 'none', borderRadius: 12, color: '#fff', padding: '12px 24px', fontWeight: 600, cursor: 'pointer', marginTop: 12 }}>Save Profile</button>
          </div>

          {/* Password */}
          <div style={card}>
            <h2><FiLock /> Change Password</h2>
            <input type="password" placeholder="Current Password" value={pw.current} onChange={e => setPw(p => ({...p, current: e.target.value}))} style={inputStyle} />
            <input type="password" placeholder="New Password" value={pw.new} onChange={e => setPw(p => ({...p, new: e.target.value}))} style={inputStyle} />
            <input type="password" placeholder="Confirm New Password" value={pw.confirm} onChange={e => setPw(p => ({...p, confirm: e.target.value}))} style={inputStyle} />
            <button onClick={handleChangePassword} style={{ background: 'linear-gradient(135deg, #7e22ce, #c026d3)', border: 'none', borderRadius: 12, color: '#fff', padding: '12px 24px', fontWeight: 600, cursor: 'pointer' }}>Update Password</button>
          </div>

          {/* Notification Preferences */}
          <div style={card}>
            <h2><FiBell /> Notification Preferences</h2>
            {[
              { key: 'newTx', label: 'Email me when new transaction needs review' },
              { key: 'lowConfidence', label: 'Email me when AI confidence is low' },
              { key: 'syncErrors', label: 'Email me on sync errors' },
            ].map(item => (
              <div key={item.key} style={toggleContainer}>
                <span>{item.label}</span>
                <button
                  onClick={() => setNotifPrefs(p => ({...p, [item.key]: !p[item.key]}))}
                  style={{
                    width: 48, height: 26, borderRadius: 13, background: notifPrefs[item.key] ? '#c026d3' : 'rgba(255,255,255,0.2)',
                    border: 'none', cursor: 'pointer', position: 'relative', transition: '0.2s',
                  }}>
                  <span style={{ position: 'absolute', top: 2, left: notifPrefs[item.key] ? 24 : 2, width: 22, height: 22, borderRadius: '50%', background: '#fff', transition: '0.2s' }} />
                </button>
              </div>
            ))}
            <button onClick={handleSaveNotifPrefs} style={{ background: 'linear-gradient(135deg, #7e22ce, #c026d3)', border: 'none', borderRadius: 12, color: '#fff', padding: '12px 24px', fontWeight: 600, cursor: 'pointer' }}>Save</button>
          </div>

          {/* AI Preferences */}
          <div style={card}>
            <h2><FiSettings /> AI Preferences</h2>
            <div style={toggleContainer}>
              <span>Auto-approve high confidence transactions</span>
              <button
                onClick={() => setAiPrefs(p => ({...p, autoApprove: !p.autoApprove}))}
                style={{
                  width: 48, height: 26, borderRadius: 13, background: aiPrefs.autoApprove ? '#c026d3' : 'rgba(255,255,255,0.2)',
                  border: 'none', cursor: 'pointer', position: 'relative', transition: '0.2s',
                }}>
                <span style={{ position: 'absolute', top: 2, left: aiPrefs.autoApprove ? 24 : 2, width: 22, height: 22, borderRadius: '50%', background: '#fff', transition: '0.2s' }} />
              </button>
            </div>
            <div style={{ marginTop: 12 }}>
              <label style={{ fontSize: '0.9rem' }}>Confidence Threshold: {aiPrefs.confidenceThreshold}%</label>
              <input type="range" min="70" max="95" value={aiPrefs.confidenceThreshold}
                onChange={e => setAiPrefs(p => ({...p, confidenceThreshold: Number(e.target.value)}))}
                style={{ width: '100%', accentColor: '#c026d3', marginTop: 8 }}
              />
            </div>
            <button onClick={handleSaveAiPrefs} style={{ background: 'linear-gradient(135deg, #7e22ce, #c026d3)', border: 'none', borderRadius: 12, color: '#fff', padding: '12px 24px', fontWeight: 600, cursor: 'pointer', marginTop: 16 }}>Save AI Preferences</button>
          </div>

          {/* About */}
          <div style={card}>
            <h2><FiInfo /> About</h2>
            <p style={{ color: 'rgba(255,255,255,0.6)' }}>Acciox v1.0 – AI-Powered Finance Platform</p>
            <div style={{ marginTop: 8 }}>
              <a href="/terms" style={{ color: '#e879f9', marginRight: 16 }}>Terms</a>
              <a href="/privacy" style={{ color: '#e879f9' }}>Privacy</a>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
