import React, { useState, useEffect } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { db, collection, onSnapshot, query, where } from '../../firebase';
import {
  FiMessageSquare, FiLock, FiCpu, FiArrowLeft, FiCircle,
} from 'react-icons/fi';

const sidebarStyle = {
  width: 260,
  background: 'rgba(255,255,255,0.05)',
  backdropFilter: 'blur(20px)',
  borderRight: '1px solid rgba(255,255,255,0.1)',
  height: 'calc(100vh - 64px)',
  overflowY: 'auto',
  padding: 16,
  color: '#fff',
  display: 'flex',
  flexDirection: 'column',
};

const navItem = (active) => ({
  display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px',
  borderRadius: 12, textDecoration: 'none',
  color: active ? '#fff' : 'rgba(255,255,255,0.7)',
  background: active ? 'linear-gradient(135deg, #7e22ce, #c026d3)' : 'transparent',
  fontWeight: active ? 600 : 400,
  marginBottom: 4,
});

export default function ChatSidebar() {
  const { companyId } = useParams();
  const location = useLocation();
  const { currentUser } = useAuth();
  const [onlineUsers, setOnlineUsers] = useState([]);

  useEffect(() => {
    if (!companyId) return;
    const q = query(collection(db, 'users'), where('companyId', '==', companyId));
    const unsub = onSnapshot(q, snap => setOnlineUsers(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    return () => unsub();
  }, [companyId]);

  const links = [
    { to: `/company/${companyId}/chat/group`, label: 'Group Chat', icon: <FiMessageSquare /> },
    { to: `/company/${companyId}/chat/private`, label: 'Private Chat', icon: <FiLock /> },
    { to: `/company/${companyId}/chat/ai`, label: 'AI Assistant', icon: <FiCpu />, badge: 'AI' },
  ];

  return (
    <div style={sidebarStyle}>
      <div style={{ marginBottom: 16 }}>
        <h3 style={{ margin: 0 }}>Messages</h3>
        <small style={{ color: 'rgba(255,255,255,0.5)' }}>{companyId ? 'Company workspace' : ''}</small>
      </div>
      {links.map(link => {
        const active = location.pathname === link.to;
        return (
          <Link key={link.to} to={link.to} style={navItem(active)}>
            <span style={{ fontSize: '1.2rem' }}>{link.icon}</span>
            <span>{link.label}</span>
            {link.badge && <span style={{ marginLeft: 'auto', background: '#c026d3', borderRadius: 20, padding: '2px 10px', fontSize: '0.75rem', fontWeight: 600 }}>{link.badge}</span>}
          </Link>
        );
      })}

      <div style={{ marginTop: 24 }}>
        <small style={{ color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: 8 }}>Online Members</small>
        {onlineUsers.map(user => (
          <div key={user.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 0', fontSize: '0.9rem' }}>
            <div style={{ position: 'relative' }}>
              <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'linear-gradient(135deg, #7e22ce, #c026d3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 600, fontSize: '0.9rem' }}>
                {user.fullName?.charAt(0).toUpperCase() || '?'}
              </div>
              <span style={{ position: 'absolute', bottom: 0, right: 0, width: 10, height: 10, borderRadius: '50%', background: user.id === currentUser?.uid ? '#22c55e' : '#888', border: '2px solid #1a0f2e' }} />
            </div>
            <div>
              <div style={{ fontWeight: 500 }}>{user.fullName}</div>
              <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)' }}>{user.role}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 'auto' }}>
        <Link to={`/company/${companyId}/dashboard`} style={{ color: '#e879f9', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6 }}>
          <FiArrowLeft /> Back to Workspace
        </Link>
      </div>
    </div>
  );
}
