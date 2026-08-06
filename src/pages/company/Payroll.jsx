import React, { useState, useEffect } from 'react';
import {
  db, collection, onSnapshot, addDoc, updateDoc, doc, serverTimestamp,
  query, where,
} from '../../firebase';
import { useParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import Navbar from '../../components/Navbar';
import Sidebar from '../../components/Sidebar';
import {
  FiPlus, FiCheckCircle, FiClock, FiAlertCircle,
} from 'react-icons/fi';

const pageWrapper = {
  background: 'transparent',
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

export default function Payroll() {
  const { companyId } = useParams();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(window.innerWidth > 768);
  const [staff, setStaff] = useState([]);
  const [showAddStaff, setShowAddStaff] = useState(false);
  const [showRunPayroll, setShowRunPayroll] = useState(false);
  const [form, setForm] = useState({ name: '', position: '', salary: '', period: 'monthly', bankDetails: '', startDate: '' });

  useEffect(() => {
    const handleResize = () => setIsDesktop(window.innerWidth > 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (!companyId) return;
    const q = query(collection(db, 'payroll'), where('companyId', '==', companyId));
    const unsub = onSnapshot(q, snap => setStaff(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    return () => unsub();
  }, [companyId]);

  const stats = {
    total: staff.reduce((s, m) => s + parseFloat(m.salary || 0), 0),
    paid: staff.filter(m => m.status === 'paid').reduce((s, m) => s + parseFloat(m.salary || 0), 0),
    pending: staff.filter(m => m.status !== 'paid').reduce((s, m) => s + parseFloat(m.salary || 0), 0),
  };

  const handleAddStaff = async (e) => {
    e.preventDefault();
    if (!form.name || !form.salary) return toast.error('Required fields');
    await addDoc(collection(db, 'payroll'), {
      ...form, salary: parseFloat(form.salary), companyId,
      status: 'pending', createdAt: serverTimestamp(),
    });
    toast.success('Staff added');
    setShowAddStaff(false);
    setForm({ name: '', position: '', salary: '', period: 'monthly', bankDetails: '', startDate: '' });
  };

  const handleMarkPaid = async (member) => {
    await updateDoc(doc(db, 'payroll', member.id), { status: 'paid', lastPaid: serverTimestamp() });
    toast.success(`${member.name} marked as paid`);
  };

  const runPayroll = async () => {
    const pendingMembers = staff.filter(m => m.status !== 'paid');
    if (pendingMembers.length === 0) return toast('No pending staff.');
    if (!window.confirm(`Run payroll for ${pendingMembers.length} staff? Total: $${pendingMembers.reduce((s,m)=>s+parseFloat(m.salary||0),0).toFixed(2)}`)) return;
    for (const m of pendingMembers) {
      await updateDoc(doc(db, 'payroll', m.id), { status: 'paid', lastPaid: serverTimestamp() });
    }
    toast.success('Payroll run completed');
    setShowRunPayroll(false);
  };

  return (
    <>
      <Navbar onMenuClick={() => setSidebarOpen(prev => !prev)} />
      <div style={pageWrapper}>
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} companyId={companyId} />
        <main style={isDesktop ? mainContent : mobileMain}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
            <h1 style={{ color: '#fff', fontSize: '1.8rem' }}>Payroll Management</h1>
            <div style={{ display: 'flex', gap: 12 }}>
              <button onClick={() => setShowAddStaff(true)} style={{ background: 'linear-gradient(135deg, #7e22ce, #c026d3)', border: 'none', borderRadius: 12, color: '#fff', padding: '12px 24px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}><FiPlus /> Add Staff</button>
              <button onClick={() => setShowRunPayroll(true)} style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 12, color: '#fff', padding: '12px 24px', cursor: 'pointer' }}>Run Payroll</button>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 16, marginBottom: 24 }}>
            <div style={card}><p>Total This Month</p><h2>${stats.total.toFixed(2)}</h2></div>
            <div style={card}><p>Paid</p><h2>${stats.paid.toFixed(2)}</h2></div>
            <div style={card}><p>Pending</p><h2>${stats.pending.toFixed(2)}</h2></div>
            <div style={card}><p>Staff Count</p><h2>{staff.length}</h2></div>
          </div>

          {staff.map(member => (
            <div key={member.id} style={card}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <strong>{member.name}</strong> – {member.position}<br/>
                  <small>${member.salary} / {member.period}</small>
                </div>
                <div>
                  <span style={{
                    background: member.status === 'paid' ? '#22c55e' : member.lastPaid && new Date(member.lastPaid.seconds*1000) < new Date() ? '#ef4444' : '#f59e0b',
                    color: '#000', padding: '2px 12px', borderRadius: 20, fontSize: '0.8rem', fontWeight: 600
                  }}>{member.status === 'paid' ? 'Paid' : member.status === 'overdue' ? 'Overdue' : 'Pending'}</span>
                  {member.status !== 'paid' && (
                    <button onClick={() => handleMarkPaid(member)} style={{ background: '#22c55e', border: 'none', borderRadius: 8, color: '#000', padding: '6px 12px', cursor: 'pointer', marginLeft: 12 }}>Mark Paid</button>
                  )}
                </div>
              </div>
            </div>
          ))}

          {/* Add Staff Modal */}
          {showAddStaff && (
            <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', zIndex:2000, display:'flex', alignItems:'center', justifyContent:'center' }} onClick={() => setShowAddStaff(false)}>
              <div style={{ background:'rgba(20,10,40,0.95)', border:'1px solid rgba(255,255,255,0.2)', borderRadius:20, padding:30, maxWidth:500, width:'90%', color:'#fff' }} onClick={e=>e.stopPropagation()}>
                <h2>Add Staff Member</h2>
                <form onSubmit={handleAddStaff} style={{ display:'flex', flexDirection:'column', gap:12, marginTop:16 }}>
                  <input placeholder="Full Name" value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} style={inputStyle} />
                  <input placeholder="Position" value={form.position} onChange={e=>setForm(f=>({...f,position:e.target.value}))} style={inputStyle} />
                  <input placeholder="Salary" type="number" value={form.salary} onChange={e=>setForm(f=>({...f,salary:e.target.value}))} style={inputStyle} />
                  <select value={form.period} onChange={e=>setForm(f=>({...f,period:e.target.value}))} style={inputStyle}>
                    <option value="monthly">Monthly</option><option value="weekly">Weekly</option>
                  </select>
                  <input placeholder="Bank Details (masked)" value={form.bankDetails} onChange={e=>setForm(f=>({...f,bankDetails:e.target.value}))} style={inputStyle} />
                  <input type="date" placeholder="Start Date" value={form.startDate} onChange={e=>setForm(f=>({...f,startDate:e.target.value}))} style={inputStyle} />
                  <button type="submit" style={{ background:'linear-gradient(135deg,#7e22ce,#c026d3)', border:'none', borderRadius:12, padding:14, color:'#fff', fontWeight:600, cursor:'pointer' }}>Add Staff</button>
                </form>
              </div>
            </div>
          )}

          {/* Run Payroll Modal */}
          {showRunPayroll && (
            <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', zIndex:2000, display:'flex', alignItems:'center', justifyContent:'center' }} onClick={() => setShowRunPayroll(false)}>
              <div style={{ background:'rgba(20,10,40,0.95)', border:'1px solid rgba(255,255,255,0.2)', borderRadius:20, padding:30, maxWidth:500, width:'90%', color:'#fff' }} onClick={e=>e.stopPropagation()}>
                <h2>Run Payroll</h2>
                <p>{staff.filter(m=>m.status!=='paid').length} staff pending. Total: ${staff.filter(m=>m.status!=='paid').reduce((s,m)=>s+parseFloat(m.salary||0),0).toFixed(2)}</p>
                <button onClick={runPayroll} style={{ background:'linear-gradient(135deg,#7e22ce,#c026d3)', border:'none', borderRadius:12, padding:14, color:'#fff', fontWeight:600, cursor:'pointer', marginTop:16 }}>Confirm Payroll Run</button>
              </div>
            </div>
          )}
        </main>
      </div>
    </>
  );
}
const inputStyle = { background:'rgba(255,255,255,0.07)', border:'1px solid rgba(255,255,255,0.15)', borderRadius:10, padding:12, color:'#fff', outline:'none' };
