import React, { useState, useEffect } from 'react';
import {
  db, collection, onSnapshot, addDoc, serverTimestamp,
} from '../../firebase';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-hot-toast';
import Navbar from '../../components/Navbar';
import Sidebar from '../../components/Sidebar';
import {
  FiRefreshCw, FiCheckCircle, FiXCircle, FiExternalLink,
} from 'react-icons/fi';

// ---- Inline Styles ----
const pageWrapper = {
  background: 'transparent',
  minHeight: '100vh', display: 'flex',
  fontFamily: "'Inter', system-ui, sans-serif",
};
const mainContent = { marginLeft: 260, paddingTop: 80, padding: '80px 24px 40px', flex: 1, transition: 'margin 0.3s' };
const mobileMain = { ...mainContent, marginLeft: 0 };
const card = {
  background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.15)',
  borderRadius: 16, padding: 24, color: '#fff',
};
const gradientTitle = {
  background: 'linear-gradient(to right, #c026d3, #e879f9)',
  WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
  backgroundClip: 'text', fontWeight: 700,
};

export default function SyncManager() {
  const { currentUser } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [syncLogs, setSyncLogs] = useState([]);
  const [syncStatus, setSyncStatus] = useState({ xero: false, qb: false, lastSync: null });

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const q = collection(db, 'syncLogs');
    const unsub = onSnapshot(q, (snap) => {
      const logs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      logs.sort((a,b) => (b.timestamp?.seconds||0) - (a.timestamp?.seconds||0));
      setSyncLogs(logs.slice(0,10));
    });
    return () => unsub();
  }, []);

  const logSync = async (platform, status, records = 0) => {
    await addDoc(collection(db, 'syncLogs'), {
      platform, status, records, performedBy: currentUser?.email, timestamp: serverTimestamp(),
    });
  };

  const handleXeroConnect = () => {
    const url = 'https://login.xero.com/identity/connect/authorize?response_type=code&client_id=YOUR_CLIENT_ID&scope=offline_access accounting.transactions&redirect_uri=https://acciox.vercel.app/callback';
    window.open(url, '_blank');
    logSync('Xero', 'initiated');
    toast.success('Xero OAuth flow started (placeholder).');
  };

  const handleQBConnect = () => {
    const url = 'https://appcenter.intuit.com/connect/oauth2?client_id=YOUR_CLIENT_ID&scope=com.intuit.quickbooks.accounting&redirect_uri=https://acciox.vercel.app/callback&response_type=code&state=random';
    window.open(url, '_blank');
    logSync('QuickBooks', 'initiated');
    toast.success('QuickBooks OAuth flow started (placeholder).');
  };

  const simulateSync = async (platform) => {
    await addDoc(collection(db, 'syncLogs'), {
      platform, status: 'success', records: Math.floor(Math.random()*50)+10,
      performedBy: currentUser?.email, timestamp: serverTimestamp(),
    });
    toast.success(`${platform} sync completed (simulated).`);
  };

  const handleDisconnect = (platform) => {
    toast(`Disconnected ${platform} (placeholder).`);
    logSync(platform, 'disconnected');
  };

  return (
    <>
      <Navbar onMenuClick={() => setSidebarOpen(prev => !prev)} />
      <div style={pageWrapper}>
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <main style={isMobile ? mobileMain : mainContent}>
          <h1 style={{ ...gradientTitle, fontSize: '1.8rem', display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
            <FiRefreshCw /> Sync Manager
          </h1>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24, marginBottom: 32 }}>
            {/* Xero Card */}
            <div style={card}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h2 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>🔄 Xero</h2>
                <span style={{ background: syncStatus.xero ? '#22c55e' : '#f59e0b', color: '#000', padding: '2px 12px', borderRadius: 20, fontSize: '0.8rem', fontWeight: 600 }}>
                  {syncStatus.xero ? 'Connected' : 'Not Connected'}
                </span>
              </div>
              <p style={{ color: 'rgba(255,255,255,0.6)', marginBottom: 16 }}>Last sync: {syncStatus.lastSync || 'Never'}</p>
              <div style={{ display: 'flex', gap: 12 }}>
                <button onClick={handleXeroConnect} style={{ background: 'linear-gradient(135deg, #7e22ce, #c026d3)', border: 'none', borderRadius: 12, color: '#fff', padding: '10px 20px', fontWeight: 600, cursor: 'pointer' }}>Connect Xero</button>
                <button onClick={() => simulateSync('Xero')} style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 12, color: '#fff', padding: '10px 20px', cursor: 'pointer' }}>Sync Now</button>
                <button onClick={() => handleDisconnect('Xero')} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}>Disconnect</button>
              </div>
            </div>

            {/* QuickBooks Card */}
            <div style={card}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h2 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>📊 QuickBooks</h2>
                <span style={{ background: syncStatus.qb ? '#22c55e' : '#f59e0b', color: '#000', padding: '2px 12px', borderRadius: 20, fontSize: '0.8rem', fontWeight: 600 }}>
                  {syncStatus.qb ? 'Connected' : 'Not Connected'}
                </span>
              </div>
              <p style={{ color: 'rgba(255,255,255,0.6)', marginBottom: 16 }}>Last sync: {syncStatus.lastSync || 'Never'}</p>
              <div style={{ display: 'flex', gap: 12 }}>
                <button onClick={handleQBConnect} style={{ background: 'linear-gradient(135deg, #7e22ce, #c026d3)', border: 'none', borderRadius: 12, color: '#fff', padding: '10px 20px', fontWeight: 600, cursor: 'pointer' }}>Connect QuickBooks</button>
                <button onClick={() => simulateSync('QuickBooks')} style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 12, color: '#fff', padding: '10px 20px', cursor: 'pointer' }}>Sync Now</button>
                <button onClick={() => handleDisconnect('QuickBooks')} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}>Disconnect</button>
              </div>
            </div>
          </div>

          {/* Sync History */}
          <h2 style={{ color: '#fff', marginBottom: 16 }}>Sync History</h2>
          <div style={card}>
            {syncLogs.length === 0 ? (
              <p style={{ color: 'rgba(255,255,255,0.5)' }}>No sync history.</p>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', color: '#fff' }}>
                <thead><tr style={{ borderBottom: '1px solid rgba(255,255,255,0.2)' }}>
                  <th style={{ textAlign: 'left', padding: 8 }}>Platform</th>
                  <th style={{ textAlign: 'left', padding: 8 }}>Date</th>
                  <th style={{ textAlign: 'left', padding: 8 }}>Records</th>
                  <th style={{ textAlign: 'left', padding: 8 }}>Status</th>
                </tr></thead>
                <tbody>
                  {syncLogs.map(log => (
                    <tr key={log.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                      <td style={{ padding: 8 }}>{log.platform}</td>
                      <td style={{ padding: 8 }}>{log.timestamp ? new Date(log.timestamp.seconds*1000).toLocaleString() : ''}</td>
                      <td style={{ padding: 8 }}>{log.records || '—'}</td>
                      <td style={{ padding: 8 }}>
                        <span style={{ color: log.status === 'success' ? '#22c55e' : '#ef4444', fontWeight: 600 }}>
                          {log.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </main>
      </div>
    </>
  );
}
