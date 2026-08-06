import React, { useState, useEffect } from 'react';
import {
  db, collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, query, where, getDocs,
} from '../../firebase';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-hot-toast';
import Navbar from '../../components/Navbar';
import Sidebar from '../../components/Sidebar';
import { FiBriefcase, FiSearch, FiPlus, FiCheck, FiTrash2, FiEye, FiLink } from 'react-icons/fi';
import { arrayUnion } from 'firebase/firestore';

const pageWrapper = {
  background: 'transparent',
  minHeight: '100vh', display: 'flex',
  fontFamily: "'Inter', system-ui, sans-serif",
};
const gradientTitle = {
  background: 'linear-gradient(to right, #c026d3, #e879f9)',
  WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
  backgroundClip: 'text', fontWeight: 700,
};
const modalOverlay = {
  position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 2000,
  display: 'flex', alignItems: 'center', justifyContent: 'center',
};
const modalCard = {
  background: 'rgba(20,10,40,0.95)', backdropFilter: 'blur(25px)',
  border: '1px solid rgba(255,255,255,0.2)', borderRadius: 20, padding: 30,
  maxWidth: 500, width: '90%', color: '#fff', boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
};
const inputStyle = {
  background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.15)',
  borderRadius: 10, padding: '12px', color: '#fff', outline: 'none', fontSize: '0.95rem',
  width: '100%', boxSizing: 'border-box',
};
const card = {
  background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.15)',
  borderRadius: 16, padding: 20, color: '#fff', marginBottom: 16,
};

