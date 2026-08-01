import React, { useState, useEffect, useRef } from 'react';
import { db, collection, onSnapshot, addDoc, serverTimestamp, query, orderBy, where, getDocs } from '../../firebase';
import { useAuth } from '../../context/AuthContext';
import Navbar from '../../components/Navbar';
import Sidebar from '../../components/Sidebar';
import { FiSend, FiArrowLeft, FiSearch } from 'react-icons/fi';

const pageWrapper = {
  background: 'linear-gradient(135deg, #0f0a1a 0%, #1a0f2e 50%, #2d1b4e 100%)',
  minHeight: '100vh', display: 'flex', flexDirection: 'column',
  fontFamily: "'Inter', system-ui, sans-serif",
};
const chatLayout = { display: 'flex', flex: 1, height: 'calc(100vh - 64px)', marginTop: 64 };
const contactList = {
  width: 300, background: 'rgba(255,255,255,0.04)',
  borderRight: '1px solid rgba(255,255,255,0.1)', overflowY: 'auto', flexShrink: 0,
};
const mainChat = { flex: 1, display: 'flex', flexDirection: 'column', background: 'rgba(255,255,255,0.02)' };
const bubble = (isMine) => ({
  alignSelf: isMine ? 'flex-end' : 'flex-start',
  background: isMine ? 'linear-gradient(135deg, #7e22ce, #c026d3)' : 'rgba(255,255,255,0.1)',
  borderRadius: 16, padding: '10px 16px', color: '#fff', maxWidth: '70%',
  wordBreak: 'break-word',
});

function getChatId(uid1, uid2) {
  return [uid1, uid2].sort().join('_');
}

