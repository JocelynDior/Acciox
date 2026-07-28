import React, { useState, useEffect, useRef } from 'react';
import {
  db, collection, onSnapshot, addDoc, serverTimestamp,
  query, where, orderBy, limit,
} from '../../firebase';
import { useAuth } from '../../context/AuthContext';
import { useParams } from 'react-router-dom';
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
const messageBubble = (isMine) => ({
  alignSelf: isMine ? 'flex-end' : 'flex-start',
  background: isMine ? 'linear-gradient(135deg, #7e22ce, #c026d3)' : 'rgba(255,255,255,0.1)',
  backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.2)',
  borderRadius: 16, padding: '10px 16px', color: '#fff', maxWidth: '70%',
});
const inputArea = {
  background: 'rgba(255,255,255,0.08)', borderTop: '1px solid rgba(255,255,255,0.15)',
  padding: '16px 24px', display: 'flex', alignItems: 'center', gap: 12,
};

export default function GroupChat() {
  const { companyId } = useParams();
  const { currentUser } = useAuth();
  const [messages, setMessages] = useState([]);
  const [newMsg, setNewMsg] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (!companyId) return;
    const path = `chats/${companyId}/group/messages`;
    const q = query(collection(db, path), orderBy('createdAt', 'asc'), limit(50));
    const unsub = onSnapshot(q, (snap) => {
      const msgs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setMessages(msgs);
    });
    return () => unsub();
  }, [companyId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!newMsg.trim()) return;
    try {
      await addDoc(collection(db, `chats/${companyId}/group/messages`), {
        text: newMsg.trim(),
        senderId: currentUser.uid,
        senderName: currentUser.displayName || currentUser.email,
        createdAt: serverTimestamp(),
      });
      setNewMsg('');
    } catch (err) { toast.error('Failed to send message'); }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div style={pageWrapper}>
      <Navbar />
      <div style={chatLayout}>
        <ChatSidebar companyId={companyId} />
        <div style={mainChat}>
          <div style={header}>
            <h2 style={{ color: '#fff', margin: 0 }}>Group Chat – Company</h2>
            <small style={{ color: 'rgba(255,255,255,0.6)' }}>Online members</small>
          </div>
          <div style={messagesContainer}>
            {messages.length === 0 ? (
              <p style={{ color: 'rgba(255,255,255,0.5)', textAlign: 'center', marginTop: 40 }}>No messages yet. Start the conversation!</p>
            ) : (
              messages.map(msg => {
                const isMine = msg.senderId === currentUser.uid;
                return (
                  <div key={msg.id} style={{ display: 'flex', flexDirection: 'column', alignItems: isMine ? 'flex-end' : 'flex-start', gap: 2 }}>
                    {!isMine && <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)', marginLeft: 8 }}>{msg.senderName || 'User'}</span>}
                    <div style={messageBubble(isMine)}>{msg.text}</div>
                    <small style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.7rem', marginTop: 2, paddingLeft: 8, paddingRight: 8 }}>
                      {msg.createdAt ? new Date(msg.createdAt.seconds*1000).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}) : ''}
                    </small>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>
          <div style={inputArea}>
            <input
              type="text"
              placeholder="Type a message..."
              value={newMsg}
              onChange={e => setNewMsg(e.target.value)}
              onKeyDown={handleKeyPress}
              style={{ flex: 1, background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 12, padding: '12px 16px', color: '#fff', outline: 'none' }}
            />
            <button onClick={sendMessage} style={{ background: 'linear-gradient(135deg, #7e22ce, #c026d3)', border: 'none', borderRadius: '50%', width: 48, height: 48, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
              <FiSend color="#fff" size={20} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
