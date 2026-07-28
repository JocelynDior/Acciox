import React, { useState, useEffect } from 'react';
import {
  db, collection, onSnapshot, addDoc, updateDoc, doc, serverTimestamp,
  query, where, orderBy, limit,
} from '../../firebase';
import { useParams } from 'react-router-dom';
import { categorizeTransaction } from '../../services/aiOrchestrator';
import TransactionCard from '../../components/TransactionCard';
import { toast } from 'react-hot-toast';
import Navbar from '../../components/Navbar';
import Sidebar from '../../components/Sidebar';
import {
  FiPlus, FiUpload, FiSearch, FiFilter, FiChevronLeft, FiChevronRight,
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

export default function Transactions() {
  const { companyId } = useParams();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [transactions, setTransactions] = useState([]);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [page, setPage] = useState(0);
  const perPage = 20;

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (!companyId) return;
    const q = query(collection(db, 'transactions'),
      where('companyId', '==', companyId),
      orderBy('createdAt', 'desc')
    );
    const unsub = onSnapshot(q, snap => setTransactions(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    return () => unsub();
  }, [companyId]);

  const filtered = transactions.filter(tx => {
    const s = search.toLowerCase();
    const match = (tx.description || '').toLowerCase().includes(s) ||
      (tx.category || '').toLowerCase().includes(s);
    const statusMatch = filterStatus === 'all' || tx.status === filterStatus;
    return match && statusMatch;
  });
  const paginated = filtered.slice(page * perPage, (page + 1) * perPage);
  const totalPages = Math.ceil(filtered.length / perPage);

  const addTransaction = async () => {
    const form = {
      date: prompt('Date (YYYY-MM-DD)'), description: prompt('Description'),
      amount: parseFloat(prompt('Amount')), type: prompt('Type (income/expense)') || 'expense',
      companyId,
    };
    if (!form.description || isNaN(form.amount)) return toast.error('Invalid data');
    try {
      const docRef = await addDoc(collection(db, 'transactions'), {
        ...form, status: 'pending', createdAt: serverTimestamp(),
      });
      const catResult = await categorizeTransaction({ description: form.description, amount: form.amount });
      await updateDoc(docRef, {
        category: catResult.category, confidence: catResult.confidence,
        needsReview: catResult.needsReview,
      });
      toast.success('Transaction added & categorized');
    } catch (err) { toast.error(err.message); }
  };

  const handleUploadCSV = () => {
    toast('CSV upload – coming soon.');
  };

  return (
    <>
      <Navbar onMenuClick={() => setSidebarOpen(prev => !prev)} />
      <div style={pageWrapper}>
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} companyId={companyId} />
        <main style={isMobile ? mobileMain : mainContent}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
            <h1 style={{ color: '#fff', fontSize: '1.8rem' }}>Transactions ({transactions.length})</h1>
            <div style={{ display: 'flex', gap: 12 }}>
              <button onClick={addTransaction} style={{ background: 'linear-gradient(135deg, #7e22ce, #c026d3)', border: 'none', borderRadius: 12, color: '#fff', padding: '12px 24px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}><FiPlus /> Add Transaction</button>
              <button onClick={handleUploadCSV} style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 12, color: '#fff', padding: '12px 24px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}><FiUpload /> Upload CSV</button>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
            <div style={{ display:'flex', alignItems:'center', background:'rgba(255,255,255,0.07)', borderRadius:12, padding:'0 14px', flex:1, minWidth:200 }}>
              <FiSearch color="rgba(255,255,255,0.5)" />
              <input placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} style={{ background:'transparent', border:'none', color:'#fff', padding:'12px 8px', outline:'none', width:'100%' }} />
            </div>
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ background:'rgba(255,255,255,0.07)', border:'1px solid rgba(255,255,255,0.15)', borderRadius:12, color:'#fff', padding:'10px 14px' }}>
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          {/* Transaction list */}
          {paginated.map(tx => (
            <TransactionCard key={tx.id} transaction={tx} />
          ))}

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{ display:'flex', justifyContent:'center', gap:12, marginTop:24 }}>
              <button onClick={() => setPage(p => Math.max(0, p-1))} disabled={page===0} style={{ background:'rgba(255,255,255,0.1)', border:'none', borderRadius:8, color:'#fff', padding:'8px 16px', cursor:'pointer' }}><FiChevronLeft /></button>
              <span style={{ color:'#fff', padding:8 }}>{page+1} / {totalPages}</span>
              <button onClick={() => setPage(p => Math.min(totalPages-1, p+1))} disabled={page>=totalPages-1} style={{ background:'rgba(255,255,255,0.1)', border:'none', borderRadius:8, color:'#fff', padding:'8px 16px', cursor:'pointer' }}><FiChevronRight /></button>
            </div>
          )}
        </main>
      </div>
    </>
  );
}
