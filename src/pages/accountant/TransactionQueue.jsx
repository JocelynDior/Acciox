import React, { useState, useEffect } from 'react';
import {
  db, collection, onSnapshot, updateDoc, doc, serverTimestamp, query, where, orderBy, addDoc,
} from '../../firebase';
import { useAuth } from '../../context/AuthContext';
import { categorizeTransaction } from '../../services/aiOrchestrator';
import { toast } from 'react-hot-toast';
import Navbar from '../../components/Navbar';
import Sidebar from '../../components/Sidebar';
import {
  FiCheckCircle, FiXCircle, FiAlertCircle, FiClock, FiFilter, FiChevronDown,
} from 'react-icons/fi';

// ---- Inline Styles ----
const pageWrapper = {
  background: 'transparent',
  minHeight: '100vh', display: 'flex',
  fontFamily: "'Inter', system-ui, sans-serif",
};
const mainContent = { marginLeft: 260, paddingTop: 80, padding: '80px 24px 40px', flex: 1, transition: 'margin 0.3s' };
const mobileMain = { ...mainContent, marginLeft: 0 };
const card = {
  background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.15)',
  borderRadius: 16, padding: 20, color: '#fff',
};
const gradientTitle = {
  background: 'linear-gradient(to right, #c026d3, #e879f9)',
  WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
  backgroundClip: 'text', fontWeight: 700,
};
const tabStyle = (active) => ({
  padding: '8px 16px', borderRadius: 12, border: 'none', cursor: 'pointer',
  background: active ? 'linear-gradient(135deg, #7e22ce, #c026d3)' : 'transparent',
  color: '#fff', fontWeight: 600, fontSize: '0.85rem', transition: '0.2s',
  marginRight: 8,
});

