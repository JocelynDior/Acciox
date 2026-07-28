```jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { db, collection, onSnapshot, query, where, orderBy, limit } from '../../firebase';
import { toast } from 'react-hot-toast';
import Navbar from '../../components/Navbar';
import Sidebar from '../../components/Sidebar';
import {
  FiBriefcase, FiClock, FiAlertCircle, FiCheckCircle, FiSearch, FiTrendingUp, FiChevronRight,
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
const companyCardStyle = {
  background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(20px)',
  border: '1px solid rgba(255,255,255,0.15)', borderRadius: 16, padding: 20, color: '#fff',
  transition: 'all 0.2s ease', cursor: 'pointer',
};
const companyCardHover = {
  transform: 'translateY(-4px)',
  boxShadow: '0 12px 30px rgba(192,38,211,0.25)',
};

export default function AccountantHome() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [companies, setCompanies] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [activities, setActivities] = useState([]);
  const [search, setSearch] = useState('');
  const [industryFilter, setIndustryFilter] = useState('all');

  // responsive listener
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Fetch verified companies
  useEffect(() => {
    const q = collection(db, 'companies');
    const unsub = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      const verified = list.filter(c => c.status === 'verified');
      setCompanies(verified);
    });
    return () => unsub();
  }, []);

  // Fetch transactions for stats
  useEffect(() => {
    const q = collection(db, 'transactions');
    const unsub = onSnapshot(q, (snapshot) => {
      setTransactions(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, []);

  // Fetch recent activities (auditLogs) for this accountant
  useEffect(() => {
    const q = query(
      collection(db, 'auditLogs'),
      where('performedBy', '==', currentUser?.email || ''),
      orderBy('timestamp', 'desc'),
      limit(5)
    );
    const unsub = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setActivities(list);
    });
    return () => unsub();
  }, [currentUser]);

  // Compute stats
  const pendingTx = transactions.filter(t => t.status === 'pending').length;
  const completedToday = transactions.filter(t => {
    if (t.status !== 'completed' || !t.completedAt) return false;
    const today = new Date();
    const completedDate = new Date(t.completedAt.seconds * 1000);
    return completedDate.toDateString() === today.toDateString();
  }).length;
  const flaggedItems = transactions.filter(t => t.needsReview === true).length;

  // Filtered companies
  const filteredCompanies = companies.filter(c => {
    const nameMatch = (c.companyName || '').toLowerCase().includes(search.toLowerCase());
    const industryMatch = industryFilter === 'all' || (c.industry || '').toLowerCase() === industryFilter.toLowerCase();
    return nameMatch && industryMatch;
  });

  // Unique industries for filter dropdown
  const industries = [...new Set(companies.map(c => c.industry).filter(Boolean))];

  const formatDate = (ts) => {
    if (!ts) return '';
    const date = new Date(ts.seconds * 1000);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });

  return (
    <>
      <Navbar onMenuClick={() => setSidebarOpen(prev => !prev)} />
      <div style={pageWrapper}>
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <main style={isMobile ? mobileMain : mainContent}>
          {/* Welcome Header */}
          <div style={{ marginBottom: 28 }}>
            <h1 style={{ ...gradientTitle, fontSize: '1.8rem', marginBottom: 4 }}>
              Welcome back, {currentUser?.displayName || 'Accountant'}
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.6)' }}>{currentDate}</p>
            <p style={{ color: 'rgba(255,255,255,0.5)', marginTop: 8 }}>Select a company to start working</p>
          </div>

          {/* Stats Row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 32 }}>
            <div style={card}>
              <FiBriefcase size={24} color="#c026d3" />
              <h2 style={{ fontSize: '2rem', margin: '8px 0', fontWeight: 700 }}>{filteredCompanies.length}</h2>
              <p style={{ color: 'rgba(255,255,255,0.7)' }}>Assigned Companies</p>
            </div>
            <div style={card}>
              <FiClock size={24} color="#f59e0b" />
              <h2 style={{ fontSize: '2rem', margin: '8px 0', fontWeight: 700 }}>{pendingTx}</h2>
              <p style={{ color: 'rgba(255,255,255,0.7)' }}>Pending Transactions</p>
            </div>
            <div style={card}>
              <FiCheckCircle size={24} color="#22c55e" />
              <h2 style={{ fontSize: '2rem', margin: '8px 0', fontWeight: 700 }}>{completedToday}</h2>
              <p style={{ color: 'rgba(255,255,255,0.7)' }}>Completed Today</p>
            </div>
            <div style={card}>
              <FiAlertCircle size={24} color="#ef4444" />
              <h2 style={{ fontSize: '2rem', margin: '8px 0', fontWeight: 700 }}>{flaggedItems}</h2>
              <p style={{ color: 'rgba(255,255,255,0.7)' }}>Flagged Items</p>
            </div>
          </div>

          {/* Search & Filter */}
          <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,0.07)', borderRadius: 12, padding: '0 14px', flex: 1, minWidth: 200 }}>
              <FiSearch color="rgba(255,255,255,0.5)" />
              <input
                placeholder="Search companies..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{ background: 'transparent', border: 'none', color: '#fff', padding: '12px 8px', outline: 'none', width: '100%' }}
              />
            </div>
            <select
              value={industryFilter}
              onChange={e => setIndustryFilter(e.target.value)}
              style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 12, color: '#fff', padding: '10px 14px', outline: 'none', fontWeight: 600 }}
            >
              <option value="all">All Industries</option>
              {industries.map(ind => <option key={ind} value={ind}>{ind}</option>)}
            </select>
          </div>

          {/* Company Grid */}
          <h2 style={{ marginBottom: 16, fontSize: '1.2rem', color: '#fff' }}>Your Companies</h2>
          {filteredCompanies.length === 0 ? (
            <div style={{ ...card, textAlign: 'center', color: 'rgba(255,255,255,0.5)' }}>No companies found.</div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16, marginBottom: 32 }}>
              {filteredCompanies.map(company => (
                <div
                  key={company.id}
                  style={companyCardStyle}
                  onMouseEnter={e => {
                    Object.assign(e.currentTarget.style, companyCardHover);
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.transform = '';
                    e.currentTarget.style.boxShadow = '';
                  }}
                  onClick={() => navigate(`/accountant/company/${company.id}`)}
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
                      <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)' }}>
                        Last active: {formatDate(company.lastActivity) || '—'}
                      </div>
                      <div style={{ marginTop: 4 }}>
                        <span style={{ padding: '2px 10px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 600, background: '#22c55e', color: '#000' }}>Verified</span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', color: '#e879f9', fontWeight: 600 }}>
                      Open <FiChevronRight />
                    </div>
                  </div>
                  {company.pendingTx > 0 && (
                    <div style={{ marginTop: 12, fontSize: '0.8rem', color: '#f59e0b' }}>
                      {company.pendingTx} pending transaction{company.pendingTx > 1 ? 's' : ''}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Recent Activity Feed */}
          <h2 style={{ marginBottom: 16, fontSize: '1.2rem', color: '#fff' }}>Recent Activity</h2>
          <div style={card}>
            {activities.length === 0 ? (
              <p style={{ color: 'rgba(255,255,255,0.5)' }}>No recent activity.</p>
            ) : (
              <ul style={{ listStyle: 'none', padding: 0 }}>
                {activities.map((act, idx) => (
                  <li key={act.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: idx < activities.length-1 ? '1px solid rgba(255,255,255,0.1)' : 'none' }}>
                    <span>{act.action} – {act.companyName || ''}</span>
                    <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem' }}>
                      {act.timestamp ? new Date(act.timestamp.seconds*1000).toLocaleTimeString() : ''}
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
```
