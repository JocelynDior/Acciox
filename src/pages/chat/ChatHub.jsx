import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { db, collection, onSnapshot, query, where } from '../../firebase';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import Sidebar from '../../components/Sidebar';
import { FiMessageSquare, FiLock, FiCpu, FiBriefcase } from 'react-icons/fi';

const pageWrapper = {
  background: 'transparent',
  minHeight: '100vh', display: 'flex',
  fontFamily: "'Inter', system-ui, sans-serif",
};
const card = {
  background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(20px)',
  border: '1px solid rgba(255,255,255,0.15)', borderRadius: 16,
  padding: 24, color: '#fff', cursor: 'pointer', transition: 'all 0.2s',
  textDecoration: 'none', display: 'block',
};
const companyCard = {
  background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
  borderRadius: 12, padding: '14px 20px', color: '#fff', cursor: 'pointer',
  display: 'flex', alignItems: 'center', gap: 14, textDecoration: 'none',
  transition: 'all 0.2s',
};

export default function ChatHub() {
  const { userRole } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(window.innerWidth > 768);
  const [companies, setCompanies] = useState([]);
  const [showCompanies, setShowCompanies] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsDesktop(window.innerWidth > 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const q = query(collection(db, 'companies'), where('status', '==', 'verified'));
    const unsub = onSnapshot(q, snap => {
      setCompanies(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, []);

  const mainContent = {
    marginLeft: isDesktop ? 260 : 0,
    padding: isDesktop ? '80px 24px 40px' : '80px 16px 40px',
    flex: 1,
  };

  return (
    <>
      <Navbar onMenuClick={() => setSidebarOpen(p => !p)} />
      <div style={pageWrapper}>
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <main style={mainContent}>
          <h1 style={{ color: '#fff', marginBottom: 8 }}>Chat</h1>
          <p style={{ color: 'rgba(255,255,255,0.6)', marginBottom: 32 }}>Choose a chat type</p>

          {!showCompanies ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 24 }}>

              {/* Private Chat */}
              <Link to="/chat/private" style={{ ...card, textAlign: 'center' }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 12px 30px rgba(192,38,211,0.2)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; }}
              >
                <FiLock size={36} color="#a855f7" style={{ marginBottom: 12 }} />
                <h2 style={{ margin: '0 0 8px' }}>Private Chat</h2>
                <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem', margin: '0 0 16px' }}>
                  Send private messages to any user
                </p>
                <span style={{ background: 'linear-gradient(135deg, #7e22ce, #c026d3)', borderRadius: 12, padding: '8px 24px', fontWeight: 600, color: '#fff' }}>Open</span>
              </Link>

              {/* Group Chat */}
              <div style={{ ...card, textAlign: 'center' }}
                onClick={() => setShowCompanies(true)}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 12px 30px rgba(192,38,211,0.2)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; }}
              >
                <FiMessageSquare size={36} color="#c026d3" style={{ marginBottom: 12 }} />
                <h2 style={{ margin: '0 0 8px' }}>Group Chat</h2>
                <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem', margin: '0 0 16px' }}>
                  Chat in a company group conversation
                </p>
                <span style={{ background: 'linear-gradient(135deg, #7e22ce, #c026d3)', borderRadius: 12, padding: '8px 24px', fontWeight: 600, color: '#fff' }}>Pick Company</span>
              </div>

              {/* AI Chat */}
              <Link to="/chat/ai" style={{ ...card, textAlign: 'center', border: '2px solid #c026d3' }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 12px 30px rgba(192,38,211,0.3)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; }}
              >
                <FiCpu size={36} color="#e879f9" style={{ marginBottom: 12 }} />
                <h2 style={{ margin: '0 0 8px' }}>AI Assistant</h2>
                <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem', margin: '0 0 16px' }}>
                  Ask the AI about company finances
                </p>
                <span style={{ background: 'linear-gradient(135deg, #7e22ce, #c026d3)', borderRadius: 12, padding: '8px 24px', fontWeight: 600, color: '#fff' }}>Chat with AI</span>
              </Link>

            </div>
          ) : (
            <>
              <button
                onClick={() => setShowCompanies(false)}
                style={{ background: 'none', border: 'none', color: '#e879f9', cursor: 'pointer', fontSize: '0.95rem', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 6 }}
              >
                ← Back
              </button>
              <h2 style={{ color: '#fff', marginBottom: 20 }}>Select a Company</h2>
              {companies.length === 0 ? (
                <p style={{ color: 'rgba(255,255,255,0.5)' }}>No verified companies found.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {companies.map(company => (
                    <Link
                      key={company.id}
                      to={'/company/' + company.id + '/chat/group'}
                      style={companyCard}
                      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(192,38,211,0.15)'; e.currentTarget.style.borderColor = '#c026d3'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'; }}
                    >
                      <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'linear-gradient(135deg, #7e22ce, #c026d3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: '1.1rem', flexShrink: 0 }}>
                        {company.companyName?.charAt(0).toUpperCase() || '?'}
                      </div>
                      <div>
                        <strong style={{ fontSize: '1rem' }}>{company.companyName}</strong>
                        <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem' }}>{company.industry || 'Company'}</div>
                      </div>
                      <FiBriefcase color="#e879f9" style={{ marginLeft: 'auto' }} />
                    </Link>
                  ))}
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </>
  );
}
