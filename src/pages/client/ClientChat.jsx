import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import Sidebar from '../../components/Sidebar';
import { FiMessageSquare, FiLock, FiCpu } from 'react-icons/fi';

const pageWrapper = {
  background: 'linear-gradient(135deg, #0f0a1a 0%, #1a0f2e 50%, #2d1b4e 100%)',
  minHeight: '100vh', display: 'flex',
};
const mainContent = { marginLeft: 260, paddingTop: 80, padding: '80px 24px 40px', flex: 1 };
const mobileMain = { ...mainContent, marginLeft: 0 };

export default function ClientChat() {
  const { companyId } = useAuth();
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const isMobile = window.innerWidth <= 768;

  return (
    <>
      <Navbar onMenuClick={() => setSidebarOpen(prev => !prev)} />
      <div style={pageWrapper}>
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <main style={isMobile ? mobileMain : mainContent}>
          <h1 style={{ color: '#fff', marginBottom: 32 }}>Company Chat</h1>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24 }}>
            <Link to={'/company/' + companyId + '/chat/group'} style={{ textDecoration: 'none', color: '#fff' }}>
              <div style={{ background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 16, padding: 24, textAlign: 'center' }}>
                <FiMessageSquare size={32} color="#c026d3" />
                <h2 style={{ margin: '12px 0' }}>Group Chat</h2>
                <p style={{ color: 'rgba(255,255,255,0.7)' }}>Chat with your accountant and team</p>
                <span style={{ display: 'inline-block', marginTop: 12, background: 'linear-gradient(135deg, #7e22ce, #c026d3)', borderRadius: 12, padding: '8px 24px', fontWeight: 600 }}>Open</span>
              </div>
            </Link>
            <Link to={'/company/' + companyId + '/chat/private'} style={{ textDecoration: 'none', color: '#fff' }}>
              <div style={{ background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 16, padding: 24, textAlign: 'center' }}>
                <FiLock size={32} color="#a855f7" />
                <h2 style={{ margin: '12px 0' }}>Private Chat</h2>
                <p style={{ color: 'rgba(255,255,255,0.7)' }}>Send private messages to your accountant</p>
                <span style={{ display: 'inline-block', marginTop: 12, background: 'linear-gradient(135deg, #7e22ce, #c026d3)', borderRadius: 12, padding: '8px 24px', fontWeight: 600 }}>Open</span>
              </div>
            </Link>
            <Link to={'/company/' + companyId + '/chat/ai'} style={{ textDecoration: 'none', color: '#fff' }}>
              <div style={{ background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(20px)', border: '2px solid #c026d3', borderRadius: 16, padding: 24, textAlign: 'center' }}>
                <FiCpu size={32} color="#e879f9" />
                <h2 style={{ margin: '12px 0' }}>AI Assistant</h2>
                <p style={{ color: 'rgba(255,255,255,0.7)' }}>Ask our AI about your finances</p>
                <span style={{ display: 'inline-block', marginTop: 12, background: 'linear-gradient(135deg, #7e22ce, #c026d3)', borderRadius: 12, padding: '8px 24px', fontWeight: 600 }}>Chat with AI</span>
              </div>
            </Link>
          </div>
        </main>
      </div>
    </>
  );
}
