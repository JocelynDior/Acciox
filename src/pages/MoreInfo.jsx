import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import { FiInfo, FiShield, FiTrendingUp, FiUsers, FiCpu, FiFileText } from 'react-icons/fi';

const pageWrapper = {
  background: 'linear-gradient(135deg, #0f0a1a 0%, #1a0f2e 50%, #2d1b4e 100%)',
  minHeight: '100vh', display: 'flex',
  fontFamily: "'Inter', system-ui, sans-serif",
};
const card = {
  background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(20px)',
  border: '1px solid rgba(255,255,255,0.15)', borderRadius: 16, padding: 24,
  color: '#fff', marginBottom: 20,
};
const gradientTitle = {
  background: 'linear-gradient(to right, #c026d3, #e879f9)',
  WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
  backgroundClip: 'text', fontWeight: 700,
};

const FEATURES = [
  { icon: <FiTrendingUp size={24} color="#c026d3" />, title: 'Financial Reporting', desc: 'Generate detailed P&L statements, cash flow reports, and balance sheets in real time.' },
  { icon: <FiCpu size={24} color="#e879f9" />, title: 'AI-Powered Insights', desc: 'Our AI automatically categorizes transactions, flags anomalies, and provides financial insights using Groq AI.' },
  { icon: <FiUsers size={24} color="#7e22ce" />, title: 'Multi-Role Access', desc: 'Separate dashboards for Admins, Accountants, and Clients — each with the right level of access.' },
  { icon: <FiFileText size={24} color="#a855f7" />, title: 'Invoice Management', desc: 'Create, send, and track invoices. Mark payments and manage overdue accounts easily.' },
  { icon: <FiShield size={24} color="#22c55e" />, title: 'Secure & Private', desc: 'All data is encrypted and stored securely on Firebase. Role-based access ensures data privacy.' },
  { icon: <FiInfo size={24} color="#f59e0b" />, title: 'Tax & Reconciliation', desc: 'Manage tax records and reconcile accounts with ease using our dedicated tax management tools.' },
];

export default function MoreInfo() {
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
          <h1 style={{ ...gradientTitle, fontSize: '2rem', marginBottom: 8 }}>About Acciox</h1>
          <p style={{ color: 'rgba(255,255,255,0.6)', marginBottom: 32, fontSize: '1rem' }}>
            Acciox is an AI-powered accounting and finance platform built for bookkeepers and their clients. It streamlines financial management, automates repetitive tasks, and provides real-time insights — all in one place.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20, marginBottom: 32 }}>
            {FEATURES.map((f, i) => (
              <div key={i} style={card}>
                <div style={{ marginBottom: 12 }}>{f.icon}</div>
                <h3 style={{ margin: '0 0 8px', fontSize: '1.1rem' }}>{f.title}</h3>
                <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem', margin: 0, lineHeight: 1.6 }}>{f.desc}</p>
              </div>
            ))}
          </div>

          <div style={card}>
            <h2 style={{ ...gradientTitle, fontSize: '1.3rem', marginBottom: 12 }}>How It Works</h2>
            <ol style={{ color: 'rgba(255,255,255,0.7)', lineHeight: 2, paddingLeft: 20 }}>
              <li>Admin creates and verifies company accounts</li>
              <li>Accountants are assigned to manage company finances</li>
              <li>Clients can view their company reports and chat with their accountant</li>
              <li>AI automatically categorizes transactions and flags issues</li>
              <li>Reports are generated in real time with charts and export options</li>
            </ol>
          </div>

          <div style={{ ...card, textAlign: 'center' }}>
            <span style={{ ...gradientTitle, fontSize: '1.5rem' }}>Acciox</span>
            <p style={{ color: 'rgba(255,255,255,0.5)', marginTop: 8 }}>v1.0 — AI-Powered Finance Platform</p>
          </div>
        </main>
      </div>
    </>
  );
}