export default function PrivateChat() {
  const { currentUser, userRole } = useAuth();
  const [contacts, setContacts] = useState([]);
  const [selectedContact, setSelectedContact] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMsg, setNewMsg] = useState('');
  const [search, setSearch] = useState('');
  const [lastMessages, setLastMessages] = useState({});
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [showList, setShowList] = useState(true);
  const messagesEndRef = useRef(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Fetch contacts based on role
  useEffect(() => {
    let q;
    if (userRole === 'client') {
      // Clients see admins and accountants
      q = query(collection(db, 'users'), where('role', 'in', ['admin', 'accountant']));
    } else {
      // Admins and accountants see all users except themselves
      q = query(collection(db, 'users'));
    }
    const unsub = onSnapshot(q, snap => {
      const list = snap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .filter(u => u.id !== currentUser.uid);
      setContacts(list);
    });
    return () => unsub();
  }, [currentUser, userRole]);

  // Listen to messages for selected contact
  useEffect(() => {
    if (!selectedContact) return;
    const chatId = getChatId(currentUser.uid, selectedContact.id);
    const q = query(collection(db, 'privateChats', chatId, 'messages'), orderBy('createdAt', 'asc'));
    const unsub = onSnapshot(q, snap => {
      setMessages(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, [selectedContact, currentUser]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!newMsg.trim() || !selectedContact) return;
    const chatId = getChatId(currentUser.uid, selectedContact.id);
    await addDoc(collection(db, 'privateChats', chatId, 'messages'), {
      text: newMsg.trim(),
      senderId: currentUser.uid,
      senderName: currentUser.displayName || currentUser.email,
      createdAt: serverTimestamp(),
    });
    setNewMsg('');
  };

  const filteredContacts = contacts.filter(c =>
    (c.fullName || '').toLowerCase().includes(search.toLowerCase()) ||
    (c.email || '').toLowerCase().includes(search.toLowerCase())
  );

  const roleBadge = (role) => ({
    admin: { bg: '#c026d3', label: 'Admin' },
    accountant: { bg: '#7e22ce', label: 'Accountant' },
    client: { bg: '#3b82f6', label: 'Client' },
  }[role] || { bg: '#888', label: role });

  return (
    <>
      <Navbar onMenuClick={() => setSidebarOpen(p => !p)} />
      <div style={pageWrapper}>
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div style={{ ...chatLayout, marginLeft: isMobile ? 0 : 260 }}>

          {/* Contact List */}
          {(!isMobile || showList) && (
            <div style={contactList}>
              <div style={{ padding: 16, borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                <h3 style={{ color: '#fff', margin: '0 0 12px' }}>Messages</h3>
                <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,0.07)', borderRadius: 10, padding: '0 12px' }}>
                  <FiSearch color="rgba(255,255,255,0.5)" size={14} />
                  <input
                    placeholder="Search..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    style={{ background: 'transparent', border: 'none', color: '#fff', padding: '10px 8px', outline: 'none', width: '100%', fontSize: '0.9rem' }}
                  />
                </div>
              </div>
              {filteredContacts.map(contact => {
                const badge = roleBadge(contact.role);
                const isSelected = selectedContact?.id === contact.id;
                return (
                  <div
                    key={contact.id}
                    onClick={() => { setSelectedContact(contact); setShowList(false); }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px',
                      background: isSelected ? 'rgba(192,38,211,0.15)' : 'transparent',
                      borderLeft: isSelected ? '3px solid #c026d3' : '3px solid transparent',
                      cursor: 'pointer', transition: 'all 0.2s',
                    }}
                  >
                    <div style={{ width: 42, height: 42, borderRadius: '50%', background: 'linear-gradient(135deg, #7e22ce, #c026d3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: '1.1rem', flexShrink: 0 }}>
                      {contact.fullName?.charAt(0).toUpperCase() || '?'}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ color: '#fff', fontWeight: 600, fontSize: '0.9rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{contact.fullName || contact.email}</div>
                      <span style={{ background: badge.bg, color: '#fff', padding: '1px 8px', borderRadius: 20, fontSize: '0.7rem', fontWeight: 600 }}>{badge.label}</span>
                    </div>
                  </div>
                );
              })}
              {filteredContacts.length === 0 && (
                <p style={{ color: 'rgba(255,255,255,0.4)', padding: 16, fontSize: '0.9rem' }}>No contacts found.</p>
              )}
            </div>
          )}

          {/* Chat Area */}
          {(!isMobile || !showList) && (
            <div style={mainChat}>
              {selectedContact ? (
                <>
                  {/* Header */}
                  <div style={{ background: 'rgba(255,255,255,0.08)', borderBottom: '1px solid rgba(255,255,255,0.15)', padding: '16px 24px', display: 'flex', alignItems: 'center', gap: 12 }}>
                    {isMobile && (
                      <button onClick={() => setShowList(true)} style={{ background: 'none', border: 'none', color: '#e879f9', cursor: 'pointer', marginRight: 4 }}>
                        <FiArrowLeft size={20} />
                      </button>
                    )}
                    <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'linear-gradient(135deg, #7e22ce, #c026d3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700 }}>
                      {selectedContact.fullName?.charAt(0).toUpperCase() || '?'}
                    </div>
                    <div>
                      <strong style={{ color: '#fff' }}>{selectedContact.fullName}</strong>
                      <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)' }}>{selectedContact.role}</div>
                    </div>
                  </div>

                  {/* Messages */}
                  <div style={{ flex: 1, overflowY: 'auto', padding: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {messages.length === 0 && (
                      <p style={{ color: 'rgba(255,255,255,0.4)', textAlign: 'center', marginTop: 40 }}>No messages yet. Say hello!</p>
                    )}
                    {messages.map(msg => {
                      const isMine = msg.senderId === currentUser.uid;
                      return (
                        <div key={msg.id} style={{ display: 'flex', flexDirection: 'column', alignItems: isMine ? 'flex-end' : 'flex-start', gap: 2 }}>
                          {!isMine && <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', marginLeft: 8 }}>{msg.senderName}</span>}
                          <div style={bubble(isMine)}>{msg.text}</div>
                          <small style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.7rem', margin: '0 8px' }}>
                            {msg.createdAt ? new Date(msg.createdAt.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                          </small>
                        </div>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Input */}
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
                </>
              ) : (
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.4)', flexDirection: 'column', gap: 12 }}>
                  <FiSend size={48} color="rgba(255,255,255,0.2)" />
                  <p>Select a contact to start chatting</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
