import React, { useState, useEffect, useRef } from 'react';
import {
  db, collection, onSnapshot, query, orderBy, updateDoc, doc,
} from '../firebase';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { FiBell, FiCheck } from 'react-icons/fi';

export default function NotificationBell() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const bellRef = useRef(null);

  useEffect(() => {
    if (!currentUser) return;
    const q = query(collection(db, `notifications/${currentUser.uid}/items`), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, snap => setNotifications(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    return () => unsub();
  }, [currentUser]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (bellRef.current && !bellRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleMarkRead = async (id) => {
    await updateDoc(doc(db, `notifications/${currentUser.uid}/items`, id), { read: true });
  };

  const handleNavigate = (notification) => {
    handleMarkRead(notification.id);
    if (notification.link) navigate(notification.link);
    setOpen(false);
  };

  return (
    <div style={{ position: 'relative' }} ref={bellRef}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          background: 'none', border: 'none', color: '#fff', fontSize: '1.4rem', cursor: 'pointer',
          position: 'relative',
        }}
      >
        <FiBell />
        {unreadCount > 0 && (
          <span style={{
            position: 'absolute', top: -4, right: -6, background: '#ef4444', color: '#fff',
            borderRadius: '50%', width: 20, height: 20, fontSize: '0.7rem', display: 'flex',
            alignItems: 'center', justifyContent: 'center', fontWeight: 700,
          }}>{unreadCount}</span>
        )}
      </button>
      {open && (
        <div style={{
          position: 'absolute', top: '100%', right: 0, marginTop: 8, width: 320,
          background: 'rgba(30, 10, 50, 0.95)', backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255,255,255,0.2)', borderRadius: 16, padding: '12px 0',
          boxShadow: '0 10px 30px rgba(0,0,0,0.5)', zIndex: 2000,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 16px 8px', borderBottom: '1px solid rgba(255,255,255,0.1)', marginBottom: 8 }}>
            <span style={{ fontWeight: 600, color: '#fff' }}>Notifications</span>
            {unreadCount > 0 && (
              <button
                onClick={async () => {
                  for (const n of notifications.filter(n => !n.read)) await handleMarkRead(n.id);
                }}
                style={{ background: 'none', border: 'none', color: '#e879f9', cursor: 'pointer', fontSize: '0.8rem' }}
              >Mark all read</button>
            )}
          </div>
          {notifications.slice(0, 5).map(notif => (
            <div
              key={notif.id}
              onClick={() => handleNavigate(notif)}
              style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px',
                borderLeft: notif.read ? '3px solid transparent' : '3px solid #c026d3',
                cursor: 'pointer', color: '#fff', transition: '0.2s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{notif.title}</div>
                <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)' }}>{notif.description}</div>
                <small style={{ color: 'rgba(255,255,255,0.4)' }}>
                  {notif.createdAt ? new Date(notif.createdAt.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                </small>
              </div>
            </div>
          ))}
          {notifications.length > 5 && (
            <div style={{ textAlign: 'center', padding: '8px 0' }}>
              <button onClick={() => { navigate('/notifications'); setOpen(false); }} style={{ background: 'none', border: 'none', color: '#e879f9', cursor: 'pointer' }}>View All</button>
            </div>
          )}
          {notifications.length === 0 && (
            <div style={{ padding: 16, textAlign: 'center', color: 'rgba(255,255,255,0.5)' }}>No new notifications</div>
          )}
        </div>
      )}
    </div>
  );
}
