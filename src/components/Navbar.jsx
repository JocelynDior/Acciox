```jsx
import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import NotificationBell from './NotificationBell';

// ---- Inline styles ----
const navStyle = {
  position: 'fixed',
  top: 0,
  left: 0,
  width: '100%',
  height: 64,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '0 24px',
  background: 'rgba(255,255,255,0.05)',
  backdropFilter: 'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)',
  borderBottom: '1px solid rgba(255,255,255,0.1)',
  zIndex: 1000,
};

const leftStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
};

const hamburgerStyle = {
  background: 'none',
  border: 'none',
  color: '#fff',
  fontSize: '1.5rem',
  cursor: 'pointer',
  display: 'none', // shown via mobile styles later
};

const logoStyle = {
  fontSize: '1.5rem',
  fontWeight: 800,
  textDecoration: 'none',
  background: 'linear-gradient(to right, #c026d3, #e879f9)',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  backgroundClip: 'text',
};

const subtitleStyle = {
  fontSize: '0.75rem',
  color: 'rgba(255,255,255,0.4)',
  marginLeft: '4px',
};

const centerStyle = {
  display: 'flex',
  alignItems: 'center',
};

const rightStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '16px',
};

const linkStyle = {
  color: 'rgba(255,255,255,0.7)',
  textDecoration: 'none',
  fontSize: '0.85rem',
  fontWeight: 500,
};

const avatarContainerStyle = {
  position: 'relative',
};

const avatarStyle = {
  width: 36,
  height: 36,
  borderRadius: '50%',
  background: 'linear-gradient(135deg, #c026d3, #7e22ce)',
  color: '#fff',
  fontWeight: 700,
  fontSize: '1rem',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  border: 'none',
  cursor: 'pointer',
};

const dropdownStyle = {
  position: 'absolute',
  right: 0,
  top: '100%',
  marginTop: 8,
  background: 'rgba(30, 10, 50, 0.95)',
  backdropFilter: 'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)',
  border: '1px solid rgba(255,255,255,0.15)',
  borderRadius: 12,
  padding: '12px 0',
  minWidth: 220,
  boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
  zIndex: 1100,
};

const dropdownUserInfoStyle = {
  padding: '0 16px 12px',
  borderBottom: '1px solid rgba(255,255,255,0.1)',
  marginBottom: 8,
};

const userNameStyle = {
  fontWeight: 600,
  color: '#fff',
  fontSize: '0.95rem',
  margin: 0,
};

const userEmailStyle = {
  color: 'rgba(255,255,255,0.5)',
  fontSize: '0.8rem',
  margin: '4px 0 0',
};

const dropdownLinkStyle = {
  display: 'block',
  padding: '8px 16px',
  color: '#fff',
  textDecoration: 'none',
  fontSize: '0.85rem',
  transition: 'background 0.2s',
  background: 'none',
  border: 'none',
  width: '100%',
  textAlign: 'left',
};

const dividerStyle = {
  margin: '4px 0',
  borderColor: 'rgba(255,255,255,0.1)',
};

const logoutBtnStyle = {
  ...dropdownLinkStyle,
  color: '#ef4444',
  cursor: 'pointer',
};

// ---- Helper to get settings path ----
const getSettingsPath = (role) => {
  switch (role) {
    case 'admin': return '/admin/settings';
    case 'accountant': return '/accountant/settings';
    case 'client': return '/client/settings'; // fallback
    default: return '/';
  }
};

export default function Navbar({ onMenuClick }) {
  const { currentUser, userRole, logout } = useAuth();
  const navigate = useNavigate();
  const [isDropdownOpen, setDropdownOpen] = useState(false);
  const avatarRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (avatarRef.current && !avatarRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleDropdown = () => setDropdownOpen((prev) => !prev);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (err) {
      console.error('Logout failed', err);
    }
  };

  // Determine role label and badge color
  const roleLabel = userRole ? userRole.charAt(0).toUpperCase() + userRole.slice(1) : '';
  const badgeColor = userRole === 'admin' ? '#c026d3' : userRole === 'accountant' ? '#7e22ce' : '#3b82f6';
  const badgeStyle = {
    background: badgeColor,
    color: '#fff',
    padding: '4px 14px',
    borderRadius: 20,
    fontSize: '0.75rem',
    fontWeight: 600,
    textTransform: 'uppercase',
  };

  const userInitial = currentUser?.displayName
    ? currentUser.displayName.charAt(0).toUpperCase()
    : currentUser?.email?.charAt(0).toUpperCase() || '?';

  const settingsPath = getSettingsPath(userRole);

  return (
    <>
      <nav style={navStyle}>
        {/* Left side */}
        <div style={leftStyle}>
          {currentUser && (
            <button
              style={hamburgerStyle}
              onClick={onMenuClick}
              aria-label="Toggle menu"
            >
              ☰
            </button>
          )}
          <Link to={currentUser ? '/' : '/'} style={logoStyle}>
            Acciox
          </Link>
          <span style={subtitleStyle}>AI Finance Platform</span>
        </div>

        {/* Center – role badge (desktop only) */}
        {currentUser && (
          <div className="nav-center-badge" style={centerStyle}>
            <span style={badgeStyle}>{roleLabel}</span>
          </div>
        )}

        {/* Right side */}
        <div style={rightStyle}>
          {!currentUser ? (
            <>
              <Link to="/terms" style={linkStyle}>Terms</Link>
              <Link to="/privacy" style={linkStyle}>Privacy</Link>
            </>
          ) : (
            <>
              <NotificationBell />
              <div style={avatarContainerStyle} ref={avatarRef}>
                <button style={avatarStyle} onClick={toggleDropdown}>
                  {userInitial}
                </button>
                {isDropdownOpen && (
                  <div style={dropdownStyle}>
                    <div style={dropdownUserInfoStyle}>
                      <p style={userNameStyle}>
                        {currentUser.displayName || 'User'}
                      </p>
                      <p style={userEmailStyle}>{currentUser.email}</p>
                    </div>
                    <Link
                      to={settingsPath}
                      style={dropdownLinkStyle}
                      onClick={() => setDropdownOpen(false)}
                    >
                      Settings
                    </Link>
                    <hr style={dividerStyle} />
                    <Link
                      to="/terms"
                      style={dropdownLinkStyle}
                      onClick={() => setDropdownOpen(false)}
                    >
                      Terms of Service
                    </Link>
                    <Link
                      to="/privacy"
                      style={dropdownLinkStyle}
                      onClick={() => setDropdownOpen(false)}
                    >
                      Privacy Policy
                    </Link>
                    <hr style={dividerStyle} />
                    <button style={logoutBtnStyle} onClick={handleLogout}>
                      Logout
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </nav>

      {/* Embedded responsive CSS – hide center badge on mobile */}
      <style>{`
        .nav-center-badge {
          display: flex;
        }
        @media (max-width: 768px) {
          .nav-center-badge {
            display: none;
          }
          button[aria-label="Toggle menu"] {
            display: block !important;
          }
        }
        button[aria-label="Toggle menu"] {
          display: none;
        }
      `}</style>
    </>
  );
}
```
