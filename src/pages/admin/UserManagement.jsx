import React, { useState, useEffect } from 'react';
import {
  db, collection, onSnapshot, doc, updateDoc, deleteDoc, addDoc, serverTimestamp,
} from '../../firebase';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-hot-toast';
import Navbar from '../../components/Navbar';
import Sidebar from '../../components/Sidebar';
import {
  FiUsers, FiPlus, FiEdit, FiCheck, FiX, FiTrash2, FiSearch,
} from 'react-icons/fi';

// ---- Inline Styles ----
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
  borderRadius: 16, padding: 20, color: '#fff',
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
  borderRadius: 10, padding: '12px', color: '#fff', outline: 'none', fontSize: '0.95rem', marginBottom: 12,
};
const selectStyle = {
  ...inputStyle, appearance: 'none', cursor: 'pointer',
};

export default function UserManagement() {
  const { currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState({ show: false, user: null });
  const [form, setForm] = useState({
    fullName: '', email: '', role: 'client', companyId: '', tempPassword: '',
  });

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const q = collection(db, 'users');
    const unsub = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setUsers(list);
    });
    return () => unsub();
  }, []);

  const logAudit = async (action, targetUser) => {
    try {
      await addDoc(collection(db, 'auditLogs'), {
        action,
        targetUser: targetUser?.email || targetUser,
        performedBy: currentUser?.email || 'admin',
        timestamp: serverTimestamp(),
      });
    } catch (e) { console.error('Audit log failed', e); }
  };

  const stats = {
    total: users.length,
    accountants: users.filter(u => u.role === 'accountant').length,
    clients: users.filter(u => u.role === 'client').length,
  };

  const filteredUsers = users.filter(u => {
    const name = (u.fullName || '').toLowerCase();
    const email = (u.email || '').toLowerCase();
    const term = search.toLowerCase();
    const matchSearch = name.includes(term) || email.includes(term);
    const matchRole = filterRole === 'all' || u.role === filterRole;
    const matchStatus = filterStatus === 'all' || u.status === filterStatus;
    return matchSearch && matchRole && matchStatus;
  });

  const handleAddUser = async (e) => {
    e.preventDefault();
    if (!form.fullName || !form.email || !form.tempPassword) {
      return toast.error('Name, email and password are required.');
    }
    try {
      await addDoc(collection(db, 'users'), {
        fullName: form.fullName.trim(),
        email: form.email.trim().toLowerCase(),
        role: form.role,
        status: 'unverified',
        companyId: form.companyId || null,
        createdAt: serverTimestamp(),
      });
      toast.success('User created successfully');
      logAudit('ADD_USER', { email: form.email });
      setAddModalOpen(false);
      setForm({ fullName: '', email: '', role: 'client', companyId: '', tempPassword: '' });
    } catch (err) {
      toast.error('Failed to add user: ' + err.message);
    }
  };

  const handleUpdateRole = async (user, newRole) => {
    if (user.id === currentUser?.uid) return toast.error('Cannot change your own role.');
    try {
      await updateDoc(doc(db, 'users', user.id), { role: newRole });
      toast.success('Role updated');
      logAudit('CHANGE_ROLE', user);
      setEditUser(null);
    } catch (err) { toast.error(err.message); }
  };

  const handleToggleStatus = async (user, newStatus) => {
    try {
      await updateDoc(doc(db, 'users', user.id), { status: newStatus });
      const msg = 'User ' + (newStatus === 'active' ? 'activated' : 'deactivated');
      toast.success(msg);
      logAudit(newStatus === 'active' ? 'ACTIVATE_USER' : 'DEACTIVATE_USER', user);
    } catch (err) { toast.error(err.message); }
  };

  const handleDelete = async (user) => {
    try {
      await deleteDoc(doc(db, 'users', user.id));
      toast.success('User deleted');
      logAudit('DELETE_USER', user);
      setDeleteConfirm({ show: false, user: null });
    } catch (err) { toast.error(err.message); }
  };

  const roleBadgeColor = (role) => {
    if (role === 'admin') return '#c026d3';
    if (role === 'accountant') return '#7e22ce';
    return '#3b82f6';
  };

  return (
    <>
      <Navbar onMenuClick={() => setSidebarOpen(prev => !prev)} />
      <div style={pageWrapper}>
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <main style={isMobile ? mobileMain : mainContent}>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
            <h1 style={{ ...gradientTitle, fontSize: '1.8rem', display: 'flex', alignItems: 'center', gap: 10 }}>
              <FiUsers /> User Management
            </h1>
            <button
              onClick={() => setAddModalOpen(true)}
              style={{ background: 'linear-gradient(135deg, #7e22ce, #c026d3)', border: 'none', borderRadius: 12, color: '#fff', padding: '12px 24px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 4px 15px rgba(192,38,211,0.3)' }}
            >
              <FiPlus /> Add New User
            </button>
          </div>

          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 16, marginBottom: 24 }}>
            <div style={card}>
              <p style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.6)' }}>Total Users</p>
              <h2 style={{ margin: '4px 0' }}>{stats.total}</h2>
            </div>
            <div style={card}>
              <p style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.6)' }}>Accountants</p>
              <h2 style={{ margin: '4px 0' }}>{stats.accountants}</h2>
            </div>
            <div style={card}>
              <p style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.6)' }}>Clients</p>
              <h2 style={{ margin: '4px 0' }}>{stats.clients}</h2>
            </div>
          </div>

          {/* Search & Filters */}
          <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,0.07)', borderRadius: 12, padding: '0 14px', flex: 1, minWidth: 200 }}>
              <FiSearch color="rgba(255,255,255,0.5)" />
              <input placeholder="Search by name or email" value={search} onChange={e => setSearch(e.target.value)} style={{ background: 'transparent', border: 'none', color: '#fff', padding: '12px 8px', outline: 'none', width: '100%' }} />
            </div>
            <select value={filterRole} onChange={e => setFilterRole(e.target.value)} style={selectStyle}>
              <option value="all">All Roles</option>
              <option value="admin">Admin</option>
              <option value="accountant">Accountant</option>
              <option value="client">Client</option>
            </select>
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={selectStyle}>
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="unverified">Unverified</option>
              <option value="deactivated">Deactivated</option>
            </select>
          </div>

          {/* User List */}
          {filteredUsers.length === 0 ? (
            <div style={{ ...card, textAlign: 'center', color: 'rgba(255,255,255,0.6)' }}>No users found.</div>
          ) : (
            filteredUsers.map(user => (
              <div key={user.id} style={{ ...card, marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'linear-gradient(135deg, #7e22ce, #c026d3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: '1.2rem' }}>
                    {user.fullName?.charAt(0).toUpperCase() || '?'}
                  </div>
                  <div>
                    <strong>{user.fullName}</strong>
                    <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem' }}>{user.email}</div>
                    <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem' }}>Company: {user.companyName || 'N/A'}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                  <span style={{ padding: '4px 12px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 600, background: roleBadgeColor(user.role), color: '#fff' }}>{user.role}</span>
                  <span style={{ padding: '4px 12px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 600, background: user.status === 'active' ? '#22c55e' : '#f59e0b', color: '#000' }}>{user.status}</span>
                  <button onClick={() => setEditUser(user)} style={{ background: 'none', border: 'none', color: '#e879f9', cursor: 'pointer' }}><FiEdit /></button>
                  {user.status !== 'active' && (
                    <button onClick={() => handleToggleStatus(user, 'active')} style={{ background: 'none', border: 'none', color: '#22c55e', cursor: 'pointer' }}><FiCheck /></button>
                  )}
                  {user.status === 'active' && (
                    <button onClick={() => handleToggleStatus(user, 'deactivated')} style={{ background: 'none', border: 'none', color: '#f59e0b', cursor: 'pointer' }}><FiX /></button>
                  )}
                  <button onClick={() => setDeleteConfirm({ show: true, user })} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}><FiTrash2 /></button>
                </div>
              </div>
            ))
          )}

          {/* Add User Modal */}
          {addModalOpen && (
            <div style={modalOverlay} onClick={() => setAddModalOpen(false)}>
              <div style={modalCard} onClick={e => e.stopPropagation()}>
                <h2 style={{ marginBottom: 20, ...gradientTitle, fontSize: '1.4rem' }}>Add New User</h2>
                <form onSubmit={handleAddUser} style={{ display: 'flex', flexDirection: 'column' }}>
                  <input placeholder="Full Name" value={form.fullName} onChange={e => setForm(f => ({ ...f, fullName: e.target.value }))} style={inputStyle} />
                  <input placeholder="Email" type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} style={inputStyle} />
                  <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))} style={selectStyle}>
                    <option value="client">Client</option>
                    <option value="accountant">Accountant</option>
                  </select>
                  <input placeholder="Temporary Password" type="password" value={form.tempPassword} onChange={e => setForm(f => ({ ...f, tempPassword: e.target.value }))} style={inputStyle} />
                  <button type="submit" style={{ background: 'linear-gradient(135deg, #7e22ce, #c026d3)', border: 'none', borderRadius: 12, padding: 14, color: '#fff', fontWeight: 600, cursor: 'pointer', marginTop: 10 }}>Create User</button>
                </form>
              </div>
            </div>
          )}

          {/* Edit Role Modal */}
          {editUser && (
            <div style={modalOverlay} onClick={() => setEditUser(null)}>
              <div style={modalCard} onClick={e => e.stopPropagation()}>
                <h3 style={{ marginBottom: 20 }}>Edit Role: {editUser.fullName}</h3>
                <select
                  defaultValue={editUser.role}
                  onChange={(e) => handleUpdateRole(editUser, e.target.value)}
                  style={{ ...selectStyle, width: '100%' }}
                >
                  <option value="admin">Admin</option>
                  <option value="accountant">Accountant</option>
                  <option value="client">Client</option>
                </select>
                <div style={{ marginTop: 20, textAlign: 'right' }}>
                  <button onClick={() => setEditUser(null)} style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 10, padding: '10px 20px', color: '#fff', cursor: 'pointer' }}>Cancel</button>
                </div>
              </div>
            </div>
          )}

          {/* Delete Confirmation */}
          {deleteConfirm.show && (
            <div style={modalOverlay} onClick={() => setDeleteConfirm({ show: false })}>
              <div style={modalCard} onClick={e => e.stopPropagation()}>
                <h3 style={{ marginBottom: 12 }}>Delete User</h3>
                <p>Are you sure you want to permanently delete {deleteConfirm.user?.fullName}?</p>
                <div style={{ display: 'flex', gap: 12, marginTop: 20, justifyContent: 'flex-end' }}>
                  <button onClick={() => setDeleteConfirm({ show: false })} style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 10, padding: '10px 20px', color: '#fff', cursor: 'pointer' }}>Cancel</button>
                  <button onClick={() => handleDelete(deleteConfirm.user)} style={{ background: '#ef4444', border: 'none', borderRadius: 10, padding: '10px 20px', color: '#fff', fontWeight: 600, cursor: 'pointer' }}>Delete</button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </>
  );
}
