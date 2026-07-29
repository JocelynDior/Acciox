import React, { useState, useEffect } from 'react';
import {
  db, collection, onSnapshot, query, orderBy, limit, where,
} from '../firebase';
import { useAuth } from '../context/AuthContext';
import { FiShield, FiSearch, FiDownload, FiTrash2 } from 'react-icons/fi';
import { toast } from 'react-hot-toast';

const pageWrapper = {
  background: 'linear-gradient(135deg, #0f0a1a 0%, #1a0f2e 50%, #2d1b4e 100%)',
  minHeight: '100vh', display: 'flex',
};
const mainContent = { marginLeft: 260, paddingTop: 80, padding: '80px 24px 40px', flex: 1 };
const mobileMain = { ...mainContent, marginLeft: 0 };
const card = {
  background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(20px)',
  border: '1px solid rgba(255,255,255,0.15)', borderRadius: 16, padding: 20, color: '#fff',
};

export default function AuditLog() {
  const { currentUser } = useAuth();
  const [logs, setLogs] = useState([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const perPage = 20;
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const q = query(collection(db, 'auditLogs'), orderBy('timestamp', 'desc'), limit(200));
    const unsub = onSnapshot(q, snap => setLogs(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    return () => unsub();
  }, []);

  const filtered = logs.filter(log => {
    const s = search.toLowerCase();
    return (log.action || '').toLowerCase().includes(s) || (log.performedBy || '').toLowerCase().includes(s);
  });
  const paginated = filtered.slice(page * perPage, (page + 1) * perPage);
  const totalPages = Math.ceil(filtered.length / perPage);

  const actionColors = {
    ADD: '#22c55e', DELETE: '#ef4444', VERIFY: '#3b82f6', APPROVE: '#22c55e', REJECT: '#ef4444', LOGIN: '#888',
  };

  const exportCSV = () => {
    const rows = [['Action','Performed By','Company','Timestamp']];
    logs.forEach(l => rows.push([l.action, l.performedBy, l.companyName, l.timestamp?.toDate?.().toISOString() || '']));
    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], {type:'text/csv'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'audit-log.csv'; a.click();
  };

  return (
    <>
      <Navbar />
      <div style={pageWrapper}>
        <Sidebar />
        <main style={isMobile ? mobileMain : mainContent}>
          <h1 style={{ color: '#fff', display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
            <FiShield color="#c026d3" /> Audit Log
          </h1>
          <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,0.07)', borderRadius: 12, padding: '0 14px', flex: 1, minWidth: 200 }}>
              <FiSearch color="rgba(255,255,255,0.5)" />
              <input placeholder="Search logs..." value={search} onChange={e => setSearch(e.target.value)} style={{ background: 'transparent', border: 'none', color: '#fff', padding: '12px 8px', outline: 'none', width: '100%' }} />
            </div>
            <button onClick={exportCSV} style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 12, color: '#fff', padding: '10px 20px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}><FiDownload /> Export CSV</button>
          </div>
          {paginated.map(log => (
            <div key={log.id} style={{ ...card, marginBottom: 12, borderLeft: `4px solid ${actionColors[log.action?.split('_')[0]] || '#888'}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <strong>{log.action}</strong> — <span>{log.companyName || 'N/A'}</span>
                </div>
                <span style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)' }}>
                  {log.timestamp ? new Date(log.timestamp.seconds * 1000).toLocaleString() : ''}
                </span>
              </div>
              <div style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.7)', marginTop: 4 }}>
                Performed by: {log.performedBy} • IP: {log.ip || '—'}
              </div>
            </div>
          ))}
          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginTop: 20 }}>
              <button onClick={() => setPage(p => Math.max(0, p-1))} disabled={page===0} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: 8, color: '#fff', padding: '8px 16px', cursor: 'pointer' }}>Prev</button>
              <span style={{ color: '#fff' }}>{page+1} / {totalPages}</span>
              <button onClick={() => setPage(p => Math.min(totalPages-1, p+1))} disabled={page>=totalPages-1} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: 8, color: '#fff', padding: '8px 16px', cursor: 'pointer' }}>Next</button>
            </div>
          )}
        </main>
      </div>
    </>
  );
}
