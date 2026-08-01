import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import Sidebar from '../../components/Sidebar';
import { FiMessageSquare, FiLock, FiCpu, FiClock } from 'react-icons/fi';

const pageWrapper = {
  background: 'linear-gradient(135deg, #0f0a1a 0%, #1a0f2e 50%, #2d1b4e 100%)',
  minHeight: '100vh', display: 'flex',
  fontFamily: "'Inter', system-ui, sans-serif",
};
const card = {
  background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(20px)',
  border: '1px solid rgba(255,255,255,0.15)', borderRadius: 16,
  padding: 24, textAlign: 'center', color: '#fff',
};
const disabledCard = {
  ...card, opacity: 0.5, cursor: 'not-allowed',
};

export default function ClientChat() {
  const { companyId } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const mainContent = {
    marginLeft: isMobile ? 0 : 260,
    padding: isMobile ? '80px 16px 40px' : '80px 24px 40px',
    flex: 1,
  };

  return (
    <>
      <Navbar onMenuClick={() => setSidebarOpen(prev => !prev)} />
      <div style={pageWrapper}>
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <main style={mainContent}>
          <h1 style={{ color: '#fff', marginBottom: 8 }}>Chat</h1>
          <p style={{ color: 'rgba(255,255,255,0.6)', marginBottom: 32 }}>Choose a chat type below</p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 24 }}>

            {/* Private Chat - always available */}
            <Link to="/chat/private" style={{ textDecoration: 'none' }}>
              <div style={{ ...card, cursor: 'pointer' }}>
                <FiLock size={36} color="#a855f7" style={{ marginBottom: 12 }} />
                <h2 style={{ margin: '0 0 8px' }}>Private Chat</h2>
                <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem', margin: '0 0 16px' }}>
                  Send private messages to your accountant or admin
                </p>
                <span style={{ background: 'linear-gradient(135deg, #7e22ce, #c026d3)', borderRadius: 12, padding: '8px 24px', fontWeight: 600, color: '#fff' }}>Open</span>
              </div>
            </Link>

            {/* Group Chat - only if linked */}
            {companyId ? (
              <Link to={`/company/${companyId}/chat/group`} style={{ textDecoration: 'none' }}>
                <div style={{ ...card, cursor: 'pointer' }}>
                  <FiMessageSquare size={36} color="#c026d3" style={{ marginBottom: 12 }} />
                  <h2 style={{ margin: '0 0 8px' }}>Group Chat</h2>
                  <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem', margin: '0 0 16px' }}>
                    Chat with your accountant and company team
                  </p>
                  <span style={{ background: 'linear-gradient(135deg, #7e22ce, #c026d3)', borderRadius: 12, padding: '8px 24px', fontWeight: 600, color: '#fff' }}>Open</span>
                </div>
              </Link>
            ) : (
              <div style={disabledCard}>
                <FiClock size={36} color="rgba(255,255,255,0.4)" style={{ marginBottom: 12 }} />
                <h2 style={{ margin: '0 0 8px' }}>Group Chat</h2>
                <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.9rem', margin: '0 0 16px' }}>
                  Waiting for admin to link your account to your company
                </p>
                <Link to="/client" style={{ color: '#e879f9', textDecoration: 'none', fontSize: '0.9rem' }}>← Back to Dashboard</Link>
              </div>
            )}

            {/* AI Chat - always available */}
            <Link to="/chat/ai" style={{ textDecoration: 'none' }}>
              <div style={{ ...card, cursor: 'pointer', border: '2px solid #c026d3' }}>
                <FiCpu size={36} color="#e879f9" style={{ marginBottom: 12 }} />
                <h2 style={{ margin: '0 0 8px' }}>AI Assistant</h2>
                <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem', margin: '0 0 16px' }}>
                  Ask our AI about your finances
                </p>
                <span style={{ background: 'linear-gradient(135deg, #7e22ce, #c026d3)', borderRadius: 12, padding: '8px 24px', fontWeight: 600, color: '#fff' }}>Chat with AI</span>
              </div>
            </Link>

          </div>
        </main>
      </div>
    </>
  );
}
