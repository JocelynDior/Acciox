import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { db, collection, onSnapshot, query, where, orderBy } from '../../firebase';
import Navbar from '../../components/Navbar';
import Sidebar from '../../components/Sidebar';
import {
  FiBuilding,
  FiUsers,
  FiCheckCircle,
  FiClock,
  FiPlus,
  FiEye,
  FiAlertCircle,
} from 'react-icons/fi';

// ---- Inline Styles ----
const pageWrapper = {
  background: 'linear-gradient(135deg, #0f0a1a 0%, #1a0f2e 50%, #2d1b4e 100%)',
  minHeight: '100vh',
  display: 'flex',
  fontFamily: "'Inter', system-ui, sans-serif",
};

// Responsive: on mobile hide sidebar margin
const mainContentBase = {
  paddingTop: 80,
  padding: '80px 24px 40px',
  flex: 1,
  marginLeft: 260,
  transition: 'margin 0.3s',
};

const card = {
  background: 'rgba(255,255,255,0.08)',
  backdropFilter: 'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)',
  border: '1px solid rgba(255,255,255,0.15)',
  borderRadius: 16,
  padding: 20,
  color: '#fff',
  boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
};

const gradientTitle = {
  background: 'linear-gradient(to right, #c026d3, #e879f9)',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  backgroundClip: 'text',
  fontWeight: 700,
};

