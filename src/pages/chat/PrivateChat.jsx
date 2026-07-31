import React, { useState, useEffect, useRef } from 'react';
import {
  db, collection, onSnapshot, addDoc, serverTimestamp, query, orderBy, where,
} from '../../firebase';
import { useAuth } from '../../context/AuthContext';
import { useParams } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import ChatSidebar from './ChatSidebar';
import { FiSend, FiUser } from 'react-icons/fi';

const pageWrapper = {
  background: 'linear-gradient(135deg, #0f0a1a 0%, #1a0f2e 50%, #2d1b4e 100%)',
  minHeight: '100vh', display: 'flex',
  fontFamily: "'Inter', system-ui, sans-serif",
};
const chatLayout = { display: 'flex', height: 'calc(100vh - 64px)', marginTop: 64 };
const mainChat = { flex: 1, display: 'flex', flexDirection: 'column', background: 'rgba(255,255,255,0.03)' };
const header = {
  background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(20px)',
  borderBottom: '1px solid rgba(255,255,255,0.15)', padding: '16px 24px', color: '#fff',
};
const messagesContainer = { flex: 1, overflowY: 'auto', padding: 20, display: 'flex', flexDirection: 'column', gap: 8 };
const bubble = (isMine) => ({
  alignSelf: isMine ? 'flex-end' : 'flex-start',
  background: isMine ? 'linear-gradient(135deg, #7e22ce, #c026d3)' : 'rgba(255,255,255,0.1)',
  backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.2)',
  borderRadius: 16, padding: '10px 16px', color: '#fff', maxWidth: '70%',
});
const inputArea = {
  background: 'rgba(255,255,255,0.08)', borderTop: '1px solid rgba(255,255,255,0.15)',
  padding: '16px 24px', display: 'flex', alignItems: 'center', gap: 12,
};

export default function PrivateChat() {
  const { companyId } = useParams();
  const { currentUser } = useAuth();
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [users, setUsers] = useState([]);
  const [newMsg, setNewMsg] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (!companyId) return;
    const q = query(collection(db, 'users'), where('companyId', '==', companyId));
    const unsub = onSnapshot(q, snap => setUsers(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    return () => unsub();
  }, [companyId]);

  useEffect(() => {
    if (!companyId || !selectedUser) return;
    const ids = [currentUser.uid, selectedUser.id].sort();
    const chatId = ids.join('_');
    const path = 'chats/' + companyId + '/private/' + chatId + '/messages';
    const q = query(collection(db, path), orderBy('createdAt', 'asc'));
    const unsub = onSnapshot(q, snap => setMessages(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    return () => unsub();
  }, [companyId, selectedUser, currentUser.uid]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!newMsg.trim() || !selectedUser) return;
    const ids = [currentUser.uid, selectedUser.id].sort();
    const chatId = ids.join('_');
    const path = 'chats/' + companyId + '/private/' + chatId + '/messages';
    await addDoc(collection(db, path), {
      text: newMsg.trim(),
      senderId: currentUser.uid,
      senderName: currentUser.displayName || currentUser.email,
      createdAt: serverTimestamp(),
    });
    setNewMsg('');
  };

  return (
    <div style={pageWrapper}>
      <Navbar />
      <div style={chatLayout}>
        <ChatSidebar companyId={companyId} />
        <div style={mainChat}>
          <div style={header}>
            {selectedUser ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'linear-gradient(135deg, #7e22ce, #c026d3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700 }}>
                  {selectedUser.fullName?.charAt(0).toUpperCase() || '?'}
                </div>
                <div>
                  <strong>{selectedUser.fullName}</strong>
                  <div style={{ fontSize: '0.8rem', color: '#22c55e' }}>● Online</div>
                </div>
              </div>
            ) : (
              <span>Select a person to start chatting</span>
            )}
          </div>

          {!selectedUser ? (
            <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
              <h3 style={{ color: '#fff', marginBottom: 16 }}>Company Members</h3>
              {users.filter(u => u.id !== currentUser.uid).map(user => (
                <div
                  key={user.id}
                  onClick={() => setSelectedUser(user)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px',
                    background: 'rgba(255,255,255,0.05)', borderRadius: 12, marginBottom: 8,
                    cursor: 'pointer', color: '#fff',
                  }}
                >
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg, #7e22ce, #c026d3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700 }}>
                    {user.fullName?.charAt(0).toUpperCase() || '?'}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600 }}>{user.fullName}</div>
                    <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)' }}>{user.role}</div>
                  </div>
                  <div style={{ marginLeft: 'auto', width: 10, height: 10, borderRadius: '50%', background: '#22c55e' }} />
                </div>
              ))}
            </div>
          ) : (
            <>
              <div style={messagesContainer}>
                {messages.map(msg => {
                  const isMine = msg.senderId === currentUser.uid;
                  return (
                    <div key={msg.id} style={{ display: 'flex', flexDirection: 'column', alignItems: isMine ? 'flex-end' : 'flex-start', gap: 2 }}>
                      {!isMine && <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)', marginLeft: 8 }}>{msg.senderName}</span>}
                      <div style={bubble(isMine)}>{msg.text}</div>
                      <small style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.7rem', marginTop: 2, paddingLeft: 8, paddingRight: 8 }}>
                        {msg.createdAt ? new Date(msg.createdAt.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                      </small>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>
              <div style={inputArea}>
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
          )}
        </div>
      </div>
    </div>
  );
}
