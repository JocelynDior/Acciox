import React, { useState, useEffect } from 'react';
import {
  db, collection, onSnapshot, addDoc, updateDoc, doc, serverTimestamp,
} from '../../firebase';
import { useParams } from 'react-router-dom';
import { analyzeExpense } from '../../services/aiOrchestrator';
import { toast } from 'react-hot-toast';
import Navbar from '../../components/Navbar';
import Sidebar from '../../components/Sidebar';
import {
  FiPlus, FiCheckCircle, FiXCircle, FiClock, FiPaperclip,
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
const gradientTitle = {
  background: 'linear-gradient(to right, #c026d3, #e879f9)',
  WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
  backgroundClip: 'text', fontWeight: 700,
};

export default function StaffExpenses() {
  const { companyId } = useParams();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [expenses, setExpenses] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ staffName:'', description:'', amount:'', category:'', date:'', receipt:null });

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (!companyId) return;
    const q = query(collection(db, 'expenses'), where('companyId','==',companyId), orderBy('createdAt','desc'));
    const unsub = onSnapshot(q, snap => setExpenses(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    return () => unsub();
  }, [companyId]);

  const stats = {
    total: expenses.reduce((s,e)=>s+parseFloat(e.amount||0),0),
    approved: expenses.filter(e=>e.status==='approved').reduce((s,e)=>s+parseFloat(e.amount||0),0),
    pending: expenses.filter(e=>e.status==='pending').reduce((s,e)=>s+parseFloat(e.amount||0),0),
    rejected: expenses.filter(e=>e.status==='rejected').reduce((s,e)=>s+parseFloat(e.amount||0),0),
  };

  const handleAddExpense = async (e) => {
    e.preventDefault();
    if (!form.staffName || !form.amount) return toast.error('Required fields missing.');
    try {
      const docRef = await addDoc(collection(db, 'expenses'), {
        ...form, amount: parseFloat(form.amount), companyId, status: 'pending', createdAt: serverTimestamp(),
      });
      const analysis = await analyzeExpense(form);
      await updateDoc(docRef, {
        aiLegitimate: analysis.isLegitimate,
        aiReason: analysis.reason,
        confidence: analysis.confidence,
        needsReview: analysis.needsReview,
      });
      toast.success('Expense submitted & analyzed.');
      setShowAdd(false);
      setForm({ staffName:'', description:'', amount:'', category:'', date:'' });
    } catch (err) { toast.error(err.message); }
  };

  const handleApprove = async (expense) => {
    await updateDoc(doc(db, 'expenses', expense.id), { status:'approved', approvedAt:serverTimestamp() });
    toast.success('Expense approved');
  };
  const handleReject = async (expense) => {
    const reason = prompt('Rejection reason:');
    if (!reason) return;
    await updateDoc(doc(db, 'expenses', expense.id), { status:'rejected', rejectionReason:reason });
    toast.success('Expense rejected');
  };

  return (
    <>
      <Navbar onMenuClick={() => setSidebarOpen(prev => !prev)} />
      <div style={pageWrapper}>
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} companyId={companyId} />
        <main style={isMobile ? mobileMain : mainContent}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:24, flexWrap:'wrap', gap:12 }}>
            <h1 style={{ ...gradientTitle, fontSize:'1.8rem' }}>Staff Expenses</h1>
            <button onClick={() => setShowAdd(true)} style={{ background:'linear-gradient(135deg,#7e22ce,#c026d3)', border:'none', borderRadius:12, color:'#fff', padding:'12px 24px', fontWeight:600, cursor:'pointer', display:'flex', alignItems:'center', gap:8 }}><FiPlus/> Submit Expense</button>
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(150px,1fr))', gap:16, marginBottom:24 }}>
            <div style={card}><p>Total Claimed</p><h2>${stats.total.toFixed(2)}</h2></div>
            <div style={card}><p>Approved</p><h2>${stats.approved.toFixed(2)}</h2></div>
            <div style={card}><p>Pending</p><h2>${stats.pending.toFixed(2)}</h2></div>
            <div style={card}><p>Rejected</p><h2>${stats.rejected.toFixed(2)}</h2></div>
          </div>

          {expenses.map(exp => (
            <div key={exp.id} style={card}>
              <div style={{ display:'flex', justifyContent:'space-between' }}>
                <div>
                  <strong>{exp.staffName}</strong> – {exp.description}<br/>
                  <small>{exp.category} • {exp.date}</small>
                </div>
                <div style={{ textAlign:'right' }}>
                  <span style={{ fontWeight:600 }}>${parseFloat(exp.amount).toFixed(2)}</span><br/>
                  <span style={{ background: exp.aiLegitimate===false ? '#ef4444' : '#22c55e', color:'#000', padding:'2px 10px', borderRadius:20, fontSize:'0.75rem' }}>{exp.aiLegitimate===false ? 'Suspicious' : 'Legitimate'}</span>
                  <div style={{ marginTop:8 }}>
                    {exp.status === 'pending' && (
                      <>
                        <button onClick={() => handleApprove(exp)} style={{ background:'#22c55e', border:'none', borderRadius:8, color:'#000', padding:'6px 12px', cursor:'pointer', marginRight:8 }}>Approve</button>
                        <button onClick={() => handleReject(exp)} style={{ background:'#ef4444', border:'none', borderRadius:8, color:'#fff', padding:'6px 12px', cursor:'pointer' }}>Reject</button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}

          {showAdd && (
            <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', zIndex:2000, display:'flex', alignItems:'center', justifyContent:'center' }} onClick={() => setShowAdd(false)}>
              <div style={{ background:'rgba(20,10,40,0.95)', backdropFilter:'blur(25px)', border:'1px solid rgba(255,255,255,0.2)', borderRadius:20, padding:30, maxWidth:500, width:'90%', color:'#fff' }} onClick={e=>e.stopPropagation()}>
                <h2>Submit Expense</h2>
                <form onSubmit={handleAddExpense} style={{ display:'flex', flexDirection:'column', gap:12, marginTop:16 }}>
                  <input placeholder="Staff Name" value={form.staffName} onChange={e=>setForm(f=>({...f,staffName:e.target.value}))} style={inputStyle} />
                  <input placeholder="Description" value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))} style={inputStyle} />
                  <input placeholder="Amount" type="number" value={form.amount} onChange={e=>setForm(f=>({...f,amount:e.target.value}))} style={inputStyle} />
                  <select value={form.category} onChange={e=>setForm(f=>({...f,category:e.target.value}))} style={inputStyle}>
                    <option value="">Category</option><option value="Travel">Travel</option><option value="Meals">Meals</option><option value="Office Supplies">Office Supplies</option>
                  </select>
                  <input type="date" value={form.date} onChange={e=>setForm(f=>({...f,date:e.target.value}))} style={inputStyle} />
                  <button type="submit" style={{ background:'linear-gradient(135deg,#7e22ce,#c026d3)', border:'none', borderRadius:12, padding:14, color:'#fff', fontWeight:600, cursor:'pointer' }}>Submit Expense</button>
                </form>
              </div>
            </div>
          )}
        </main>
      </div>
    </>
  );
}
const inputStyle = { background:'rgba(255,255,255,0.07)', border:'1px solid rgba(255,255,255,0.15)', borderRadius:10, padding:12, color:'#fff', outline:'none' };
