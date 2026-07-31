import React, { useState, useEffect } from 'react';
import {
  db, collection, onSnapshot, query, where, doc,
} from '../../firebase';
import { useParams, Link } from 'react-router-dom';
import { RevenueLineChart } from '../../components/ReportCharts';
import AIIndicator from '../../components/AIIndicator';
import { toast } from 'react-hot-toast';
import Navbar from '../../components/Navbar';
import Sidebar from '../../components/Sidebar';
import {
  FiDollarSign, FiTrendingUp, FiTrendingDown, FiClock, FiPlus, FiUpload, FiFileText,
} from 'react-icons/fi';

const pageWrapper = {
  background: 'linear-gradient(135deg, #0f0a1a 0%, #1a0f2e 50%, #2d1b4e 100%)',
  minHeight: '100vh', display: 'flex',
  fontFamily: "'Inter', system-ui, sans-serif",
};
const mainContent = { marginLeft: 260, paddingTop: 80, padding: '80px 24px 40px', flex: 1 };
const mobileMain = { ...mainContent, marginLeft: 0 };
const card = {
  background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.15)',
  borderRadius: 16, padding: 20, color: '#fff',
};

export default function CompanyDashboard() {
  const { companyId } = useParams();
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
    const unsub = onSnapshot(q, snap => setTransactions(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    return () => unsub();
  }, [companyId]);

  useEffect(() => {
    if (!companyId) return;
    const q = query(collection(db, 'expenses'), where('companyId', '==', companyId));
    const unsub = onSnapshot(q, snap => setExpenses(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    return () => unsub();
  }, [companyId]);

  const now = new Date();
  const monthlyTx = transactions.filter(tx => {
    if (!tx.createdAt) return false;
    const d = new Date(tx.createdAt.seconds * 1000);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });
  const revenue = monthlyTx.filter(t => t.type === 'income').reduce((s, t) => s + parseFloat(t.amount || 0), 0);
  const totalExpenses = monthlyTx.filter(t => t.type === 'expense').reduce((s, t) => s + parseFloat(t.amount || 0), 0);
  const netProfit = revenue - totalExpenses;
  const pendingCount = monthlyTx.filter(t => t.status === 'pending').length;

  // Prepare data for the revenue chart (simplified monthly aggregation)
  const chartData = [];
  // You could compute real monthly data, here just a placeholder
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
  months.forEach((m, idx) => {
    chartData.push({
      month: m,
      revenue: idx === now.getMonth() ? revenue : Math.floor(Math.random() * 5000),
      expenses: idx === now.getMonth() ? totalExpenses : Math.floor(Math.random() * 3000),
    });
  });

  return (
    <>
      <Navbar onMenuClick={() => setSidebarOpen(prev => !prev)} />
      <div style={pageWrapper}>
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} companyId={companyId} companyName={company?.companyName} />
        <main style={isMobile ? mobileMain : mainContent}>
          <h1 style={{ color: '#fff', marginBottom: 8 }}>{company?.companyName || 'Company Dashboard'}</h1>

          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 32 }}>
            <div style={card}><FiDollarSign color="#c026d3" /><h2>R {revenue.toFixed(2)}</h2><p>Revenue this month</p></div>
            <div style={card}><FiTrendingDown color="#ef4444" /><h2>R {totalExpenses.toFixed(2)}</h2><p>Expenses this month</p></div>
            <div style={card}><FiTrendingUp color={netProfit >= 0 ? '#22c55e' : '#ef4444'} /><h2>R {netProfit.toFixed(2)}</h2><p>Net Profit</p></div>
            <div style={card}><FiClock color="#f59e0b" /><h2>{pendingCount}</h2><p>Pending Transactions</p></div>
          </div>

          {/* Chart using RevenueLineChart */}
          <div style={card}><RevenueLineChart data={chartData} /></div>

          {/* Recent transactions (last 5) */}
          <h2 style={{ color: '#fff', marginTop: 24, marginBottom: 16 }}>Recent Transactions</h2>
          <div style={card}>
            {monthlyTx.slice(0, 5).map(tx => (
              <div key={tx.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                <span>{tx.description}</span><span>R {parseFloat(tx.amount || 0).toFixed(2)}</span>
              </div>
            ))}
          </div>

          {/* Staff expenses top 3 */}
          <h2 style={{ color: '#fff', marginTop: 24, marginBottom: 16 }}>Top Spenders</h2>
          <div style={card}>
            {expenses.slice(0, 3).map(e => (
              <div key={e.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0' }}>
                <span>{e.staffName}</span><span>R {parseFloat(e.amount || 0).toFixed(2)}</span>
              </div>
            ))}
          </div>

          {/* AI Indicator */}
          <div style={{ marginTop: 24 }}><AIIndicator /></div>

          {/* Quick Actions */}
          <div style={{ display: 'flex', gap: 12, marginTop: 24, flexWrap: 'wrap' }}>
            <Link to={'/company/' + companyId + '/transactions'} style={{ background: 'linear-gradient(135deg,#7e22ce,#c026d3)', border: 'none', borderRadius: 12, color: '#fff', padding: '12px 24px', textDecoration: 'none', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}><FiPlus /> Add Transaction</Link>
            <button onClick={() => toast('Upload receipt coming soon')} style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 12, color: '#fff', padding: '12px 24px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}><FiUpload /> Upload Receipt</button>
            <Link to={'/company/' + companyId + '/reports'} style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 12, color: '#fff', padding: '12px 24px', textDecoration: 'none', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}><FiFileText /> Generate Report</Link>
          </div>
        </main>
      </div>
    </>
  );
}
