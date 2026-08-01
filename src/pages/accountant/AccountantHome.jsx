import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { db, collection, onSnapshot, query, where, orderBy, limit } from '../../firebase';
import Navbar from '../../components/Navbar';
import Sidebar from '../../components/Sidebar';
import { FiBriefcase, FiClock, FiAlertCircle, FiCheckCircle, FiSearch, FiChevronRight } from 'react-icons/fi';

const pageWrapper = {
  background: 'linear-gradient(135deg, #0f0a1a 0%, #1a0f2e 50%, #2d1b4e 100%)',
  minHeight: '100vh', display: 'flex',
  fontFamily: "'Inter', system-ui, sans-serif",
};
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
const companyCardStyle = {
  background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(20px)',
  border: '1px solid rgba(255,255,255,0.15)', borderRadius: 16, padding: 20, color: '#fff',
  cursor: 'pointer', transition: 'all 0.2s ease',
};
const tabStyle = (active) => ({
  padding: '10px 20px', borderRadius: 12, border: 'none', cursor: 'pointer',
  background: active ? 'linear-gradient(135deg, #7e22ce, #c026d3)' : 'rgba(255,255,255,0.07)',
  color: '#fff', fontWeight: active ? 600 : 400, fontSize: '0.9rem', transition: 'all 0.2s',
});

