import React, { useState, useEffect } from 'react';
import Navbar from '../../components/Navbar';
import Sidebar from '../../components/Sidebar';
import { useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { FiCreditCard } from 'react-icons/fi';

const pageWrapper = {
  background: 'transparent',
  minHeight: '100vh', display: 'flex',
  fontFamily: "'Inter', system-ui, sans-serif",
};
const gradientTitle = {
  background: 'linear-gradient(to right, #c026d3, #e879f9)',
  WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
  backgroundClip: 'text', fontWeight: 700,
};
const card = {
  background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(20px)',
  border: '1px solid rgba(255,255,255,0.15)', borderRadius: 16,
  padding: 40, color: '#fff', textAlign: 'center',
};

export default function AccountManagement() {
  const { companyId } = useParams();
  const { userRole } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(window.innerWidth > 768);
  const isReadOnly = userRole === 'client';

  useEffect(() => {
    const handleResize = () => setIsDesktop(window.innerWidth > 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const mainContent = {
    marginLeft: isDesktop ? 260 : 0,
    padding: isDesktop ? '80px 24px 40px' : '80px 16px 40px',
    flex: 1,
  };

  return (
    <>
      <Navbar onMenuClick={() => setSidebarOpen(prev => !prev)} />
      <div style={pageWrapper}>
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} companyId={companyId} />
        <main style={mainContent}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
            <h1 style={{ ...gradientTitle, fontSize: '1.8rem', display: 'flex', alignItems: 'center', gap: 10, margin: 0 }}>
              <FiCreditCard /> Account Management
            </h1>
            {isReadOnly && (
              <span style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 20, padding: '4px 14px', color: '#fff', fontSize: '0.8rem' }}>👁️ View Only</span>
            )}
          </div>
          <div style={card}>
            <FiCreditCard size={48} color="#c026d3" style={{ marginBottom: 16 }} />
            <h2 style={{ marginBottom: 12 }}>Account Management</h2>
            <p style={{ color: 'rgba(255,255,255,0.6)', maxWidth: 400, margin: '0 auto' }}>
              Manage bank accounts, chart of accounts, and financial account structures. This feature is coming soon.
            </p>
          </div>
        </main>
      </div>
    </>
  );
}
