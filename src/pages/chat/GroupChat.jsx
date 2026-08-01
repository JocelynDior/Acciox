import React, { useState, useEffect, useRef } from 'react';
import { db, collection, onSnapshot, addDoc, serverTimestamp, query, orderBy, doc, getDoc } from '../../firebase';
import { useAuth } from '../../context/AuthContext';
import { useParams, Link } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import Sidebar from '../../components/Sidebar';
import { FiSend, FiArrowLeft } from 'react-icons/fi';

const pageWrapper = {
  background: 'transparent',
  minHeight: '100vh', display: 'flex', flexDirection: 'column',
  fontFamily: "'Inter', system-ui, sans-serif",
};
const bubble = (isMine) => ({
  alignSelf: isMine ? 'flex-end' : 'flex-start',
  background: isMine ? 'linear-gradient(135deg, #7e22ce, #c026d3)' : 'rgba(255,255,255,0.1)',
  borderRadius: 16, padding: '10px 16px', color: '#fff',
  maxWidth: '70%', wordBreak: 'break-word',
});
const roleBadgeStyle = (role) => ({
  fontSize: '0.7rem', fontWeight: 600, padding: '1px 8px', borderRadius: 20, color: '#fff',
  background: role === 'admin' ? '#c026d3' : role === 'accountant' ? '#7e22ce' : '#3b82f6',
  marginLeft: 6,
});

export default function GroupChat() {
  const { companyId } = useParams();
  const { currentUser, userRole } = useAuth();
  const [messages, setMessages] = useState([]);
  const [newMsg, setNewMsg] = useState('');
  const [company, setCompany] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [senderData, setSenderData] = useState({});
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Fetch company info
  useEffect(() => {
    if (!companyId) return;
    getDoc(doc(db, 'companies', companyId)).then(snap => {
      if (snap.exists()) setCompany({ id: snap.id, ...snap.data() });
    });
  }, [companyId]);

  // Fetch messages - updated path
  useEffect(() => {
    if (!companyId) return;
    const path = 'groupChats/' + companyId + '/messages';
    const q = query(collection(db, path), orderBy('createdAt', 'asc'));
    const unsub = onSnapshot(q, async (snap) => {
      const msgs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setMessages(msgs);

      const unknownIds = [...new Set(msgs.map(m => m.senderId))].filter(id => !senderData[id]);
      if (unknownIds.length > 0) {
        const newData = { ...senderData };
        await Promise.all(unknownIds.map(async (uid) => {
          try {
            const userSnap = await getDoc(doc(db, 'users', uid));
            if (userSnap.exists()) newData[uid] = userSnap.data();
          } catch (e) {}
        }));
        setSenderData(newData);
      }
    });
    return () => unsub();
  }, [companyId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!newMsg.trim()) return;
    try {
      const path = 'groupChats/' + companyId + '/messages';
      await addDoc(collection(db, path), {
        text: newMsg.trim(),
        senderId: currentUser.uid,
        senderName: currentUser.displayName || currentUser.email,
        senderRole: userRole,
        createdAt: serverTimestamp(),
      });
      setNewMsg('');
    } catch (err) { console.error('Failed to send', err); }
  };

  const isReadOnly = userRole === 'client';

  const mainStyle = {
    marginLeft: isMobile ? 0 : 260,
    display: 'flex', flexDirection: 'column', flex: 1,
    height: 'calc(100vh - 64px)', marginTop: 64,
  };

  return (
    <>
      <Navbar onMenuClick={() => setSidebarOpen(p => !p)} />
      <div style={pageWrapper}>
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} companyId={companyId} companyName={company?.companyName} />
        <div style={mainStyle}>

          {/* Header */}
          <div style={{ background: 'rgba(255,255,255,0.08)', borderBottom: '1px solid rgba(255,255,255,0.15)', padding: '16px 24px', display: 'flex', alignItems: 'center', gap: 12 }}>
            <Link to="/chat" style={{ background: 'none', border: 'none', color: '#e879f9', cursor: 'pointer', textDecoration: 'none', marginRight: 4 }}>
              <FiArrowLeft size={20} />
            </Link>
            <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'linear-gradient(135deg, #7e22ce, #c026d3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700 }}>
              {company?.companyName?.charAt(0).toUpperCase() || '?'}
            </div>
            <div>
              <strong style={{ color: '#fff' }}>{company?.companyName || 'Group Chat'}</strong>
              <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)' }}>Group Chat</div>
            </div>
            {isReadOnly && (
              <span style={{ marginLeft: 'auto', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 20, padding: '4px 12px', color: '#fff', fontSize: '0.8rem' }}>👁️ View Only</span>
            )}
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: 'auto', padding: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {messages.length === 0 ? (
              <p style={{ color: 'rgba(255,255,255,0.4)', textAlign: 'center', marginTop: 60 }}>No messages yet. Start the conversation!</p>
            ) : (
              messages.map(msg => {
                const isMine = msg.senderId === currentUser.uid;
                const sender = senderData[msg.senderId];
                const displayName = msg.senderName || sender?.fullName || 'User';
                const role = msg.senderRole || sender?.role || 'client';
                return (
                  <div key={msg.id} style={{ display: 'flex', flexDirection: 'column', alignItems: isMine ? 'flex-end' : 'flex-start', gap: 3 }}>
                    {!isMine && (
                      <div style={{ display: 'flex', alignItems: 'center', marginLeft: 8 }}>
                        <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>{displayName}</span>
                        <span style={roleBadgeStyle(role)}>{role}</span>
                      </div>
                    )}
                    <div style={bubble(isMine)}>{msg.text}</div>
                    <small style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.7rem', margin: '0 8px' }}>
                      {msg.createdAt ? new Date(msg.createdAt.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                    </small>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input — hidden for clients */}
          {!isReadOnly ? (
            <div style={{ background: 'rgba(255,255,255,0.08)', borderTop: '1px solid rgba(255,255,255,0.15)', padding: '16px 24px', display: 'flex', alignItems: 'center', gap: 12 }}>
              <input
                type="text"
                placeholder="Type a message..."
                value={newMsg}
                onChange={e => setNewMsg(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') sendMessage(); }}
                style={{ flex: 1, background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 12, padding: '12px 16px', color: '#fff', outline: 'none' }}
              />
              <button onClick={sendMessage} style={{ background: 'linear-gradient(135deg, #7e22ce, #c026d3)', border: 'none', borderRadius: '50%', width: 48, height: 48, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                <FiSend color="#fff" size={20} />
              </button>
            </div>
          ) : (
            <div style={{ background: 'rgba(255,255,255,0.05)', borderTop: '1px solid rgba(255,255,255,0.1)', padding: '16px 24px', textAlign: 'center', color: 'rgba(255,255,255,0.4)', fontSize: '0.9rem' }}>
              👁️ You are viewing this chat in read-only mode
            </div>
          )}
        </div>
      </div>
    </>
  );
}