export default function AccountantHome() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [companies, setCompanies] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [activities, setActivities] = useState([]);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('mine');

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Fetch ALL verified companies
  useEffect(() => {
    const q = query(collection(db, 'companies'), where('status', '==', 'verified'));
    const unsub = onSnapshot(q, snapshot => {
      setCompanies(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, []);

  // Fetch transactions
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'transactions'), snapshot => {
      setTransactions(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, []);

  // Fetch recent activity - only if user exists
  useEffect(() => {
    if (!currentUser?.email) return;
    try {
      const q = query(
        collection(db, 'auditLogs'),
        where('performedBy', '==', currentUser.email),
        orderBy('timestamp', 'desc'),
        limit(5)
      );
      const unsub = onSnapshot(q, snapshot => {
        setActivities(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
      });
      return () => unsub();
    } catch (e) {
      console.error('Audit log fetch failed', e);
    }
  }, [currentUser]);

  const pendingTx = transactions.filter(t => t.status === 'pending').length;
  const completedToday = transactions.filter(t => {
    if (t.status !== 'completed' || !t.completedAt) return false;
    const today = new Date();
    const d = new Date(t.completedAt.seconds * 1000);
    return d.toDateString() === today.toDateString();
  }).length;
  const flaggedItems = transactions.filter(t => t.needsReview === true).length;

  // Split companies into my companies vs other companies
  const myCompanies = companies.filter(c => c.assignedAccountantId === currentUser?.uid);
  const otherCompanies = companies.filter(c => c.assignedAccountantId !== currentUser?.uid);

  const filterCompanies = (list) => list.filter(c =>
    (c.companyName || '').toLowerCase().includes(search.toLowerCase())
  );

  const formatDate = (ts) => {
    if (!ts) return '';
    return new Date(ts.seconds * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });

  const mainContent = {
    marginLeft: isMobile ? 0 : 260,
    padding: isMobile ? '80px 16px 40px' : '80px 24px 40px',
    flex: 1,
  };

  const displayedCompanies = filterCompanies(activeTab === 'mine' ? myCompanies : otherCompanies);

  const renderCompanyCard = (company) => (
    <div
      key={company.id}
      style={companyCardStyle}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 12px 30px rgba(192,38,211,0.25)'; }}
      onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; }}
      onClick={() => navigate('/accountant/company/' + company.id)}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 12 }}>
        <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'linear-gradient(135deg, #7e22ce, #c026d3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: '1.2rem' }}>
          {company.companyName?.charAt(0).toUpperCase() || '?'}
        </div>
        <div>
          <strong>{company.companyName}</strong>
          <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem' }}>{company.industry || 'N/A'}</div>
        </div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)' }}>Last active: {formatDate(company.lastActivity) || '—'}</div>
          <span style={{ padding: '2px 10px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 600, background: '#22c55e', color: '#000' }}>Verified</span>
          {company.assignedAccountantId === currentUser?.uid && (
            <span style={{ marginLeft: 6, padding: '2px 10px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 600, background: '#c026d3', color: '#fff' }}>Assigned</span>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', color: '#e879f9', fontWeight: 600 }}>
          Open <FiChevronRight />
        </div>
      </div>
    </div>
  );

  return (
    <>
      <Navbar onMenuClick={() => setSidebarOpen(prev => !prev)} />
      <div style={pageWrapper}>
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <main style={mainContent}>
          <div style={{ marginBottom: 28 }}>
            <h1 style={{ ...gradientTitle, fontSize: '1.8rem', marginBottom: 4 }}>
              Welcome back, {currentUser?.displayName || 'Accountant'}
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.6)' }}>{currentDate}</p>
          </div>

          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 32 }}>
            <div style={card}><FiBriefcase size={24} color="#c026d3" /><h2 style={{ fontSize: '2rem', margin: '8px 0', fontWeight: 700 }}>{companies.length}</h2><p style={{ color: 'rgba(255,255,255,0.7)' }}>Total Companies</p></div>
            <div style={card}><FiClock size={24} color="#f59e0b" /><h2 style={{ fontSize: '2rem', margin: '8px 0', fontWeight: 700 }}>{pendingTx}</h2><p style={{ color: 'rgba(255,255,255,0.7)' }}>Pending Transactions</p></div>
            <div style={card}><FiCheckCircle size={24} color="#22c55e" /><h2 style={{ fontSize: '2rem', margin: '8px 0', fontWeight: 700 }}>{completedToday}</h2><p style={{ color: 'rgba(255,255,255,0.7)' }}>Completed Today</p></div>
            <div style={card}><FiAlertCircle size={24} color="#ef4444" /><h2 style={{ fontSize: '2rem', margin: '8px 0', fontWeight: 700 }}>{flaggedItems}</h2><p style={{ color: 'rgba(255,255,255,0.7)' }}>Flagged Items</p></div>
          </div>

          {/* Search */}
          <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,0.07)', borderRadius: 12, padding: '0 14px', marginBottom: 16 }}>
            <FiSearch color="rgba(255,255,255,0.5)" />
            <input placeholder="Search companies..." value={search} onChange={e => setSearch(e.target.value)} style={{ background: 'transparent', border: 'none', color: '#fff', padding: '12px 8px', outline: 'none', width: '100%' }} />
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
            <button style={tabStyle(activeTab === 'mine')} onClick={() => setActiveTab('mine')}>
              My Companies ({myCompanies.length})
            </button>
            <button style={tabStyle(activeTab === 'all')} onClick={() => setActiveTab('all')}>
              All Companies ({otherCompanies.length})
            </button>
          </div>

          {displayedCompanies.length === 0 ? (
            <div style={{ ...card, textAlign: 'center', color: 'rgba(255,255,255,0.5)', padding: 40 }}>
              {activeTab === 'mine' ? 'No companies assigned to you yet.' : 'No other companies found.'}
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16, marginBottom: 32 }}>
              {displayedCompanies.map(renderCompanyCard)}
            </div>
          )}

          {/* Recent Activity */}
          <h2 style={{ marginBottom: 16, fontSize: '1.2rem', color: '#fff' }}>Recent Activity</h2>
          <div style={card}>
            {activities.length === 0 ? (
              <p style={{ color: 'rgba(255,255,255,0.5)' }}>No recent activity.</p>
            ) : (
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {activities.map((act, idx) => (
                  <li key={act.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: idx < activities.length - 1 ? '1px solid rgba(255,255,255,0.1)' : 'none' }}>
                    <span>{act.action} – {act.companyName || ''}</span>
                    <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem' }}>
                      {act.timestamp ? new Date(act.timestamp.seconds * 1000).toLocaleTimeString() : ''}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </main>
      </div>
    </>
  );
}
