import React, { useState, useEffect } from 'react';
import {
  db, collection, onSnapshot, query, where,
} from '../../firebase';
import { useParams } from 'react-router-dom';
import ReportCharts from '../../components/ReportCharts';
import { generateInsight } from '../../services/aiOrchestrator';
import { toast } from 'react-hot-toast';
import Navbar from '../../components/Navbar';
import Sidebar from '../../components/Sidebar';
import {
  FiCalendar, FiFileText, FiDownload, FiCpu,
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
  borderRadius: 16, padding: 20, color: '#fff', marginBottom: 16,
};
const tabStyle = (active) => ({
  padding: '8px 16px', borderRadius: 12, border: 'none', cursor: 'pointer',
  background: active ? 'linear-gradient(135deg, #7e22ce, #c026d3)' : 'transparent',
  color: '#fff', fontWeight: 600, fontSize: '0.85rem',
});

export default function Reports() {
  const { companyId } = useParams();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [activeTab, setActiveTab] = useState('pnl');
  const [transactions, setTransactions] = useState([]);
  const [aiInsight, setAiInsight] = useState(null);

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

  const revenue = transactions.filter(t=>t.type==='income').reduce((s,t)=>s+parseFloat(t.amount||0),0);
  const expenses = transactions.filter(t=>t.type==='expense').reduce((s,t)=>s+parseFloat(t.amount||0),0);

  const handleGenerateInsight = async () => {
    try {
      const result = await generateInsight({ revenue, expenses, transactions });
      setAiInsight(result.insightSummary);
      toast.success('Insight generated');
    } catch (e) { toast.error('Failed to generate insight'); }
  };

  const exportCSV = () => {
    const rows = [['Date','Description','Amount','Type','Category','Status']];
    transactions.forEach(tx => rows.push([tx.date||'', tx.description, tx.amount, tx.type, tx.category, tx.status]));
    const csvContent = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csvContent], {type:'text/csv'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'transactions.csv'; a.click();
  };

  return (
    <>
      <Navbar onMenuClick={() => setSidebarOpen(prev => !prev)} />
      <div style={pageWrapper}>
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} companyId={companyId} />
        <main style={isMobile ? mobileMain : mainContent}>
          <h1 style={{ color: '#fff', fontSize: '1.8rem', marginBottom: 24 }}>Financial Reports</h1>
          <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
            {['pnl','balance','cashflow'].map(tab => (
              <button key={tab} style={tabStyle(activeTab===tab)} onClick={()=>setActiveTab(tab)}>
                {tab==='pnl'?'P&L':tab==='balance'?'Balance Sheet':'Cash Flow'}
              </button>
            ))}
            <div style={{ marginLeft:'auto' }}>
              <button onClick={exportCSV} style={{ background:'rgba(255,255,255,0.1)', border:'1px solid rgba(255,255,255,0.2)', borderRadius:12, color:'#fff', padding:'10px 20px', cursor:'pointer', display:'flex', alignItems:'center', gap:8, marginRight:12 }}><FiDownload /> Export CSV</button>
              <button onClick={()=>toast('PDF export coming soon')} style={{ background:'rgba(255,255,255,0.1)', border:'1px solid rgba(255,255,255,0.2)', borderRadius:12, color:'#fff', padding:'10px 20px', cursor:'pointer', display:'flex', alignItems:'center', gap:8 }}><FiFileText /> Export PDF</button>
            </div>
          </div>

          {activeTab==='pnl' && (
            <div style={card}>
              <h2>Profit & Loss</h2>
              <div style={{ display:'flex', justifyContent:'space-between', marginTop:16 }}>
                <span>Revenue</span><span>${revenue.toFixed(2)}</span>
              </div>
              <div style={{ display:'flex', justifyContent:'space-between', marginTop:8 }}>
                <span>Expenses</span><span>${expenses.toFixed(2)}</span>
              </div>
              <div style={{ display:'flex', justifyContent:'space-between', marginTop:8, borderTop:'1px solid rgba(255,255,255,0.2)', paddingTop:8 }}>
                <strong>Net Profit</strong><strong>${(revenue-expenses).toFixed(2)}</strong>
              </div>
              <div style={{ marginTop:20 }}><ReportCharts transactions={transactions} /></div>
            </div>
          )}

          {activeTab==='balance' && (
            <div style={card}>
              <h2>Balance Sheet</h2>
              <p style={{ color:'rgba(255,255,255,0.6)', marginTop:12 }}>Detailed balance sheet coming soon.</p>
            </div>
          )}
          {activeTab==='cashflow' && (
            <div style={card}>
              <h2>Cash Flow</h2>
              <p style={{ color:'rgba(255,255,255,0.6)', marginTop:12 }}>Cash flow analysis coming soon.</p>
            </div>
          )}

          <div style={{ marginTop: 32 }}>
            <h2 style={{ color: '#fff', marginBottom: 16 }}>AI Insights <FiCpu style={{ verticalAlign:'middle' }} /></h2>
            <button onClick={handleGenerateInsight} style={{ background:'linear-gradient(135deg,#7e22ce,#c026d3)', border:'none', borderRadius:12, color:'#fff', padding:'12px 24px', fontWeight:600, cursor:'pointer' }}>Generate AI Insight</button>
            {aiInsight && <div style={{ ...card, marginTop: 16 }}><p>{aiInsight}</p></div>}
          </div>
        </main>
      </div>
    </>
  );
}
