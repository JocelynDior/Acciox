import React, { useState, useEffect } from 'react';
import Navbar from '../../components/Navbar';
import Sidebar from '../../components/Sidebar';
import { useParams, Link } from 'react-router-dom';
import { FiFileText, FiRefreshCw } from 'react-icons/fi';

const pageWrapper = {
  background: 'linear-gradient(135deg, #0f0a1a 0%, #1a0f2e 50%, #2d1b4e 100%)',
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
  padding: 24, color: '#fff', marginBottom: 16,
};

export default function TaxManagement() {
  const { companyId } = useParams();
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
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} companyId={companyId} />
        <main style={mainContent}>
          <h1 style={{ ...gradientTitle, fontSize: '1.8rem', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 10 }}>
            <FiFileText /> Tax Management
          </h1>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 16, marginBottom: 24 }}>
            <div style={card}>
              <FiFileText size={32} color="#c026d3" style={{ marginBottom: 12 }} />
              <h3>Tax Filing</h3>
              <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem' }}>Manage and track tax filings. Coming soon.</p>
            </div>
            <div style={card}>
              <FiRefreshCw size={32} color="#a855f7" style={{ marginBottom: 12 }} />
              <h3>Reconciliation</h3>
              <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem' }}>Reconcile accounts and transactions.</p>
              <Link to={`/company/${companyId}/reconciliation`} style={{ display: 'inline-block', marginTop: 12, background: 'linear-gradient(135deg, #7e22ce, #c026d3)', borderRadius: 10, padding: '8px 20px', color: '#fff', textDecoration: 'none', fontWeight: 600, fontSize: '0.9rem' }}>
                Open Reconciliation
              </Link>
            </div>
          </div>

          <div style={{ ...card, textAlign: 'center', padding: 40 }}>
            <FiFileText size={48} color="#c026d3" style={{ marginBottom: 16 }} />
            <h2 style={{ marginBottom: 12 }}>Tax Management</h2>
            <p style={{ color: 'rgba(255,255,255,0.6)', maxWidth: 400, margin: '0 auto' }}>
              Full tax management including VAT, income tax tracking, and tax report generation is coming soon.
            </p>
          </div>
        </main>
      </div>
    </>
  );
}
