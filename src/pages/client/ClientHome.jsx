import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { db, collection, onSnapshot, query, where } from '../../firebase';
import { Link } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import Sidebar from '../../components/Sidebar';
import {
  FiEye, FiDollarSign, FiTrendingUp, FiTrendingDown, FiClock, FiFileText, FiMessageSquare, FiFile,
} from 'react-icons/fi';

const pageWrapper = {
  background: 'linear-gradient(135deg, #0f0a1a 0%, #1a0f2e 50%, #2d1b4e 100%)',
  minHeight: '100vh',
  display: 'flex',
};
const mainContent = { marginLeft: 260, paddingTop: 80, padding: '80px 24px 40px', flex: 1 };
const mobileMain = { ...mainContent, marginLeft: 0 };
const card = {
  background: 'rgba(255,255,255,0.08)',
  backdropFilter: 'blur(20px)',
  border: '1px solid rgba(255,255,255,0.15)',
  borderRadius: 16,
  padding: 20,
  color: '#fff',
};

export default function ClientHome() {
  const { currentUser, companyId } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (!companyId) return;
    const q = query(collection(db, 'transactions'), where('companyId', '==', companyId));
    const unsub = onSnapshot(q, snap => setTransactions(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    return () => unsub();
  }, [companyId]);

  const now = new Date();
  const monthlyTx = transactions.filter(tx => {
    if (!tx.createdAt) return false;
    const d = new Date(tx.createdAt.seconds * 1000);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });
  const revenue = monthlyTx.filter(t => t.type === 'income').reduce((s, t) => s + parseFloat(t.amount || 0), 0);
  const expenses = monthlyTx.filter(t => t.type === 'expense').reduce((s, t) => s + parseFloat(t.amount || 0), 0);
  const net = revenue - expenses;
  const pending = monthlyTx.filter(t => t.status === 'pending').length;

  return (
    <>
      <Navbar onMenuClick={() => setSidebarOpen(prev => !prev)} />
      <div style={pageWrapper}>
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <main style={isMobile ? mobileMain : mainContent}>
          <div style={{ marginBottom: 28 }}>
            <h1 style={{ color: '#fff' }}>Welcome, {currentUser?.displayName || 'Client'}</h1>
            <span style={{ background: 'rgba(255,255,255,0.1)', padding: '4px 12px', borderRadius: 20, color: '#fff', fontSize: '0.85rem' }}>👁️ View Only Access</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 32 }}>
            <div style={card}><FiDollarSign color="#c026d3" /><h2>R {revenue.toFixed(2)}</h2><p>Revenue this month</p></div>
            <div style={card}><FiTrendingDown color="#ef4444" /><h2>R {expenses.toFixed(2)}</h2><p>Expenses this month</p></div>
            <div style={card}><FiTrendingUp color={net >= 0 ? '#22c55e' : '#ef4444'} /><h2>R {net.toFixed(2)}</h2><p>Net Profit</p></div>
            <div style={card}><FiClock color="#f59e0b" /><h2>{pending}</h2><p>Pending</p></div>
          </div>

          <h3 style={{ color: '#fff', marginBottom: 16 }}>Recent Transactions</h3>
          <div style={card}>
            {monthlyTx.slice(0, 5).map(tx => (
              <div key={tx.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                <span>{tx.description}</span><span>R {parseFloat(tx.amount || 0).toFixed(2)}</span>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
            <Link to="/client/reports" style={{ ...card, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8 }}><FiFileText /> View Reports</Link>
            <Link to="/client/chat" style={{ ...card, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8 }}><FiMessageSquare /> Open Chat</Link>
            <Link to={'/company/' + companyId + '/invoices'} style={{ ...card, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8 }}><FiFile /> View Invoices</Link>
          </div>
        </main>
      </div>
    </>
  );
}
