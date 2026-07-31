import React, { useState, useEffect } from 'react';
import { db, collection, onSnapshot, query, where } from '../../firebase';
import { useAuth } from '../../context/AuthContext';
import { RevenueLineChart, ExpensePieChart } from '../../components/ReportCharts';
import Navbar from '../../components/Navbar';
import Sidebar from '../../components/Sidebar';
import { FiEye, FiDownload, FiFileText } from 'react-icons/fi';
import { toast } from 'react-hot-toast';

const pageWrapper = {
  background: 'linear-gradient(135deg, #0f0a1a 0%, #1a0f2e 50%, #2d1b4e 100%)',
  minHeight: '100vh', display: 'flex',
};
const mainContent = { marginLeft: 260, paddingTop: 80, padding: '80px 24px 40px', flex: 1 };
const mobileMain = { ...mainContent, marginLeft: 0 };
const card = {
  background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(20px)',
  border: '1px solid rgba(255,255,255,0.15)', borderRadius: 16, padding: 20, color: '#fff',
};

export default function ClientReports() {
  const { companyId } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [activeTab, setActiveTab] = useState('pnl');
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

  const exportCSV = () => {
    const rows = [['Date', 'Description', 'Amount', 'Type', 'Category', 'Status']];
    transactions.forEach(tx => rows.push([tx.date || '', tx.description, tx.amount, tx.type, tx.category, tx.status]));
    const csvContent = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'transactions.csv'; a.click();
  };

  const revenue = transactions.filter(t => t.type === 'income').reduce((s, t) => s + parseFloat(t.amount || 0), 0);
  const expenses = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + parseFloat(t.amount || 0), 0);

  const monthlyData = [];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
  months.forEach((m, i) => monthlyData.push({ month: m, revenue: i === new Date().getMonth() ? revenue : Math.floor(Math.random() * 5000), expenses: i === new Date().getMonth() ? expenses : Math.floor(Math.random() * 3000) }));

  const categoryData = {};
  transactions.filter(t => t.type === 'expense').forEach(t => {
    const cat = t.category || 'Other';
    categoryData[cat] = (categoryData[cat] || 0) + parseFloat(t.amount || 0);
  });
  const pieData = Object.entries(categoryData).map(([name, value]) => ({ name, value }));

  return (
    <>
      <Navbar onMenuClick={() => setSidebarOpen(prev => !prev)} />
      <div style={pageWrapper}>
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <main style={isMobile ? mobileMain : mainContent}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
            <h1 style={{ color: '#fff' }}>Financial Reports <span style={{ fontSize: '0.8rem', background: 'rgba(255,255,255,0.1)', borderRadius: 20, padding: '2px 12px' }}>👁️ View Only</span></h1>
            <div style={{ display: 'flex', gap: 12 }}>
              <button onClick={exportCSV} style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 12, color: '#fff', padding: '8px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}><FiDownload /> Export CSV</button>
              <button onClick={() => toast('PDF export coming soon')} style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 12, color: '#fff', padding: '8px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}><FiFileText /> Export PDF</button>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
            {['pnl', 'expenses', 'cashflow'].map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)} style={{
                padding: '8px 16px', borderRadius: 12, border: 'none', background: activeTab === tab ? '#c026d3' : 'rgba(255,255,255,0.1)', color: '#fff', fontWeight: 600,
              }}>
                {tab === 'pnl' ? 'P&L' : tab === 'expenses' ? 'Expenses' : 'Cash Flow'}
              </button>
            ))}
          </div>

          {activeTab === 'pnl' && (
            <div style={card}>
              <h2>Profit & Loss</h2>
              <p>Revenue: R {revenue.toFixed(2)}</p>
              <p>Expenses: R {expenses.toFixed(2)}</p>
              <div style={{ marginTop: 20 }}><RevenueLineChart data={monthlyData} /></div>
            </div>
          )}
          {activeTab === 'expenses' && (
            <div style={card}>
              <h2>Expense Breakdown</h2>
              <ExpensePieChart data={pieData} />
            </div>
          )}
          {activeTab === 'cashflow' && (
            <div style={card}>
              <h2>Cash Flow</h2>
              <p>Coming soon</p>
            </div>
          )}
        </main>
      </div>
    </>
  );
}
