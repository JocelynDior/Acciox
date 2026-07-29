import React from 'react';
import { FiCpu, FiActivity, FiClock } from 'react-icons/fi';

const card = {
  background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(20px)',
  border: '1px solid rgba(255,255,255,0.15)', borderRadius: 16, padding: 20, color: '#fff',
};

export default function AIIndicator({ processing = false, lastProcessed, itemsProcessed = 0 }) {
  const groqStatus = processing ? 'Working...' : 'Active';
  const geminiStatus = 'Coming Soon';

  return (
    <div style={card}>
      <h3 style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
        <FiCpu color="#e879f9" /> AI Processing Status
      </h3>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ width: 10, height: 10, borderRadius: '50%', background: processing ? '#22c55e' : '#888' }} />
          <strong>Groq</strong> <small style={{ color: 'rgba(255,255,255,0.5)' }}>(llama-3.3-70b)</small>
        </div>
        <span style={{ color: processing ? '#c026d3' : '#22c55e', fontWeight: 600, fontSize: '0.9rem' }}>{processing ? 'Processing...' : 'Active'}</span>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#666' }} />
          <strong>Gemini</strong>
        </div>
        <span style={{ background: '#f59e0b', color: '#000', padding: '2px 10px', borderRadius: 20, fontSize: '0.8rem' }}>Coming Soon</span>
      </div>
      {processing && (
        <div style={{ height: 4, background: 'linear-gradient(90deg, #7e22ce, #c026d3)', animation: 'pulseBar 1.5s infinite', borderRadius: 2, marginBottom: 12 }} />
      )}
      <div style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.7)' }}>
        {lastProcessed ? <span><FiClock /> Last processed: {new Date(lastProcessed.seconds * 1000).toLocaleTimeString()}</span> : <span>No recent activity</span>}
        <br />
        <span>Items processed today: {itemsProcessed}</span>
      </div>
      <small style={{ color: 'rgba(255,255,255,0.4)', marginTop: 12, display: 'block' }}>
        Dual validation: Groq and Gemini independently analyze each transaction and compare results to reduce errors.
      </small>
      <style>{`@keyframes pulseBar { 0% { opacity: 0.5; } 50% { opacity: 1; } 100% { opacity: 0.5; } }`}</style>
    </div>
  );
}