export default function TransactionQueue() {
  const { currentUser } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(window.innerWidth > 768);
  const [transactions, setTransactions] = useState([]);
  const [filterTab, setFilterTab] = useState('all');
  const [loadingBatch, setLoadingBatch] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsDesktop(window.innerWidth > 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Fetch transactions that need review (pending, flagged, low confidence)
  useEffect(() => {
    const q = query(collection(db, 'transactions'), where('status', 'in', ['pending', 'flagged']));
    const unsub = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setTransactions(list);
    });
    return () => unsub();
  }, []);

  const filteredTxs = transactions.filter(tx => {
    if (filterTab === 'all') return true;
    if (filterTab === 'flagged') return tx.needsReview === true;
    if (filterTab === 'low') return tx.confidence === 'low';
    if (filterTab === 'approved') return tx.status === 'approved';
    return true;
  });

  const pendingCount = transactions.filter(t => t.status === 'pending' || t.status === 'flagged').length;

  const logAudit = async (action, tx) => {
    try {
      await addDoc(collection(db, 'auditLogs'), {
        action, transactionId: tx.id, companyId: tx.companyId,
        performedBy: currentUser?.email, timestamp: serverTimestamp(),
      });
    } catch (e) { console.error('Audit error', e); }
  };

  const handleApprove = async (tx) => {
    try {
      await updateDoc(doc(db, 'transactions', tx.id), {
        status: 'approved', approvedAt: serverTimestamp(), needsReview: false,
      });
      logAudit('APPROVE_TRANSACTION', tx);
      toast.success('Transaction approved');
    } catch (err) { toast.error(err.message); }
  };

  const handleReject = async (tx) => {
    const reason = prompt('Reason for rejection:');
    if (!reason) return;
    try {
      await updateDoc(doc(db, 'transactions', tx.id), {
        status: 'rejected', rejectionReason: reason, rejectedAt: serverTimestamp(),
      });
      logAudit('REJECT_TRANSACTION', tx);
      toast.success('Transaction rejected');
    } catch (err) { toast.error(err.message); }
  };

  const handleRecategorize = async (tx, newCategory) => {
    try {
      await updateDoc(doc(db, 'transactions', tx.id), { category: newCategory, status: 'approved' });
      logAudit('RECATEGORIZE_TRANSACTION', tx);
      toast.success('Category updated');
    } catch (err) { toast.error(err.message); }
  };

  const batchApproveHighConfidence = async () => {
    const highConfidence = transactions.filter(t => t.confidence === 'high' && t.status !== 'approved');
    if (highConfidence.length === 0) return toast('No high-confidence items to approve.');
    setLoadingBatch(true);
    try {
      for (const tx of highConfidence) {
        await updateDoc(doc(db, 'transactions', tx.id), {
          status: 'approved', approvedAt: serverTimestamp(),
        });
      }
      toast.success(`Approved ${highConfidence.length} transactions.`);
    } catch (err) { toast.error(err.message); }
    setLoadingBatch(false);
  };

  const confidenceBadge = (conf) => {
    const colors = { high: '#22c55e', low: '#ef4444', 'single-model': '#f59e0b' };
    return <span style={{ background: colors[conf] || '#888', color: '#000', padding: '2px 10px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 600 }}>{conf}</span>;
  };

  return (
    <>
      <Navbar onMenuClick={() => setSidebarOpen(prev => !prev)} />
      <div style={pageWrapper}>
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <main style={isDesktop ? mainContent : mobileMain}>
          <h1 style={{ ...gradientTitle, fontSize: '1.8rem', display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
            Transaction Review Queue
            {pendingCount > 0 && <span style={{ background: '#c026d3', borderRadius: 20, padding: '2px 12px', fontSize: '0.9rem', color: '#fff' }}>{pendingCount}</span>}
          </h1>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
            <FiFilter color="#e879f9" />
            {['all','flagged','low','approved'].map(tab => (
              <button key={tab} style={tabStyle(filterTab === tab)} onClick={() => setFilterTab(tab)}>
                {tab === 'all' ? 'All' : tab === 'flagged' ? 'Flagged' : tab === 'low' ? 'Low Confidence' : 'Approved'}
              </button>
            ))}
            <button
              onClick={batchApproveHighConfidence}
              disabled={loadingBatch}
              style={{ marginLeft: 'auto', background: 'linear-gradient(135deg, #7e22ce, #c026d3)', border: 'none', borderRadius: 12, color: '#fff', padding: '10px 20px', fontWeight: 600, cursor: 'pointer' }}
            >
              Batch Approve High Confidence
            </button>
          </div>

          {filteredTxs.length === 0 ? (
            <div style={{ ...card, textAlign: 'center', color: 'rgba(255,255,255,0.6)', fontSize: '1.2rem', padding: 60 }}>
              🎉 Queue clear! All transactions reviewed.
            </div>
          ) : (
            filteredTxs.map(tx => (
              <div key={tx.id} style={{ ...card, marginBottom: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <strong>{tx.description || 'No description'}</strong>
                    <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem' }}>
                      {tx.companyName || 'Unknown Company'} • {tx.date || (tx.createdAt ? new Date(tx.createdAt.seconds*1000).toLocaleDateString() : '')} • ${parseFloat(tx.amount||0).toFixed(2)}
                    </div>
                  </div>
                  <div>{confidenceBadge(tx.confidence)}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.9rem' }}>AI Category: {tx.category || 'Uncategorized'}</span>
                  {tx.aiReasoning && <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem' }}>– {tx.aiReasoning}</span>}
                </div>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <button onClick={() => handleApprove(tx)} style={{ background: '#22c55e', border: 'none', borderRadius: 8, color: '#000', padding: '8px 16px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}><FiCheckCircle /> Approve</button>
                  <button onClick={() => handleReject(tx)} style={{ background: '#ef4444', border: 'none', borderRadius: 8, color: '#fff', padding: '8px 16px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}><FiXCircle /> Reject</button>
                  <select
                    onChange={(e) => e.target.value && handleRecategorize(tx, e.target.value)}
                    style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 8, color: '#fff', padding: '8px', cursor: 'pointer' }}
                    defaultValue=""
                  >
                    <option value="" disabled>Re‑categorize</option>
                    <option value="Office Supplies">Office Supplies</option>
                    <option value="Travel">Travel</option>
                    <option value="Meals">Meals</option>
                    <option value="Software">Software</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>
            ))
          )}
        </main>
      </div>
    </>
  );
}
