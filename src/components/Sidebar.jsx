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
  fontWeight: 500, borderRadius: 12, margin: '4px 12px', transition: 'all 0.2s',
};
const linkActiveStyle = {
  background: 'linear-gradient(135deg, #c026d3, #7e22ce)', color: '#ffffff', fontWeight: 600,
};
const sectionTitleStyle = {
  color: 'rgba(255,255,255,0.4)', fontSize: '0.7rem', fontWeight: 700,
  textTransform: 'uppercase', letterSpacing: '0.05em', padding: '20px 24px 8px', marginTop: 8,
};
const companyNameStyle = {
  color: '#ffffff', fontSize: '0.9rem', fontWeight: 600, padding: '0 24px 12px', marginTop: 4,
};
const bottomStyle = {
  marginTop: 'auto', padding: '24px', borderTop: '1px solid rgba(255,255,255,0.1)', textAlign: 'center',
};
const brandStyle = {
  background: 'linear-gradient(to right, #c026d3, #e879f9)',
  WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
  backgroundClip: 'text', fontWeight: 800, marginTop: 4,
};

export default function Sidebar({ isOpen, onClose, companyId, companyName }) {
  const { userRole } = useAuth();
  const location = useLocation();

  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/');

  const getMenuItems = () => {
    switch (userRole) {
      case 'admin':
        return [
          { to: '/admin', label: 'Dashboard', icon: <FiHome /> },
          { to: '/admin/companies', label: 'Companies', icon: <FiBriefcase /> },
          { to: '/admin/users', label: 'Users', icon: <FiUsers /> },
          { to: '/settings', label: 'Settings', icon: <FiSettings /> },
          { to: '/more-info', label: 'More Info', icon: <FiInfo /> },
        ];
      case 'accountant':
        return [
          { to: '/accountant', label: 'My Dashboard', icon: <FiHome /> },
          { to: '/accountant/queue', label: 'Transaction Queue', icon: <FiList /> },
          { to: '/accountant/sync', label: 'Sync Manager', icon: <FiRefreshCw /> },
          { to: '/settings', label: 'Settings', icon: <FiSettings /> },
          { to: '/more-info', label: 'More Info', icon: <FiInfo /> },
        ];
      case 'client':
        return [
          { to: '/client', label: 'My Company', icon: <FiHome /> },
          { to: '/client/reports', label: 'Reports', icon: <FiPieChart /> },
          { to: '/client/chat', label: 'Chat', icon: <FiMessageSquare /> },
          { to: '/settings', label: 'Settings', icon: <FiSettings /> },
          { to: '/more-info', label: 'More Info', icon: <FiInfo /> },
        ];
      default:
        return [];
    }
  };

  const getCompanyLinks = () => {
    if (!companyId) return [];
    const base = '/company/' + companyId;
    return [
      { to: base + '/dashboard', label: 'Dashboard', icon: <FiHome /> },
      { to: base + '/transactions', label: 'Transactions', icon: <FiList /> },
      { to: base + '/expenses', label: 'Staff Expenses', icon: <FiUsers /> },
      { to: base + '/payroll', label: 'Payroll', icon: <FiDollarSign /> },
      { to: base + '/reports', label: 'Reports', icon: <FiPieChart /> },
      { to: base + '/invoices', label: 'Invoices', icon: <FiCreditCard /> },
      { to: base + '/accounts', label: 'Account Management', icon: <FiShield /> },
      { to: base + '/tax', label: 'Tax Management', icon: <FiFileText /> },
      { to: base + '/reconciliation', label: 'Reconciliation', icon: <FiRefreshCw /> },
      { to: base + '/chat/group', label: 'Group Chat', icon: <FiMessageSquare /> },
      { to: base + '/chat/ai', label: 'AI Chat', icon: <FiCpu /> },
    ];
  };

  const menuItems = getMenuItems();
  const companyLinks = getCompanyLinks();

  const renderLink = (item) => {
    const active = isActive(item.to);
    return (
      <Link
        key={item.to}
        to={item.to}
        style={{ ...linkStyleBase, ...(active ? linkActiveStyle : {}) }}
        onClick={onClose}
        onMouseEnter={e => { if (!active) { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = '#fff'; } }}
        onMouseLeave={e => { if (!active) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.6)'; } }}
      >
        {item.icon}
        {item.label}
      </Link>
    );
  };

  return (
    <>
      {isOpen && <div style={overlayStyle} onClick={onClose} />}
      <nav style={{ ...sidebarBase, transform: isOpen ? 'translateX(0)' : 'translateX(-100%)' }}>
        <div>
          <div style={sectionTitleStyle}>{userRole} menu</div>
          {menuItems.map(renderLink)}
        </div>

        {companyLinks.length > 0 && (
          <div>
            <div style={sectionTitleStyle}>Company</div>
            <div style={companyNameStyle}>{companyName || 'Company Workspace'}</div>
            {companyLinks.map(renderLink)}
          </div>
        )}

        <div style={bottomStyle}>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem', margin: 0 }}>Acciox v1.0</p>
          <p style={brandStyle}>AI-Powered Finance</p>
        </div>
      </nav>
    </>
  );
}
