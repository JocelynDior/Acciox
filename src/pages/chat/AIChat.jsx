import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import Navbar from '../../components/Navbar';
import Sidebar from '../../components/Sidebar';
import { FiCpu, FiSend } from 'react-icons/fi';

const SERVER_URL = 'https://accioxserver.onrender.com';

const pageWrapper = {
  background: 'transparent',
  minHeight: '100vh', display: 'flex', flexDirection: 'column',
  fontFamily: "'Inter', system-ui, sans-serif",
};
const bubble = (isUser) => ({
  alignSelf: isUser ? 'flex-end' : 'flex-start',
  background: isUser ? 'linear-gradient(135deg, #7e22ce, #c026d3)' : 'rgba(255,255,255,0.1)',
  borderRadius: 16, padding: '10px 16px', color: '#fff', maxWidth: '70%', wordBreak: 'break-word',
});

export default function AIChat() {
  const { currentUser } = useAuth();
  const [messages, setMessages] = useState([
    { text: "Hello! I'm your Acciox AI assistant. Ask me anything about your finances.", sender: 'ai' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(window.innerWidth > 768);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const handleResize = () => setIsDesktop(window.innerWidth > 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const sendMessage = async (text) => {
    const question = text || input.trim();
    if (!question || loading) return;
    setInput('');
    setMessages(prev => [...prev, { text: question, sender: 'user' }]);
    setLoading(true);
    try {
      const res = await fetch(`${SERVER_URL}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [
            { role: 'system', content: 'You are Acciox AI, an expert accountant and financial advisor. Answer clearly and helpfully.' },
            { role: 'user', content: question },
          ],
        }),
      });
      const data = await res.json();
      const answer = data.choices?.[0]?.message?.content || 'Sorry, I could not get a response.';
      setMessages(prev => [...prev, { text: answer, sender: 'ai' }]);
    } catch {
      setMessages(prev => [...prev, { text: 'Sorry, I encountered an error. Please try again.', sender: 'ai' }]);
    } finally {
      setLoading(false);
    }
  };

  const mainStyle = {
    marginLeft: isDesktop ? 260 : 0,
    display: 'flex', flexDirection: 'column', flex: 1, height: 'calc(100vh - 64px)', marginTop: 64,
  };

  return (
    <>
      <Navbar onMenuClick={() => setSidebarOpen(p => !p)} />
      <div style={pageWrapper}>
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div style={mainStyle}>
          {/* Header */}
          <div style={{ background: 'rgba(255,255,255,0.08)', borderBottom: '1px solid rgba(255,255,255,0.15)', padding: '16px 24px', display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'linear-gradient(135deg, #c026d3, #e879f9)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FiCpu color="#fff" size={20} />
            </div>
            <div>
              <strong style={{ color: '#fff' }}>Acciox AI Assistant</strong>
              <div style={{ fontSize: '0.8rem', color: '#22c55e' }}>● Powered by Groq AI</div>
            </div>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: 'auto', padding: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {messages.length === 1 && (
              <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 16 }}>
                {['What are my expenses this month?', 'Explain cash flow', 'What is VAT?'].map(q => (
                  <button key={q} onClick={() => sendMessage(q)} style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 20, padding: '8px 16px', color: '#fff', cursor: 'pointer', fontSize: '0.85rem' }}>{q}</button>
                ))}
              </div>
            )}
            {messages.map((msg, idx) => (
              <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: msg.sender === 'user' ? 'flex-end' : 'flex-start', gap: 4 }}>
                {msg.sender === 'ai' && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginLeft: 8 }}>
                    <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'linear-gradient(135deg, #c026d3, #e879f9)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <FiCpu size={12} color="#fff" />
                    </div>
                    <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)' }}>Acciox AI</span>
                  </div>
                )}
                <div style={bubble(msg.sender === 'user')}>{msg.text}</div>
              </div>
            ))}
            {loading && (
              <div style={{ alignSelf: 'flex-start', background: 'rgba(255,255,255,0.1)', borderRadius: 16, padding: '10px 16px', color: 'rgba(255,255,255,0.6)' }}>Thinking...</div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div style={{ background: 'rgba(255,255,255,0.08)', borderTop: '1px solid rgba(255,255,255,0.15)', padding: '16px 24px', display: 'flex', alignItems: 'center', gap: 12 }}>
            <input
              type="text"
              placeholder="Ask anything about your finances..."
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !loading) sendMessage(); }}
              disabled={loading}
              style={{ flex: 1, background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 12, padding: '12px 16px', color: '#fff', outline: 'none' }}
            />
            <button onClick={() => sendMessage()} disabled={loading} style={{ background: loading ? 'rgba(255,255,255,0.2)' : 'linear-gradient(135deg, #7e22ce, #c026d3)', border: 'none', borderRadius: '50%', width: 48, height: 48, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: loading ? 'not-allowed' : 'pointer' }}>
              <FiSend color="#fff" size={20} />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
