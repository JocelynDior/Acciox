import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  FiHome, FiUsers, FiSettings, FiBriefcase, FiList, FiRefreshCw,
  FiDollarSign, FiFileText, FiPieChart, FiMessageSquare, FiCpu,
  FiCreditCard, FiInfo, FiShield,
} from 'react-icons/fi';

const sidebarBase = {
  position: 'fixed', top: 0, left: 0, height: '100vh', width: 260,
  background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)', borderRight: '1px solid rgba(255,255,255,0.1)',
  paddingTop: 80, display: 'flex', flexDirection: 'column',
  zIndex: 900, transition: 'transform 0.3s ease', overflowY: 'auto',
};
const overlayStyle = {
  position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 899,
};
const linkStyleBase = {
  display: 'flex', alignItems: 'center', gap: 12, padding: '12px 24px',
  color: 'rgba(255,255,255,0.6)', textDecoration: 'none', fontSize: '0.9rem',
  fontWeight: 500, borderRadius: 12, margin: '2px 12px', transition: 'all 0.2s',
};
const linkActiveStyle = {
  background: 'linear-gradient(135deg, #c026d3, #7e22ce)', color: '#fff', fontWeight: 600,
};
const sectionTitleStyle = {
  color: 'rgba(255,255,255,0.4)', fontSize: '0.7rem', fontWeight: 700,
  textTransform: 'uppercase', letterSpacing: '0.05em', padding: '16px 24px 6px',
};
const bottomStyle = {
  marginTop: 'auto', padding: '20px', borderTop: '1px solid rgba(255,255,255,0.1)', textAlign: 'center',
};
const brandStyle = {
  background: 'linear-gradient(to right, #c026d3, #e879f9)',
  WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
  backgroundClip: 'text', fontWeight: 800, marginTop: 4, fontSize: '0.85rem',
};

export default function Sidebar({ isOpen, onClose, companyId, companyName }) {
  const { userRole, companyId: userCompanyId } = useAuth();
  const location = useLocation();
  const effectiveCompanyId = companyId || userCompanyId;

  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/');

  const renderLink = (item) => {
    const active = isActive(item.to);
    return (
      <Link
        key={item.to}
        to={item.to}
        style={{ ...linkStyleBase, ...(active ? linkActiveStyle : {}) }}
        onClick={onClose}
        onMouseEnter={e => { if (!active) { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = '#fff'; } }}
        onMouseLeave={e => { if (!active) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.6)'; } }}
      >
        {item.icon}
        {item.label}
      </Link>
    );
  };

  const adminLinks = [
    { to: '/admin', label: 'Dashboard', icon: <FiHome size={16} /> },
    { to: '/admin/companies', label: 'Companies', icon: <FiBriefcase size={16} /> },
    { to: '/admin/users', label: 'Users', icon: <FiUsers size={16} /> },
    { to: '/chat', label: 'Chat', icon: <FiMessageSquare size={16} /> },
    { to: '/settings', label: 'Settings', icon: <FiSettings size={16} /> },
    { to: '/more-info', label: 'More Info', icon: <FiInfo size={16} /> },
  ];

  const accountantLinks = [
    { to: '/accountant', label: 'My Dashboard', icon: <FiHome size={16} /> },
    { to: '/accountant/queue', label: 'Transaction Queue', icon: <FiList size={16} /> },
    { to: '/accountant/sync', label: 'Sync Manager', icon: <FiRefreshCw size={16} /> },
    { to: '/chat', label: 'Chat', icon: <FiMessageSquare size={16} /> },
    { to: '/settings', label: 'Settings', icon: <FiSettings size={16} /> },
    { to: '/more-info', label: 'More Info', icon: <FiInfo size={16} /> },
  ];

  const clientLinks = [
    { to: '/client', label: 'My Company', icon: <FiHome size={16} /> },
    { to: '/client/reports', label: 'Reports', icon: <FiPieChart size={16} /> },
    { to: '/client/chat', label: 'Chat', icon: <FiMessageSquare size={16} /> },
    { to: '/settings', label: 'Settings', icon: <FiSettings size={16} /> },
    { to: '/more-info', label: 'More Info', icon: <FiInfo size={16} /> },
  ];

  const clientCompanyLinks = effectiveCompanyId ? [
    { to: '/company/' + effectiveCompanyId + '/accounts', label: 'Account Management', icon: <FiShield size={16} /> },
    { to: '/company/' + effectiveCompanyId + '/tax', label: 'Tax Management', icon: <FiFileText size={16} /> },
    { to: '/company/' + effectiveCompanyId + '/reconciliation', label: 'Reconciliation', icon: <FiRefreshCw size={16} /> },
  ] : [];

  const companyLinks = companyId ? [
    { to: '/company/' + companyId + '/dashboard', label: 'Dashboard', icon: <FiHome size={16} /> },
    { to: '/company/' + companyId + '/transactions', label: 'Transactions', icon: <FiList size={16} /> },
    { to: '/company/' + companyId + '/expenses', label: 'Staff Expenses', icon: <FiUsers size={16} /> },
    { to: '/company/' + companyId + '/payroll', label: 'Payroll', icon: <FiDollarSign size={16} /> },
    { to: '/company/' + companyId + '/reports', label: 'Reports', icon: <FiPieChart size={16} /> },
    { to: '/company/' + companyId + '/invoices', label: 'Invoices', icon: <FiCreditCard size={16} /> },
    { to: '/company/' + companyId + '/accounts', label: 'Account Management', icon: <FiShield size={16} /> },
    { to: '/company/' + companyId + '/tax', label: 'Tax Management', icon: <FiFileText size={16} /> },
    { to: '/company/' + companyId + '/reconciliation', label: 'Reconciliation', icon: <FiRefreshCw size={16} /> },
    { to: '/company/' + companyId + '/chat/group', label: 'Group Chat', icon: <FiMessageSquare size={16} /> },
    { to: '/company/' + companyId + '/chat/ai', label: 'AI Chat', icon: <FiCpu size={16} /> },
  ] : [];

  const mainLinks = userRole === 'admin' ? adminLinks : userRole === 'accountant' ? accountantLinks : clientLinks;

  return (
    <>
      {isOpen && <div style={overlayStyle} onClick={onClose} />}
      <nav style={{ ...sidebarBase, transform: isOpen ? 'translateX(0)' : 'translateX(-100%)' }}>

        {/* Main Menu */}
        <div style={sectionTitleStyle}>{userRole} menu</div>
        {mainLinks.map(renderLink)}

        {/* Client company links */}
        {userRole === 'client' && clientCompanyLinks.length > 0 && (
          <>
            <div style={sectionTitleStyle}>My Company</div>
            {clientCompanyLinks.map(renderLink)}
          </>
        )}

        {/* Company workspace links (admin/accountant) */}
        {companyLinks.length > 0 && (
          <>
            <div style={sectionTitleStyle}>Company Workspace</div>
            {companyName && <div style={{ color: '#fff', fontSize: '0.85rem', fontWeight: 600, padding: '0 24px 8px' }}>{companyName}</div>}
            {companyLinks.map(renderLink)}
          </>
        )}

        <div style={bottomStyle}>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem', margin: 0 }}>Acciox v1.0</p>
          <p style={brandStyle}>AI-Powered Finance</p>
        </div>
      </nav>
    </>
  );
}