export default function AdminHome() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [companies, setCompanies] = useState([]);
  const [usersCount, setUsersCount] = useState(0);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  // Responsive listener
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Fetch companies
  useEffect(() => {
    const q = collection(db, 'companies');
    const unsub = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setCompanies(data);
    }, (error) => console.error('Error fetching companies:', error));
    return () => unsub();
  }, []);

  // Fetch total users count
  useEffect(() => {
    const q = collection(db, 'users');
    const unsub = onSnapshot(q, (snapshot) => {
      setUsersCount(snapshot.size);
    });
    return () => unsub();
  }, []);

  // Derived stats
  const totalCompanies = companies.length;
  const verifiedCompanies = companies.filter(c => c.status === 'verified').length;
  const pendingVerification = companies.filter(c => c.status === 'unverified').length;

  // Recent 5 companies (sorted by createdAt descending)
  const recentCompanies = [...companies]
    .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0))
    .slice(0, 5);

  const pendingCompanies = companies.filter(c => c.status === 'unverified');

  const formatDate = (timestamp) => {
    if (!timestamp) return '—';
    const date = new Date(timestamp.seconds * 1000);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });

  // Dynamic main content style: hide sidebar margin on mobile
  const mainContent = {
    ...mainContentBase,
    marginLeft: isMobile ? 0 : 260,
  };

  // Role badge styles – no style injection needed
  const badgeStyle = (color) => ({
    background: color,
    color: '#fff',
    padding: '4px 14px',
    borderRadius: 20,
    fontSize: '0.75rem',
    fontWeight: 600,
    textTransform: 'uppercase',
  });

  // Hide the centre badge on mobile via conditional rendering, not style injection
  const renderRoleBadge = () => {
    if (isMobile) return null;
    const roleLabel = currentUser?.role || 'admin';
    const color = roleLabel === 'admin' ? '#c026d3' : '#7e22ce';
    return <span style={badgeStyle(color)}>{roleLabel}</span>;
  };

  return (
    <>
      <Navbar onMenuClick={() => setSidebarOpen(prev => !prev)} />
      <div style={pageWrapper}>
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <main style={mainContent}>
          {/* Welcome Header */}
          <div style={{ marginBottom: 28 }}>
            <h1 style={{ ...gradientTitle, fontSize: '1.8rem', marginBottom: 4 }}>
              Welcome back, {currentUser?.displayName || currentUser?.email?.split('@')[0] || 'Admin'}
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.6)' }}>{currentDate}</p>
          </div>

          {/* Stats Row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 32 }}>
            <div style={card}>
              <FiBuilding size={24} color="#c026d3" />
              <h2 style={{ fontSize: '2rem', margin: '8px 0', fontWeight: 700 }}>{totalCompanies}</h2>
              <p style={{ color: 'rgba(255,255,255,0.7)' }}>Total Companies</p>
            </div>
            <div style={card}>
              <FiCheckCircle size={24} color="#22c55e" />
              <h2 style={{ fontSize: '2rem', margin: '8px 0', fontWeight: 700 }}>{verifiedCompanies}</h2>
              <p style={{ color: 'rgba(255,255,255,0.7)' }}>Verified</p>
            </div>
            <div style={card}>
              <FiClock size={24} color="#f59e0b" />
              <h2 style={{ fontSize: '2rem', margin: '8px 0', fontWeight: 700 }}>{pendingVerification}</h2>
              <p style={{ color: 'rgba(255,255,255,0.7)' }}>Pending</p>
            </div>
            <div style={card}>
              <FiUsers size={24} color="#3b82f6" />
              <h2 style={{ fontSize: '2rem', margin: '8px 0', fontWeight: 700 }}>{usersCount}</h2>
              <p style={{ color: 'rgba(255,255,255,0.7)' }}>Total Users</p>
            </div>
          </div>

          {/* Recent Activity & Pending Verifications side by side */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: 24, marginBottom: 32 }}>
            {/* Recent Companies */}
            <div style={card}>
              <h3 style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                <FiEye /> Recent Activity
              </h3>
              {recentCompanies.length === 0 ? (
                <p style={{ color: 'rgba(255,255,255,0.5)' }}>No companies registered yet.</p>
              ) : (
                <ul style={{ listStyle: 'none', padding: 0 }}>
                  {recentCompanies.map((company, idx) => (
                    <li key={company.id} style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: '10px 0', borderBottom: idx < recentCompanies.length-1 ? '1px solid rgba(255,255,255,0.1)' : 'none'
                    }}>
                      <div>
                        <strong>{company.companyName || 'Unnamed'}</strong><br />
                        <small style={{ color: 'rgba(255,255,255,0.5)' }}>{company.ownerEmail || '—'}</small>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)' }}>{formatDate(company.createdAt)}</span><br />
                        <span style={{
                          padding: '2px 10px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 600,
                          background: company.status === 'verified' ? '#22c55e' : '#f59e0b',
                          color: '#000',
                        }}>
                          {company.status || 'unverified'}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
              <button
                onClick={() => navigate('/admin/companies')}
                style={{ marginTop: 16, background: 'none', border: 'none', color: '#e879f9', cursor: 'pointer', fontWeight: 600 }}
              >
                View All →
              </button>
            </div>

            {/* Pending Verifications */}
            <div style={card}>
              <h3 style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                <FiAlertCircle /> Pending Verifications
              </h3>
              {pendingCompanies.length === 0 ? (
                <p style={{ color: '#22c55e' }}>All companies verified ✓</p>
              ) : (
                <ul style={{ listStyle: 'none', padding: 0 }}>
                  {pendingCompanies.map((company, idx) => (
                    <li key={company.id} style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: '10px 0', borderBottom: idx < pendingCompanies.length-1 ? '1px solid rgba(255,255,255,0.1)' : 'none'
                    }}>
                      <div>
                        <strong>{company.companyName || 'Unnamed'}</strong><br />
                        <small style={{ color: 'rgba(255,255,255,0.5)' }}>{company.ownerEmail || '—'}</small>
                      </div>
                      <button
                        onClick={() => navigate('/admin/companies')}
                        style={{
                          background: 'linear-gradient(135deg, #7e22ce, #c026d3)',
                          border: 'none', borderRadius: 8, color: '#fff', padding: '6px 14px',
                          fontWeight: 600, cursor: 'pointer',
                        }}
                      >
                        Verify Now
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div style={{ ...card, display: 'flex', gap: 16, flexWrap: 'wrap', justifyContent: 'center' }}>
            <button
              onClick={() => navigate('/admin/companies')}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                background: 'linear-gradient(135deg, #7e22ce, #c026d3)',
                border: 'none', borderRadius: 12, color: '#fff', padding: '12px 24px',
                fontWeight: 600, cursor: 'pointer', boxShadow: '0 4px 15px rgba(192,38,211,0.3)',
              }}
            >
              <FiPlus /> Add New Company
            </button>
            <button
              onClick={() => navigate('/admin/users')}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: 12, color: '#fff', padding: '12px 24px', fontWeight: 600,
                cursor: 'pointer', backdropFilter: 'blur(10px)',
              }}
            >
              <FiUsers /> Manage Users
            </button>
            <button
              onClick={() => alert('Audit log will open in a separate panel')}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: 12, color: '#fff', padding: '12px 24px', fontWeight: 600,
                cursor: 'pointer', backdropFilter: 'blur(10px)',
              }}
            >
              <FiEye /> View Audit Log
            </button>
          </div>
        </main>
      </div>
    </>
  );
}
