import React, { useState, useEffect } from 'react';
import {
  db, collection, onSnapshot, updateDoc, doc, query, where, orderBy,
} from '../firebase';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  FiBell, FiMessageSquare, FiDollarSign, FiCheckCircle, FiAlertCircle, FiRefreshCw, FiUserPlus,
} from 'react-icons/fi';

const pageWrapper = {
  background: 'linear-gradient(135deg, #0f0a1a 0%, #1a0f2e 50%, #2d1b4e 100%)',
  minHeight: '100vh', display: 'flex',
  fontFamily: "'Inter', system-ui, sans-serif",
};
const mainContent = { marginLeft: 260, paddingTop: 80, padding: '80px 24px 40px', flex: 1 };
const mobileMain = { ...mainContent, marginLeft: 0 };

export default function Notifications() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [filter, setFilter] = useState('all');
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (!currentUser) return;
    const q = query(collection(db, `notifications/${currentUser.uid}/items`), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, snap => setNotifications(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    return () => unsub();
  }, [currentUser]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleMarkAllRead = async () => {
    for (const n of notifications.filter(n => !n.read)) {
      await updateDoc(doc(db, `notifications/${currentUser.uid}/items`, n.id), { read: true });
    }
  };

  const handleClick = async (notification) => {
    if (!notification.read) {
      await updateDoc(doc(db, `notifications/${currentUser.uid}/items`, notification.id), { read: true });
    }
    if (notification.link) navigate(notification.link);
  };

  const filtered = filter === 'all' ? notifications : notifications.filter(n => n.type === filter);

  const typeIcons = {
    chat: <FiMessageSquare />, finance: <FiDollarSign />, system: <FiCheckCircle />,
    alert: <FiAlertCircle />, sync: <FiRefreshCw />, user: <FiUserPlus />,
  };

  return (
    <>
      <Navbar />
      <div style={pageWrapper}>
        <Sidebar />
        <main style={isMobile ? mobileMain : mainContent}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <h1 style={{ color: '#fff' }}>Notifications {unreadCount > 0 && <span style={{ background: '#c026d3', borderRadius: 20, padding: '2px 12px', fontSize: '1rem' }}>{unreadCount}</span>}</h1>
            <button onClick={handleMarkAllRead} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: 12, color: '#fff', padding: '8px 16px', cursor: 'pointer' }}>Mark all read</button>
          </div>
          <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
            {['all', 'system', 'chat', 'finance'].map(f => (
              <button key={f} onClick={() => setFilter(f)} style={{
                padding: '8px 16px', borderRadius: 12, border: 'none',
                background: filter === f ? '#c026d3' : 'rgba(255,255,255,0.1)',
                color: '#fff', cursor: 'pointer', fontWeight: 600,
              }}>{f === 'all' ? 'All' : f}</button>
            ))}
          </div>

          {filtered.length === 0 ? (
            <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.6)', marginTop: 60 }}>
              <p>You're all caught up! 🎉</p>
            </div>
          ) : (
            filtered.map(notif => (
              <div
                key={notif.id}
                onClick={() => handleClick(notif)}
                style={{
                  background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(10px)',
                  borderLeft: notif.read ? '3px solid transparent' : '3px solid #c026d3',
                  border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12,
                  padding: 16, marginBottom: 12, cursor: 'pointer', color: '#fff',
                  display: 'flex', alignItems: 'center', gap: 16,
                }}
              >
                <div style={{ color: '#e879f9' }}>{typeIcons[notif.type] || <FiBell />}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600 }}>{notif.title}</div>
                  <div style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.7)' }}>{notif.description}</div>
                  <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>
                    {notif.createdAt ? new Date(notif.createdAt.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                  </div>
                </div>
              </div>
            ))
          )}
        </main>
      </div>
    </>
  );
}
