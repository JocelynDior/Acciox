import React, { useState, useEffect } from 'react';
import { db, collection, onSnapshot, query, where, doc } from '../../firebase';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Navbar from '../../components/Navbar';
import Sidebar from '../../components/Sidebar';
import AIIndicator from '../../components/AIIndicator';
import { RevenueLineChart } from '../../components/ReportCharts';
import { toast } from 'react-hot-toast';
import {
  FiDollarSign, FiTrendingUp, FiTrendingDown, FiFileText,
  FiPlus, FiUpload, FiPieChart,
} from 'react-icons/fi';

const pageWrapper = {
  background: 'transparent',
  minHeight: '100vh', display: 'flex',
  fontFamily: "'Inter', system-ui, sans-serif",
};
const card = {
  background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.15)',
  borderRadius: 16, padding: 20, color: '#fff',
};

export default function CompanyDashboard() {
  const { companyId } = useParams();
  const { userRole } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [company, setCompany] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [expenses, setExpenses] = useState([]);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (!companyId) return;
    const unsub = onSnapshot(doc(db, 'companies', companyId), snap => {
      if (snap.exists()) setCompany({ id: snap.id, ...snap.data() });
    });
    return () => unsub();
  }, [companyId]);

  useEffect(() => {
    if (!companyId) return;
    const q = query(collection(db, 'transactions'), where('companyId', '==', companyId));
    const unsub = onSnapshot(q, snap =>
      setTransactions(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    );
    return () => unsub();
  }, [companyId]);

  useEffect(() => {
    if (!companyId) return;
    const q = query(collection(db, 'expenses'), where('companyId', '==', companyId));
    const unsub = onSnapshot(q, snap =>
      setExpenses(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    );
    return () => unsub();
  }, [companyId]);

  const now = new Date();
  const monthlyTx = transactions.filter(tx => {
    if (!tx.createdAt) return false;
    const d = new Date(tx.createdAt.seconds * 1000);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });

  const revenue = monthlyTx
    .filter(t => t.type === 'income')
    .reduce((s, t) => s + parseFloat(t.amount || 0), 0);
  const totalExpenses = monthlyTx
    .filter(t => t.type === 'expense')
    .reduce((s, t) => s + parseFloat(t.amount || 0), 0);
  const netProfit = revenue - totalExpenses;

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
  const chartData = months.map((m, idx) => ({
    month: m,
    revenue: idx === now.getMonth() ? revenue : Math.floor(Math.random() * 5000),
    expenses: idx === now.getMonth() ? totalExpenses : Math.floor(Math.random() * 3000),
  }));

  const mainContent = {
    marginLeft: isMobile ? 0 : 260,
    padding: isMobile ? '80px 16px 40px' : '80px 24px 40px',
    flex: 1,
  };

  return (
    <>
      <Navbar onMenuClick={() => setSidebarOpen(prev => !prev)} />
      <div style={pageWrapper}>
        <Sidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          companyId={companyId}
          companyName={company?.companyName}
        />
        <main style={mainContent}>
          <h1 style={{ color: '#fff', marginBottom: 8 }}>
            {company?.companyName || 'Company Dashboard'}
          </h1>

          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 32 }}>
            <div style={card}>
              <FiDollarSign color="#c026d3" size={24} />
              <h2 style={{ margin: '8px 0' }}>R {revenue.toFixed(2)}</h2>
              <p style={{ color: 'rgba(255,255,255,0.7)', margin: 0 }}>Revenue this month</p>
            </div>
            <div style={card}>
              <FiTrendingDown color="#ef4444" size={24} />
              <h2 style={{ margin: '8px 0' }}>R {totalExpenses.toFixed(2)}</h2>
              <p style={{ color: 'rgba(255,255,255,0.7)', margin: 0 }}>Expenses this month</p>
            </div>
            <div style={card}>
              <FiTrendingUp color={netProfit >= 0 ? '#22c55e' : '#ef4444'} size={24} />
              <h2 style={{ margin: '8px 0', color: netProfit >= 0 ? '#22c55e' : '#ef4444' }}>
                R {netProfit.toFixed(2)}
              </h2>
              <p style={{ color: 'rgba(255,255,255,0.7)', margin: 0 }}>Net Profit/Loss</p>
            </div>
            <div style={card}>
              <FiPieChart color="#f59e0b" size={24} />
              <h2 style={{ margin: '8px 0' }}>R 0.00</h2>
              <p style={{ color: 'rgba(255,255,255,0.7)', margin: 0 }}>Taxes</p>
            </div>
          </div>

          {/* Chart */}
          <div style={{ ...card, marginBottom: 24 }}>
            <RevenueLineChart data={chartData} />
          </div>

          {/* Recent Transactions */}
          <h2 style={{ color: '#fff', marginBottom: 16 }}>Recent Transactions</h2>
          <div style={{ ...card, marginBottom: 24 }}>
            {monthlyTx.length === 0 ? (
              <p style={{ color: 'rgba(255,255,255,0.5)' }}>No transactions this month.</p>
            ) : (
              monthlyTx.slice(0, 5).map(tx => (
                <div key={tx.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.1)', color: '#fff' }}>
                  <span>{tx.description || 'Transaction'}</span>
                  <span>R {parseFloat(tx.amount || 0).toFixed(2)}</span>
                </div>
              ))
            )}
          </div>

          {/* Top Spenders */}
          <h2 style={{ color: '#fff', marginBottom: 16 }}>Top Spenders</h2>
          <div style={{ ...card, marginBottom: 24 }}>
            {expenses.length === 0 ? (
              <p style={{ color: 'rgba(255,255,255,0.5)' }}>No expenses recorded.</p>
            ) : (
              expenses.slice(0, 3).map(e => (
                <div key={e.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', color: '#fff' }}>
                  <span>{e.staffName}</span>
                  <span>R {parseFloat(e.amount || 0).toFixed(2)}</span>
                </div>
              ))
            )}
          </div>

          <div style={{ marginBottom: 24 }}>
            <AIIndicator />
          </div>

          {/* Quick Actions */}
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <Link
              to={'/company/' + companyId + '/transactions'}
              style={{ background: 'linear-gradient(135deg,#7e22ce,#c026d3)', border: 'none', borderRadius: 12, color: '#fff', padding: '12px 24px', textDecoration: 'none', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}
            >
              <FiPlus /> Add Transaction
            </Link>
            <button
              onClick={() => toast('Upload receipt coming soon')}
              style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 12, color: '#fff', padding: '12px 24px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}
            >
              <FiUpload /> Upload Receipt
            </button>
            <Link
              to={'/company/' + companyId + '/reports'}
              style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 12, color: '#fff', padding: '12px 24px', textDecoration: 'none', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}
            >
              <FiFileText /> Generate Report
            </Link>
          </div>
        </main>
      </div>
    </>
  );
}
