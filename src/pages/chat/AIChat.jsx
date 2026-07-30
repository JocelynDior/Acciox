import React, { useState, useEffect, useRef } from 'react';
import {
  db, collection, addDoc, onSnapshot, serverTimestamp, query, orderBy,
} from '../../firebase';
import { useAuth } from '../../context/AuthContext';
import { useParams } from 'react-router-dom';
import { answerQuery } from '../../services/aiOrchestrator';
import ChatSidebar from './ChatSidebar';
import { FiCpu, FiSend } from 'react-icons/fi';

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
const bubble = (isUser) => ({
  alignSelf: isUser ? 'flex-end' : 'flex-start',
  background: isUser ? 'linear-gradient(135deg, #7e22ce, #c026d3)' : 'rgba(255,255,255,0.1)',
  backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.2)',
  borderRadius: 16, padding: '10px 16px', color: '#fff', maxWidth: '70%',
});
const inputArea = {
  background: 'rgba(255,255,255,0.08)', borderTop: '1px solid rgba(255,255,255,0.15)',
  padding: '16px 24px', display: 'flex', alignItems: 'center', gap: 12,
};

export default function AIChat() {
  const { companyId } = useParams();
  const { currentUser } = useAuth();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (!companyId) return;
    const path = 'chats/' + companyId + '/ai/messages';
    const q = query(collection(db, path), orderBy('createdAt', 'asc'));
    const unsub = onSnapshot(q, snap => setMessages(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    return () => unsub();
  }, [companyId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const sendMessage = async (text) => {
    const question = text || input.trim();
    if (!question) return;
    const userMsg = { text: question, sender: 'user', createdAt: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    const path = 'chats/' + companyId + '/ai/messages';
    await addDoc(collection(db, path), {
      text: question, sender: 'user', senderName: currentUser.displayName || 'You',
      createdAt: serverTimestamp(),
    });

    try {
      const companyContext = { companyId };
      const result = await answerQuery(question, companyContext);
      const aiMsg = { text: result.answer, sender: 'ai', createdAt: new Date() };
      setMessages(prev => [...prev, aiMsg]);
      await addDoc(collection(db, path), {
        text: result.answer, sender: 'ai', senderName: 'Acciox AI',
        createdAt: serverTimestamp(),
      });
    } catch (err) {
      setMessages(prev => [...prev, { text: 'Sorry, I encountered an error.', sender: 'ai' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={pageWrapper}>
      <Navbar />
      <div style={chatLayout}>
        <ChatSidebar companyId={companyId} />
        <div style={mainChat}>
          <div style={header}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'linear-gradient(135deg, #c026d3, #e879f9)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <FiCpu color="#fff" size={20} />
              </div>
              <div>
                <strong>Acciox AI Assistant</strong>
                <div style={{ fontSize: '0.8rem', color: '#22c55e' }}>● Powered by Groq AI</div>
              </div>
            </div>
          </div>
          <div style={messagesContainer}>
            {messages.length === 0 && !loading && (
              <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.6)', marginTop: 40 }}>
                <p>Hello! I'm your Acciox AI assistant. Ask me about your finances.</p>
                <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 20, flexWrap: 'wrap' }}>
                  <button onClick={() => sendMessage('What are my expenses this month?')} style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 20, padding: '8px 16px', color: '#fff', cursor: 'pointer', fontSize: '0.85rem' }}>Expenses this month?</button>
                  <button onClick={() => sendMessage('Show me pending transactions')} style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 20, padding: '8px 16px', color: '#fff', cursor: 'pointer', fontSize: '0.85rem' }}>Pending transactions</button>
                  <button onClick={() => sendMessage('Generate a summary')} style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 20, padding: '8px 16px', color: '#fff', cursor: 'pointer', fontSize: '0.85rem' }}>Summary</button>
                </div>
              </div>
            )}
            {messages.map((msg, idx) => (
              <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: msg.sender === 'user' ? 'flex-end' : 'flex-start', gap: 2 }}>
                {msg.sender !== 'user' && <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginLeft: 8 }}><div style={{ width: 24, height: 24, borderRadius: '50%', background: 'linear-gradient(135deg, #c026d3, #e879f9)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><FiCpu size={14} color="#fff" /></div><span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)' }}>Acciox AI</span></div>}
                <div style={bubble(msg.sender === 'user')}>{msg.text}</div>
              </div>
            ))}
            {loading && (
              <div style={{ alignSelf: 'flex-start', background: 'rgba(255,255,255,0.1)', borderRadius: 16, padding: '10px 16px', color: '#fff' }}>
                <span>Thinking...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
          <div style={inputArea}>
            <input
              type="text"
              placeholder="Ask anything about your finances..."
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !loading) sendMessage(); }}
              style={{ flex: 1, background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 12, padding: '12px 16px', color: '#fff', outline: 'none' }}
              disabled={loading}
            />
            <button onClick={() => sendMessage()} disabled={loading} style={{ background: loading ? '#666' : 'linear-gradient(135deg, #7e22ce, #c026d3)', border: 'none', borderRadius: '50%', width: 48, height: 48, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
              <FiSend color="#fff" size={20} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
