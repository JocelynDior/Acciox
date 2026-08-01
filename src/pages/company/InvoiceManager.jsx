import React, { useState, useEffect } from 'react';
import {
  db, collection, onSnapshot, addDoc, updateDoc, doc, serverTimestamp,
  query, where, orderBy,
} from '../../firebase';
import { useParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import Navbar from '../../components/Navbar';
import Sidebar from '../../components/Sidebar';
import {
  FiPlus, FiEdit, FiTrash2, FiCheckCircle, FiClock, FiAlertCircle,
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
const tabStyle = (active) => ({
  padding: '8px 16px', borderRadius: 12, border: 'none', cursor: 'pointer',
  background: active ? 'linear-gradient(135deg, #7e22ce, #c026d3)' : 'transparent',
  color: '#fff', fontWeight: 600, fontSize: '0.85rem', marginRight: 8,
});

export default function InvoiceManager() {
  const { companyId } = useParams();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [invoices, setInvoices] = useState([]);
  const [filterTab, setFilterTab] = useState('all');
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({
    clientName: '', clientEmail: '', items: [{ description: '', amount: '' }],
    dueDate: '', notes: '',
  });

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (!companyId) return;
    const q = query(collection(db, 'invoices'), where('companyId', '==', companyId), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, snap => setInvoices(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    return () => unsub();
  }, [companyId]);

  const stats = {
    total: invoices.length,
    paid: invoices.filter(i => i.status === 'paid').length,
    pending: invoices.filter(i => i.status === 'sent' || i.status === 'draft').length,
    overdue: invoices.filter(i => i.status === 'overdue').length,
  };

  const filtered = filterTab === 'all' ? invoices : invoices.filter(i => i.status === filterTab);

  const addInvoiceItem = () => setForm(f => ({ ...f, items: [...f.items, { description: '', amount: '' }] }));

  const updateItem = (idx, field, value) => {
    const newItems = [...form.items];
    newItems[idx][field] = value;
    setForm(f => ({ ...f, items: newItems }));
  };

  const totalAmount = form.items.reduce((sum, item) => sum + parseFloat(item.amount || 0), 0);
  const invoiceNumber = `INV-${Date.now().toString(36).toUpperCase()}`;

  const handleCreateInvoice = async (send = false) => {
    if (!form.clientName || !form.items.length) return toast.error('Required fields missing');
    try {
      await addDoc(collection(db, 'invoices'), {
        ...form, items: form.items.map(i => ({ ...i, amount: parseFloat(i.amount) })),
        companyId, invoiceNumber, status: send ? 'sent' : 'draft',
        createdAt: serverTimestamp(), dueDate: form.dueDate,
      });
      toast.success(send ? 'Invoice sent' : 'Draft saved');
      setShowCreate(false);
    } catch (err) { toast.error(err.message); }
  };

  const handleMarkPaid = async (invoice) => {
    await updateDoc(doc(db, 'invoices', invoice.id), { status: 'paid', paidAt: serverTimestamp() });
    toast.success('Invoice marked as paid');
  };

  const handleDelete = async (invoice) => {
    if (!confirm('Delete invoice?')) return;
    await deleteDoc(doc(db, 'invoices', invoice.id));
    toast.success('Invoice deleted');
  };

  return (
    <>
      <Navbar onMenuClick={() => setSidebarOpen(prev => !prev)} />
      <div style={pageWrapper}>
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} companyId={companyId} />
        <main style={isMobile ? mobileMain : mainContent}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
            <h1 style={{ color: '#fff', fontSize: '1.8rem' }}>Invoice Manager</h1>
            <button onClick={() => setShowCreate(true)} style={{ background: 'linear-gradient(135deg, #7e22ce, #c026d3)', border: 'none', borderRadius: 12, color: '#fff', padding: '12px 24px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}><FiPlus /> Create Invoice</button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 16, marginBottom: 24 }}>
            <div style={card}><p>Total</p><h2>{stats.total}</h2></div>
            <div style={card}><p>Paid</p><h2>{stats.paid}</h2></div>
            <div style={card}><p>Pending</p><h2>{stats.pending}</h2></div>
            <div style={card}><p>Overdue</p><h2>{stats.overdue}</h2></div>
          </div>

          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            {['all','draft','sent','paid','overdue'].map(tab => (
              <button key={tab} style={tabStyle(filterTab===tab)} onClick={() => setFilterTab(tab)}>
                {tab.charAt(0).toUpperCase()+tab.slice(1)}
              </button>
            ))}
          </div>

          {filtered.map(inv => (
            <div key={inv.id} style={card}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <strong>{inv.invoiceNumber}</strong> – {inv.clientName}<br/>
                  <small>{inv.clientEmail} · Due {inv.dueDate}</small>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontWeight: 600 }}>${inv.items.reduce((s,i)=>s+parseFloat(i.amount||0),0).toFixed(2)}</span><br/>
                  <span style={{
                    background: inv.status === 'paid' ? '#22c55e' : inv.status === 'overdue' ? '#ef4444' : '#f59e0b',
                    color: '#000', padding: '2px 10px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 600
                  }}>{inv.status}</span>
                  <div style={{ marginTop: 8 }}>
                    {inv.status !== 'paid' && (
                      <button onClick={() => handleMarkPaid(inv)} style={{ background: '#22c55e', border: 'none', borderRadius: 8, color: '#000', padding: '6px 12px', cursor: 'pointer', marginRight: 8 }}>Mark Paid</button>
                    )}
                    <button onClick={() => handleDelete(inv)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}><FiTrash2 /></button>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {/* Create Invoice Modal */}
          {showCreate && (
            <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', zIndex:2000, display:'flex', alignItems:'center', justifyContent:'center' }} onClick={() => setShowCreate(false)}>
              <div style={{ background:'rgba(20,10,40,0.95)', border:'1px solid rgba(255,255,255,0.2)', borderRadius:20, padding:30, maxWidth:600, width:'90%', color:'#fff', maxHeight:'80vh', overflowY:'auto' }} onClick={e=>e.stopPropagation()}>
                <h2>Create Invoice</h2>
                <div style={{ marginTop: 16, display:'flex', flexDirection:'column', gap:12 }}>
                  <input placeholder="Client Name" value={form.clientName} onChange={e=>setForm(f=>({...f,clientName:e.target.value}))} style={inputStyle} />
                  <input placeholder="Client Email" value={form.clientEmail} onChange={e=>setForm(f=>({...f,clientEmail:e.target.value}))} style={inputStyle} />
                  {form.items.map((item, idx) => (
                    <div key={idx} style={{ display:'flex', gap:8 }}>
                      <input placeholder="Description" value={item.description} onChange={e => updateItem(idx, 'description', e.target.value)} style={{...inputStyle, flex:2}} />
                      <input placeholder="Amount" type="number" value={item.amount} onChange={e => updateItem(idx, 'amount', e.target.value)} style={{...inputStyle, width:100}} />
                    </div>
                  ))}
                  <button onClick={addInvoiceItem} style={{ background:'rgba(255,255,255,0.1)', border:'1px solid rgba(255,255,255,0.2)', borderRadius:8, color:'#fff', padding:8, cursor:'pointer' }}>+ Add Item</button>
                  <div style={{ textAlign:'right', fontWeight:600 }}>Total: ${totalAmount.toFixed(2)}</div>
                  <input type="date" placeholder="Due Date" value={form.dueDate} onChange={e=>setForm(f=>({...f,dueDate:e.target.value}))} style={inputStyle} />
                  <textarea placeholder="Notes" value={form.notes} onChange={e=>setForm(f=>({...f,notes:e.target.value}))} style={inputStyle} rows={2} />
                  <div style={{ display:'flex', gap:12, justifyContent:'flex-end', marginTop:12 }}>
                    <button onClick={() => handleCreateInvoice(false)} style={{ background:'rgba(255,255,255,0.1)', border:'1px solid rgba(255,255,255,0.2)', borderRadius:12, color:'#fff', padding:'12px 24px', cursor:'pointer' }}>Save Draft</button>
                    <button onClick={() => handleCreateInvoice(true)} style={{ background:'linear-gradient(135deg,#7e22ce,#c026d3)', border:'none', borderRadius:12, color:'#fff', padding:'12px 24px', fontWeight:600, cursor:'pointer' }}>Send Invoice</button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </>
  );
}
const inputStyle = { background:'rgba(255,255,255,0.07)', border:'1px solid rgba(255,255,255,0.15)', borderRadius:10, padding:12, color:'#fff', outline:'none' };
