```jsx
import React, { useState, useEffect } from 'react';
import {
  db, collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, serverTimestamp,
} from '../../firebase';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-hot-toast';
import Navbar from '../../components/Navbar';
import Sidebar from '../../components/Sidebar';
import {
  FiBuilding, FiSearch, FiPlus, FiCheck, FiTrash2, FiEye,
} from 'react-icons/fi';

// ---- Inline Styles ----
const pageWrapper = {
  background: 'linear-gradient(135deg, #0f0a1a 0%, #1a0f2e 50%, #2d1b4e 100%)',
  minHeight: '100vh',
  display: 'flex',
  fontFamily: "'Inter', system-ui, sans-serif",
};
const mainContent = {
  marginLeft: 260,
  paddingTop: 80,
  padding: '80px 24px 40px',
  flex: 1,
};
const mobileMain = { ...mainContent, marginLeft: 0 };
const card = {
  background: 'rgba(255,255,255,0.08)',
  backdropFilter: 'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)',
  border: '1px solid rgba(255,255,255,0.15)',
  borderRadius: 16,
  padding: 20,
  color: '#fff',
};
const gradientTitle = {
  background: 'linear-gradient(to right, #c026d3, #e879f9)',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  backgroundClip: 'text',
  fontWeight: 700,
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

export default function CompanyManagement() {
  const { currentUser } = useAuth();
  const [companies, setCompanies] = useState([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [modalOpen, setModalOpen] = useState(false);
  const [confirm, setConfirm] = useState({ show: false, type: '', company: null });
  const [form, setForm] = useState({
    companyName: '', ownerName: '', ownerEmail: '', industry: '', description: '',
  });

  // responsive
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // fetch companies
  useEffect(() => {
    const q = collection(db, 'companies');
    const unsub = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setCompanies(list);
    });
    return () => unsub();
  }, []);

  // audit log helper
  const logAudit = async (action, companyName) => {
    try {
      await addDoc(collection(db, 'auditLogs'), {
        action,
        companyName,
        performedBy: currentUser?.email || 'admin',
        timestamp: serverTimestamp(),
      });
    } catch (err) { console.error('Audit log failed', err); }
  };

  // filter companies
  const filtered = companies.filter(c => {
    const name = (c.companyName || '').toLowerCase();
    const matchesSearch = name.includes(search.toLowerCase());
    const matchesFilter = filter === 'all' || c.status === filter;
    return matchesSearch && matchesFilter;
  });

  // format date
  const fmtDate = ts => ts ? new Date(ts.seconds * 1000).toLocaleDateString() : '—';

  // Add company
  const handleAdd = async (e) => {
    e.preventDefault();
    if (!form.companyName || !form.ownerEmail) return toast.error('Company name and owner email required.');
    try {
      const docRef = await addDoc(collection(db, 'companies'), {
        ...form,
        status: 'unverified',
        createdAt: serverTimestamp(),
      });
      // create linked user doc (client)
      await addDoc(collection(db, 'users'), {
        fullName: form.ownerName,
        email: form.ownerEmail.trim().toLowerCase(),
        companyName: form.companyName,
        companyId: docRef.id,
        role: 'client',
        status: 'unverified',
        createdAt: serverTimestamp(),
      });
      toast.success('Company added successfully');
      logAudit('ADD_COMPANY', form.companyName);
      setModalOpen(false);
      setForm({ companyName: '', ownerName: '', ownerEmail: '', industry: '', description: '' });
    } catch (err) {
      toast.error('Failed to add company: ' + err.message);
    }
  };

  // Verify company
  const handleVerify = async (company) => {
    try {
      await updateDoc(doc(db, 'companies', company.id), { status: 'verified' });
      // update linked user status
      if (company.ownerEmail) {
        const usersSnap = await onSnapshot(query(collection(db, 'users'), where('email', '==', company.ownerEmail.trim().toLowerCase())), (snap) => {
          snap.forEach(async (userDoc) => {
            await updateDoc(doc(db, 'users', userDoc.id), { status: 'active' });
          });
        });
      }
      toast.success('Company verified successfully');
      logAudit('VERIFY_COMPANY', company.companyName);
    } catch (err) {
      toast.error('Verification failed: ' + err.message);
    }
    setConfirm({ show: false, type: '', company: null });
  };

  // Delete company
  const handleDelete = async (company) => {
    try {
      await deleteDoc(doc(db, 'companies', company.id));
      toast.success('Company deleted');
      logAudit('DELETE_COMPANY', company.companyName);
    } catch (err) {
      toast.error('Deletion failed: ' + err.message);
    }
    setConfirm({ show: false, type: '', company: null });
  };

  const confirmDialog = confirm.show && (
    <div style={modalOverlay} onClick={() => setConfirm({ show: false })}>
      <div style={modalCard} onClick={e => e.stopPropagation()}>
        <h3 style={{ marginBottom: 12 }}>{confirm.type === 'verify' ? 'Verify Company' : 'Delete Company'}</h3>
        <p>{confirm.type === 'verify'
          ? `Are you sure you want to verify "${confirm.company?.companyName}"? The linked client will be activated.`
          : `Are you sure you want to permanently delete "${confirm.company?.companyName}"?`
        }</p>
        <div style={{ display: 'flex', gap: 12, marginTop: 20, justifyContent: 'flex-end' }}>
          <button
            onClick={() => setConfirm({ show: false })}
            style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 10, padding: '10px 20px', color: '#fff', cursor: 'pointer' }}
          >Cancel</button>
          <button
            onClick={() => confirm.type === 'verify' ? handleVerify(confirm.company) : handleDelete(confirm.company)}
            style={{ background: confirm.type === 'verify' ? 'linear-gradient(135deg, #7e22ce, #c026d3)' : '#ef4444', border: 'none', borderRadius: 10, padding: '10px 20px', color: '#fff', fontWeight: 600, cursor: 'pointer' }}
          >{confirm.type === 'verify' ? 'Verify' : 'Delete'}</button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <Navbar onMenuClick={() => setSidebarOpen(prev => !prev)} />
      <div style={pageWrapper}>
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <main style={isMobile ? mobileMain : mainContent}>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
            <h1 style={{ ...gradientTitle, fontSize: '1.8rem', display: 'flex', alignItems: 'center', gap: 10 }}>
              <FiBuilding /> Company Management
            </h1>
            <button
              onClick={() => setModalOpen(true)}
              style={{ background: 'linear-gradient(135deg, #7e22ce, #c026d3)', border: 'none', borderRadius: 12, color: '#fff', padding: '12px 24px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 4px 15px rgba(192,38,211,0.3)' }}
            >
              <FiPlus /> Add New Company
            </button>
          </div>

          {/* Search & Filter */}
          <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,0.07)', borderRadius: 12, padding: '0 14px', flex: 1, minWidth: 200 }}>
              <FiSearch color="rgba(255,255,255,0.5)" />
              <input
                placeholder="Search companies..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{ background: 'transparent', border: 'none', color: '#fff', padding: '12px 8px', outline: 'none', width: '100%' }}
              />
            </div>
            <select
              value={filter}
              onChange={e => setFilter(e.target.value)}
              style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 12, color: '#fff', padding: '10px 14px', outline: 'none', fontWeight: 600 }}
            >
              <option value="all">All</option>
              <option value="verified">Verified</option>
              <option value="unverified">Unverified</option>
            </select>
          </div>

          {/* Companies List */}
          {filtered.length === 0 ? (
            <div style={{ ...card, textAlign: 'center', color: 'rgba(255,255,255,0.6)' }}>
              No companies found.
            </div>
          ) : (
            filtered.map(company => (
              <div key={company.id} style={{ ...card, marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'linear-gradient(135deg, #7e22ce, #c026d3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: '1.2rem' }}>
                    {company.companyName?.charAt(0).toUpperCase() || '?'}
                  </div>
                  <div>
                    <strong style={{ fontSize: '1.1rem' }}>{company.companyName}</strong>
                    <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem' }}>
                      {company.ownerName} • {company.ownerEmail}
                    </div>
                    <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem' }}>Added {fmtDate(company.createdAt)}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ padding: '4px 12px', borderRadius: 20, fontSize: '0.8rem', fontWeight: 600,
                    background: company.status === 'verified' ? '#22c55e' : '#f59e0b',
                    color: '#000' }}>
                    {company.status === 'verified' ? 'Verified' : 'Unverified'}
                  </span>
                  {company.status !== 'verified' && (
                    <button
                      onClick={() => setConfirm({ show: true, type: 'verify', company })}
                      style={{ background: 'none', border: 'none', color: '#22c55e', cursor: 'pointer', fontSize: '1.2rem' }}
                    ><FiCheck /></button>
                  )}
                  <button
                    onClick={() => setConfirm({ show: true, type: 'delete', company })}
                    style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '1.2rem' }}
                  ><FiTrash2 /></button>
                  <button
                    onClick={() => toast('Detail view coming soon.')}
                    style={{ background: 'none', border: 'none', color: '#e879f9', cursor: 'pointer', fontSize: '1.2rem' }}
                  ><FiEye /></button>
                </div>
              </div>
            ))
          )}

          {/* Add Company Modal */}
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
                  <button type="submit" style={{ background: 'linear-gradient(135deg, #7e22ce, #c026d3)', border: 'none', borderRadius: 12, color: '#fff', padding: 14, fontWeight: 600, cursor: 'pointer', marginTop: 10 }}>
                    Create Company
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* Confirmation Dialog */}
          {confirmDialog}
        </main>
      </div>
    </>
  );
}

const inputStyle = {
  background: 'rgba(255,255,255,0.07)',
  border: '1px solid rgba(255,255,255,0.15)',
  borderRadius: 10,
  padding: '12px',
  color: '#fff',
  outline: 'none',
  fontSize: '0.95rem',
};
```
