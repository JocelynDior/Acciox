import React from 'react';
import { useAuth } from '../context/AuthContext';
import { db, doc, updateDoc, serverTimestamp } from '../firebase';
import { toast } from 'react-hot-toast';
import { FiCheckCircle, FiXCircle, FiChevronDown } from 'react-icons/fi';

const cardStyle = {
  background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(20px)',
  border: '1px solid rgba(255,255,255,0.15)', borderRadius: 16, padding: 20,
  color: '#fff', marginBottom: 12, transition: 'all 0.2s ease',
};

export default function TransactionCard({ transaction, onApprove, onReject, showActions = true }) {
  const { currentUser } = useAuth();
  const confidenceColors = { high: '#22c55e', low: '#ef4444', 'single-model': '#f59e0b' };
  const statusColors = { pending: '#f59e0b', approved: '#22c55e', rejected: '#ef4444' };

  const handleApprove = async () => {
    try {
      await updateDoc(doc(db, 'transactions', transaction.id), { status: 'approved', approvedAt: serverTimestamp() });
      toast.success('Approved');
      onApprove && onApprove(transaction);
    } catch (err) { toast.error(err.message); }
  };

  const handleReject = async () => {
    const reason = prompt('Rejection reason:');
    if (!reason) return;
    try {
      await updateDoc(doc(db, 'transactions', transaction.id), { status: 'rejected', rejectionReason: reason });
      toast.success('Rejected');
      onReject && onReject(transaction);
    } catch (err) { toast.error(err.message); }
  };

  return (
    <div
      style={cardStyle}
      onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
      onMouseLeave={e => e.currentTarget.style.transform = ''}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'linear-gradient(135deg, #7e22ce, #c026d3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>
          {transaction.category?.charAt(0)?.toUpperCase() || '?'}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <strong>{transaction.description || 'No description'}</strong>
            <span style={{ color: transaction.type === 'income' ? '#22c55e' : '#ef4444', fontWeight: 600 }}>
              {transaction.type === 'income' ? '+' : '-'}R {parseFloat(transaction.amount || 0).toFixed(2)}
            </span>
          </div>
          <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)' }}>
            {transaction.date || (transaction.createdAt ? new Date(transaction.createdAt.seconds * 1000).toLocaleDateString() : '')}
          </div>
          <div style={{ marginTop: 8, display: 'flex', gap: 8, alignItems: 'center' }}>
            <span style={{ background: 'rgba(255,255,255,0.15)', padding: '2px 10px', borderRadius: 20, fontSize: '0.75rem' }}>
              {transaction.category || 'Uncategorized'}
            </span>
            <span style={{ background: confidenceColors[transaction.confidence] || '#888', color: '#000', padding: '2px 10px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 600 }}>
              {transaction.confidence || 'N/A'}
            </span>
            <span style={{ background: statusColors[transaction.status] || '#888', color: '#000', padding: '2px 10px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 600 }}>
              {transaction.status}
            </span>
          </div>
          {transaction.aiReasoning && (
            <small style={{ color: 'rgba(255,255,255,0.4)', display: 'block', marginTop: 4 }}>AI: {transaction.aiReasoning}</small>
          )}
        </div>
      </div>
      {showActions && transaction.status === 'pending' && (
        <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
          <button onClick={handleApprove} style={{ background: '#22c55e', border: 'none', borderRadius: 8, padding: '8px 16px', color: '#000', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
            <FiCheckCircle /> Approve
          </button>
          <button onClick={handleReject} style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 8, padding: '8px 16px', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
            <FiXCircle /> Reject
          </button>
        </div>
      )}
    </div>
  );
}