export default function CompanyManagement() {
  const { currentUser } = useAuth();
  const [companies, setCompanies] = useState([]);
  const [clients, setClients] = useState([]);
  const [accountants, setAccountants] = useState([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(window.innerWidth > 768);
  const [modalOpen, setModalOpen] = useState(false);
  const [linkModal, setLinkModal] = useState({ show: false, company: null });
  const [linkAccountantModal, setLinkAccountantModal] = useState({ show: false, company: null });
  const [selectedClientId, setSelectedClientId] = useState('');
  const [selectedAccountantId, setSelectedAccountantId] = useState('');
  const [confirm, setConfirm] = useState({ show: false, type: '', company: null });
  const [form, setForm] = useState({
    companyName: '', ownerName: '', ownerEmail: '', industry: '', description: '',
  });

  useEffect(() => {
    const handleResize = () => setIsDesktop(window.innerWidth > 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'companies'), snapshot => {
      setCompanies(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const q = query(collection(db, 'users'), where('role', '==', 'client'));
    const unsub = onSnapshot(q, snap => {
      setClients(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const q = query(collection(db, 'users'), where('role', '==', 'accountant'));
    const unsub = onSnapshot(q, snap => {
      setAccountants(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, []);

  const logAudit = async (action, companyName) => {
    try {
      await addDoc(collection(db, 'auditLogs'), {
        action, companyName, performedBy: currentUser?.email || 'admin', timestamp: serverTimestamp(),
      });
    } catch (err) { console.error('Audit log failed', err); }
  };

  const filtered = companies.filter(c => {
    const name = (c.companyName || '').toLowerCase();
    return name.includes(search.toLowerCase()) && (filter === 'all' || c.status === filter);
  });

  const fmtDate = ts => ts ? new Date(ts.seconds * 1000).toLocaleDateString() : '—';

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!form.companyName || !form.ownerEmail) return toast.error('Company name and owner email required.');
    try {
      await addDoc(collection(db, 'companies'), {
        ...form, status: 'unverified', createdAt: serverTimestamp(),
      });
      toast.success('Company added successfully');
      logAudit('ADD_COMPANY', form.companyName);
      setModalOpen(false);
      setForm({ companyName: '', ownerName: '', ownerEmail: '', industry: '', description: '' });
    } catch (err) { toast.error('Failed to add company: ' + err.message); }
  };

  const handleVerify = async (company) => {
    try {
      await updateDoc(doc(db, 'companies', company.id), { status: 'verified' });
      toast.success('Company verified');
      logAudit('VERIFY_COMPANY', company.companyName);
    } catch (err) { toast.error('Verification failed: ' + err.message); }
    setConfirm({ show: false, type: '', company: null });
  };

  const handleDelete = async (company) => {
    try {
      await deleteDoc(doc(db, 'companies', company.id));
      toast.success('Company deleted');
      logAudit('DELETE_COMPANY', company.companyName);
    } catch (err) { toast.error('Deletion failed: ' + err.message); }
    setConfirm({ show: false, type: '', company: null });
  };

  const handleLinkClient = async () => {
    if (!selectedClientId) return toast.error('Please select a client.');
    try {
      await updateDoc(doc(db, 'users', selectedClientId), {
        companyId: linkModal.company.id,
        companyName: linkModal.company.companyName,
      });
      toast.success('Client linked to company!');
      logAudit('LINK_CLIENT', linkModal.company.companyName);
      setLinkModal({ show: false, company: null });
      setSelectedClientId('');
    } catch (err) { toast.error('Failed to link client: ' + err.message); }
  };

  const handleLinkAccountant = async () => {
    if (!selectedAccountantId) return toast.error('Please select an accountant.');
    try {
      await updateDoc(doc(db, 'companies', linkAccountantModal.company.id), {
        assignedAccountantIds: arrayUnion(selectedAccountantId),
      });
      toast.success('Accountant linked to company!');
      logAudit('LINK_ACCOUNTANT', linkAccountantModal.company.companyName);
      setLinkAccountantModal({ show: false, company: null });
      setSelectedAccountantId('');
    } catch (err) { toast.error('Failed to link accountant: ' + err.message); }
  };

  const mainContent = {
    marginLeft: isDesktop ? 260 : 0,
    padding: isDesktop ? '80px 24px 40px' : '80px 16px 40px',
    flex: 1,
  };

  return (
    <>
      <Navbar onMenuClick={() => setSidebarOpen(prev => !prev)} />
      <div style={pageWrapper}>
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <main style={mainContent}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
            <h1 style={{ ...gradientTitle, fontSize: '1.8rem', display: 'flex', alignItems: 'center', gap: 10 }}>
              <FiBriefcase /> Company Management
            </h1>
            <button onClick={() => setModalOpen(true)} style={{ background: 'linear-gradient(135deg, #7e22ce, #c026d3)', border: 'none', borderRadius: 12, color: '#fff', padding: '12px 24px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
              <FiPlus /> Add New Company
            </button>
          </div>

          <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,0.07)', borderRadius: 12, padding: '0 14px', flex: 1, minWidth: 200 }}>
              <FiSearch color="rgba(255,255,255,0.5)" />
              <input placeholder="Search companies..." value={search} onChange={e => setSearch(e.target.value)} style={{ background: 'transparent', border: 'none', color: '#fff', padding: '12px 8px', outline: 'none', width: '100%' }} />
            </div>
            <select value={filter} onChange={e => setFilter(e.target.value)} style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 12, color: '#fff', padding: '10px 14px', outline: 'none', fontWeight: 600 }}>
              <option value="all">All</option>
              <option value="verified">Verified</option>
              <option value="unverified">Unverified</option>
            </select>
          </div>

          {filtered.length === 0 ? (
            <div style={{ ...card, textAlign: 'center', color: 'rgba(255,255,255,0.6)' }}>No companies found.</div>
          ) : (
            filtered.map(company => (
              <div key={company.id} style={{ ...card, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'linear-gradient(135deg, #7e22ce, #c026d3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: '1.2rem' }}>
                    {company.companyName?.charAt(0).toUpperCase() || '?'}
                  </div>
                  <div>
                    <strong style={{ fontSize: '1.05rem' }}>{company.companyName}</strong>
                    <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem' }}>{company.ownerName} • {company.ownerEmail}</div>
                    <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem' }}>Added {fmtDate(company.createdAt)}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                  <span style={{ padding: '4px 12px', borderRadius: 20, fontSize: '0.8rem', fontWeight: 600, background: company.status === 'verified' ? '#22c55e' : '#f59e0b', color: '#000' }}>
                    {company.status === 'verified' ? 'Verified' : 'Unverified'}
                  </span>
                  {company.status !== 'verified' && (
                    <button onClick={() => setConfirm({ show: true, type: 'verify', company })} style={{ background: 'none', border: 'none', color: '#22c55e', cursor: 'pointer', fontSize: '1.2rem' }}><FiCheck /></button>
                  )}
                  {company.status === 'verified' && (
                    <>
                      <button onClick={() => { setLinkModal({ show: true, company }); setSelectedClientId(''); }} style={{ background: 'none', border: 'none', color: '#3b82f6', cursor: 'pointer', fontSize: '1.2rem' }} title="Link client to company"><FiLink /></button>
                      <button onClick={() => { setLinkAccountantModal({ show: true, company }); setSelectedAccountantId(''); }} style={{ background: 'none', border: 'none', color: '#22c55e', cursor: 'pointer', fontSize: '1.2rem' }} title="Link accountant to company"><FiLink /></button>
                    </>
                  )}
                  <button onClick={() => setConfirm({ show: true, type: 'delete', company })} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '1.2rem' }}><FiTrash2 /></button>
                </div>
              </div>
            ))
          )}

          {modalOpen && (
            <div style={modalOverlay} onClick={() => setModalOpen(false)}>
              <div style={modalCard} onClick={e => e.stopPropagation()}>
                <h2 style={{ marginBottom: 20, ...gradientTitle, fontSize: '1.4rem' }}>Add New Company</h2>
                <form onSubmit={handleAdd} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <input placeholder="Company Name" value={form.companyName} onChange={e => setForm(f => ({ ...f, companyName: e.target.value }))} style={inputStyle} />
                  <input placeholder="Owner Full Name" value={form.ownerName} onChange={e => setForm(f => ({ ...f, ownerName: e.target.value }))} style={inputStyle} />
                  <input placeholder="Owner Email" type="email" value={form.ownerEmail} onChange={e => setForm(f => ({ ...f, ownerEmail: e.target.value }))} style={inputStyle} />
                  <input placeholder="Industry" value={form.industry} onChange={e => setForm(f => ({ ...f, industry: e.target.value }))} style={inputStyle} />
                  <textarea placeholder="Description" rows={3} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} style={{ ...inputStyle, resize: 'vertical' }} />
                  <button type="submit" style={{ background: 'linear-gradient(135deg, #7e22ce, #c026d3)', border: 'none', borderRadius: 12, color: '#fff', padding: 14, fontWeight: 600, cursor: 'pointer' }}>Create Company</button>
                </form>
              </div>
            </div>
          )}

          {linkModal.show && (
            <div style={modalOverlay} onClick={() => setLinkModal({ show: false, company: null })}>
              <div style={modalCard} onClick={e => e.stopPropagation()}>
                <h2 style={{ marginBottom: 8, ...gradientTitle, fontSize: '1.3rem' }}>Link Client to Company</h2>
                <p style={{ color: 'rgba(255,255,255,0.6)', marginBottom: 20, fontSize: '0.9rem' }}>
                  Linking a client to <strong>{linkModal.company?.companyName}</strong> gives them access to the company's group chat and reports.
                </p>
                <select value={selectedClientId} onChange={e => setSelectedClientId(e.target.value)} style={{ ...inputStyle, marginBottom: 20 }}>
                  <option value="">Select a client...</option>
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>{c.fullName || c.email} ({c.email})</option>
                  ))}
                </select>
                <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                  <button onClick={() => setLinkModal({ show: false, company: null })} style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 10, padding: '10px 20px', color: '#fff', cursor: 'pointer' }}>Cancel</button>
                  <button onClick={handleLinkClient} style={{ background: 'linear-gradient(135deg, #7e22ce, #c026d3)', border: 'none', borderRadius: 10, padding: '10px 20px', color: '#fff', fontWeight: 600, cursor: 'pointer' }}>Link Client</button>
                </div>
              </div>
            </div>
          )}

          {linkAccountantModal.show && (
            <div style={modalOverlay} onClick={() => setLinkAccountantModal({ show: false, company: null })}>
              <div style={modalCard} onClick={e => e.stopPropagation()}>
                <h2 style={{ marginBottom: 8, ...gradientTitle, fontSize: '1.3rem' }}>Link Accountant to Company</h2>
                <p style={{ color: 'rgba(255,255,255,0.6)', marginBottom: 20, fontSize: '0.9rem' }}>
                  Assign an accountant to <strong>{linkAccountantModal.company?.companyName}</strong> for financial management.
                </p>
                <select value={selectedAccountantId} onChange={e => setSelectedAccountantId(e.target.value)} style={{ ...inputStyle, marginBottom: 20 }}>
                  <option value="">Select an accountant...</option>
                  {accountants.map(a => (
                    <option key={a.id} value={a.id}>{a.fullName || a.email} ({a.email})</option>
                  ))}
                </select>
                <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                  <button onClick={() => setLinkAccountantModal({ show: false, company: null })} style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 10, padding: '10px 20px', color: '#fff', cursor: 'pointer' }}>Cancel</button>
                  <button onClick={handleLinkAccountant} style={{ background: 'linear-gradient(135deg, #7e22ce, #c026d3)', border: 'none', borderRadius: 10, padding: '10px 20px', color: '#fff', fontWeight: 600, cursor: 'pointer' }}>Link Accountant</button>
                </div>
              </div>
            </div>
          )}

          {confirm.show && (
            <div style={modalOverlay} onClick={() => setConfirm({ show: false })}>
              <div style={modalCard} onClick={e => e.stopPropagation()}>
                <h3 style={{ marginBottom: 12 }}>{confirm.type === 'verify' ? 'Verify Company' : 'Delete Company'}</h3>
                <p>{confirm.type === 'verify' ? `Verify "${confirm.company?.companyName}"?` : `Permanently delete "${confirm.company?.companyName}"?`}</p>
                <div style={{ display: 'flex', gap: 12, marginTop: 20, justifyContent: 'flex-end' }}>
                  <button onClick={() => setConfirm({ show: false })} style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 10, padding: '10px 20px', color: '#fff', cursor: 'pointer' }}>Cancel</button>
                  <button onClick={() => confirm.type === 'verify' ? handleVerify(confirm.company) : handleDelete(confirm.company)} style={{ background: confirm.type === 'verify' ? 'linear-gradient(135deg, #7e22ce, #c026d3)' : '#ef4444', border: 'none', borderRadius: 10, padding: '10px 20px', color: '#fff', fontWeight: 600, cursor: 'pointer' }}>
                    {confirm.type === 'verify' ? 'Verify' : 'Delete'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </>
  );
}
