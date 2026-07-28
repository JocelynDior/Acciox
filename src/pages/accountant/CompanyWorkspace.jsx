```jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { db, doc, onSnapshot, collection, query, where, orderBy, limit } from '../../firebase';
import Navbar from '../../components/Navbar';
import Sidebar from '../../components/Sidebar';
import {
  FiArrowLeft, FiBriefcase, FiClock, FiAlertCircle, FiTrendingUp, FiRefreshCw,
  FiList, FiUsers, FiDollarSign, FiPieChart, FiCreditCard, FiMessageSquare, FiCpu,
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
  borderRadius: 16, padding: 20, color: '#fff',
};
const gradientTitle = {
  background: 'linear-gradient(to right, #c026d3, #e879f9)',
  WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
  backgroundClip: 'text', fontWeight: 700,
};
const navCardBase = {
  background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(20px)',
  border: '1px solid rgba(255,255,255,0.15)', borderRadius: 16, padding: 24,
  color: '#fff', transition: 'all 0.2s ease', cursor: 'pointer',
  display: 'flex', flexDirection: 'column', alignItems: 'center', textDecoration: 'none',
};
const navCardHover = { transform: 'translateY(-4px)', boxShadow: '0 12px 30px rgba(192,38,211,0.25)' };

export default function CompanyWorkspace() {
  const { companyId } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [company, setCompany] = useState(null);
  const [recentTx, setRecentTx] = useState([]);
  const [allTx, setAllTx] = useState([]); // for stats

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Fetch company doc
  useEffect(() => {
    if (!companyId) return;
    const unsub = onSnapshot(doc(db, 'companies', companyId), (snap) => {
      if (snap.exists()) setCompany({ id: snap.id, ...snap.data() });
      else setCompany(null);
    });
    return () => unsub();
  }, [companyId]);

  // Fetch transactions for this company
  useEffect(() => {
    if (!companyId) return;
    const q = query(
      collection(db, 'transactions'),
      where('companyId', '==', companyId),
      orderBy('createdAt', 'desc')
    );
    const unsub = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setAllTx(list);
      setRecentTx(list.slice(0, 5));
    });
    return () => unsub();
  }, [companyId]);

  // Stats
  const now = new Date();
  const thisMonth = (tx) => {
    if (!tx.createdAt) return false;
    const date = new Date(tx.createdAt.seconds * 1000);
    return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
  };
  const monthlyTx = allTx.filter(thisMonth);
  const pendingReview = allTx.filter(t => t.status === 'pending' || t.needsReview === true).length;
  const totalExpenses = allTx.reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0); // simplified

  const lastSync = company?.lastSync ? new Date(company.lastSync.seconds * 1000).toLocaleString() : 'Never';

  // Navigation items
  const navItems = [
    { to: `/company/${companyId}/transactions`, icon: <FiList size={28} />, label: 'Transactions' },
    { to: `/company/${companyId}/expenses`, icon: <FiUsers size={28} />, label: 'Staff Expenses' },
    { to: `/company/${companyId}/payroll`, icon: <FiDollarSign size={28} />, label: 'Payroll' },
    { to: `/company/${companyId}/reports`, icon: <FiPieChart size={28} />, label: 'Reports' },
    { to: `/company/${companyId}/invoices`, icon: <FiCreditCard size={28} />, label: 'Invoices' },
    { to: `/company/${companyId}/chat/group`, icon: <FiMessageSquare size={28} />, label: 'Group Chat' },
    { to: `/company/${companyId}/chat/ai`, icon: <FiCpu size={28} />, label: 'AI Chat' },
    { to: `/accountant/sync`, icon: <FiRefreshCw size={28} />, label: 'Sync Manager' },
  ];

  return (
    <>
      <Navbar onMenuClick={() => setSidebarOpen(prev => !prev)} />
      <div style={pageWrapper}>
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} companyId={companyId} companyName={company?.companyName} />
        <main style={isMobile ? mobileMain : mainContent}>
          {/* Back button */}
          <button onClick={() => navigate('/accountant')} style={{ background: 'none', border: 'none', color: '#e879f9', cursor: 'pointer', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.95rem' }}>
            <FiArrowLeft /> Back to Companies
          </button>

          {/* Company Header */}
          {company && (
            <div style={{ marginBottom: 28 }}>
              <h1 style={{ ...gradientTitle, fontSize: '2rem', marginBottom: 4 }}>{company.companyName}</h1>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ background: '#22c55e', color: '#000', padding: '2px 12px', borderRadius: 20, fontSize: '0.8rem', fontWeight: 600 }}>Verified</span>
                <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem' }}>{company.industry || 'N/A'}</span>
                <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem' }}>Joined {company.createdAt ? new Date(company.createdAt.seconds * 1000).toLocaleDateString() : ''}</span>
              </div>
            </div>
          )}

          {/* Overview Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 32 }}>
            <div style={card}>
              <FiBriefcase size={24} color="#c026d3" />
              <h2 style={{ fontSize: '2rem', margin: '8px 0', fontWeight: 700 }}>{monthlyTx.length}</h2>
              <p style={{ color: 'rgba(255,255,255,0.7)' }}>Transactions (This Month)</p>
            </div>
            <div style={card}>
              <FiAlertCircle size={24} color="#f59e0b" />
              <h2 style={{ fontSize: '2rem', margin: '8px 0', fontWeight: 700 }}>{pendingReview}</h2>
              <p style={{ color: 'rgba(255,255,255,0.7)' }}>Pending AI Review</p>
            </div>
            <div style={card}>
              <FiTrendingUp size={24} color="#3b82f6" />
              <h2 style={{ fontSize: '2rem', margin: '8px 0', fontWeight: 700 }}>${totalExpenses.toFixed(2)}</h2>
              <p style={{ color: 'rgba(255,255,255,0.7)' }}>Total Expenses</p>
            </div>
            <div style={card}>
              <FiRefreshCw size={24} color="#22c55e" />
              <p style={{ margin: '8px 0', fontWeight: 600, color: 'rgba(255,255,255,0.8)' }}>Last Sync</p>
              <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem' }}>{lastSync}</p>
            </div>
          </div>

          {/* Quick Navigation Grid */}
          <h2 style={{ marginBottom: 16, color: '#fff', fontSize: '1.2rem' }}>Quick Navigation</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 16, marginBottom: 32 }}>
            {navItems.map(item => (
              <Link
                key={item.to}
                to={item.to}
                style={navCardBase}
                onMouseEnter={e => Object.assign(e.currentTarget.style, navCardHover)}
                onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; }}
              >
                <div style={{ color: '#e879f9', marginBottom: 12 }}>{item.icon}</div>
                <span style={{ fontWeight: 600, textAlign: 'center' }}>{item.label}</span>
              </Link>
            ))}
          </div>

          {/* Recent Transactions Preview */}
          <h2 style={{ marginBottom: 16, color: '#fff', fontSize: '1.2rem' }}>Recent Transactions</h2>
          <div style={card}>
            {recentTx.length === 0 ? (
              <p style={{ color: 'rgba(255,255,255,0.5)' }}>No transactions yet.</p>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', color: '#fff', fontSize: '0.9rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.2)' }}>
                    <th style={{ textAlign: 'left', padding: '8px 0' }}>Date</th>
                    <th style={{ textAlign: 'left', padding: '8px 0' }}>Description</th>
                    <th style={{ textAlign: 'right', padding: '8px 0' }}>Amount</th>
                    <th style={{ textAlign: 'left', padding: '8px 0' }}>Category</th>
                    <th style={{ textAlign: 'center', padding: '8px 0' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentTx.map(tx => (
                    <tr key={tx.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                      <td style={{ padding: '8px 0' }}>{tx.date || (tx.createdAt ? new Date(tx.createdAt.seconds * 1000).toLocaleDateString() : '')}</td>
                      <td style={{ padding: '8px 0' }}>{tx.description || '—'}</td>
                      <td style={{ padding: '8px 0', textAlign: 'right' }}>${parseFloat(tx.amount || 0).toFixed(2)}</td>
                      <td style={{ padding: '8px 0' }}>{tx.category || 'Uncategorized'}</td>
                      <td style={{ padding: '8px 0', textAlign: 'center' }}>
                        <span style={{
                          background: tx.status === 'completed' ? '#22c55e' : tx.status === 'pending' ? '#f59e0b' : '#ef4444',
                          color: '#000', padding: '2px 10px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 600,
                        }}>
                          {tx.status || 'pending'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            <div style={{ marginTop: 16, textAlign: 'right' }}>
              <Link to={`/company/${companyId}/transactions`} style={{ color: '#e879f9', textDecoration: 'none', fontWeight: 600 }}>View All →</Link>
            </div>
          </div>

          {/* AI Processing Status */}
          <h2 style={{ marginTop: 32, marginBottom: 16, color: '#fff', fontSize: '1.2rem' }}>AI Processing Status</h2>
          <div style={card}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ color: 'rgba(255,255,255,0.8)' }}>AI Engine: Active</span>
              <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.9rem' }}>
                Last processed: {allTx.length > 0 ? new Date(Math.max(...allTx.map(t => t.createdAt?.seconds || 0)*1000)).toLocaleTimeString() : 'N/A'}
              </span>
            </div>
            <p style={{ marginTop: 8, color: 'rgba(255,255,255,0.6)' }}>
              Items processed today: {allTx.filter(t => t.processedAt && new Date(t.processedAt.seconds*1000).toDateString() === new Date().toDateString()).length}
            </p>
          </div>
        </main>
      </div>
    </>
  );
}
```
