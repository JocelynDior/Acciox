import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import Navbar from '../../components/Navbar';
import Sidebar from '../../components/Sidebar';
import {
  FiTrendingUp, FiPieChart, FiSun, FiDollarSign, FiBookOpen, FiInfo,
} from 'react-icons/fi';

const pageWrapper = {
  background: 'transparent',
  minHeight: '100vh',
  display: 'flex',
};

const card = {
  background: 'rgba(255,255,255,0.08)',
  backdropFilter: 'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)',
  border: '1px solid rgba(255,255,255,0.15)',
  borderRadius: 16,
  padding: 20,
  color: '#fff',
};

const placeholderCards = [
  { icon: <FiTrendingUp size={24} color="#22c55e" />, title: 'Investment Planning', desc: 'Personalized strategies to grow your wealth.' },
  { icon: <FiSun size={24} color="#f59e0b" />, title: 'Retirement Planning', desc: 'Secure your future with tailored retirement plans.' },
  { icon: <FiDollarSign size={24} color="#3b82f6" />, title: 'Tax Advice', desc: 'Optimize your tax position with expert guidance.' },
  { icon: <FiBookOpen size={24} color="#e879f9" />, title: 'Budget Planning', desc: 'Track and manage your cash flow effectively.' },
];

export default function FinancialAdvice() {
  const { currentUser, companyId } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(window.innerWidth > 768);

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
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <main style={mainContent}>
          <div style={{ marginBottom: 28, display: 'flex', alignItems: 'center', gap: 12 }}>
            <h1 style={{ color: '#fff', fontSize: '1.8rem', margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
              <FiTrendingUp color="#c026d3" /> Financial Advice
            </h1>
            <span style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 20, padding: '4px 12px', color: '#fff', fontSize: '0.8rem' }}>
              👁️ View Only
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: isDesktop ? 'repeat(2, 1fr)' : '1fr', gap: 16, marginBottom: 32 }}>
            {placeholderCards.map((item, i) => (
              <div key={i} style={card}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                  {item.icon}
                  <h3 style={{ margin: 0, fontSize: '1.1rem' }}>{item.title}</h3>
                  <span style={{ marginLeft: 'auto', background: 'rgba(255,255,255,0.1)', borderRadius: 20, padding: '2px 10px', fontSize: '0.7rem', color: '#e879f9' }}>Coming Soon</span>
                </div>
                <p style={{ color: 'rgba(255,255,255,0.6)', margin: 0 }}>{item.desc}</p>
              </div>
            ))}
          </div>

          <div style={{ ...card, textAlign: 'center', padding: 30 }}>
            <FiInfo size={24} color="#e879f9" style={{ marginBottom: 12 }} />
            <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '1rem', margin: 0 }}>
              Need advice? Your accountant will provide personalized financial advice here soon.
            </p>
          </div>
        </main>
      </div>
    </>
  );
}
