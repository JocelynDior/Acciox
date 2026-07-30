import React from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// ---- Inline Styles (no keyframes, use global animations) ----

const bgGradient = {
  background: 'linear-gradient(135deg, #4c1d95 0%, #7c3aed 50%, #ec4899 100%)',
  minHeight: '100vh',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontFamily: "'Inter', system-ui, sans-serif",
};

const glassCard = {
  background: 'rgba(255, 255, 255, 0.1)',
  backdropFilter: 'blur(12px)',
  WebkitBackdropFilter: 'blur(12px)',
  borderRadius: '1.5rem',
  border: '1px solid rgba(255, 255, 255, 0.2)',
  padding: '2.5rem 2rem',
  maxWidth: '400px',
  width: '90%',
  textAlign: 'center',
  color: '#fff',
  boxShadow: '0 20px 50px rgba(0, 0, 0, 0.3)',
};

const logoText = {
  fontSize: '2rem',
  fontWeight: 800,
  letterSpacing: '-0.025em',
  marginBottom: '1.5rem',
};

const spinnerContainer = {
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  margin: '2rem 0',
};

const spinnerStyle = {
  width: '48px',
  height: '48px',
  borderRadius: '50%',
  border: '4px solid transparent',
  borderTopColor: '#ec4899',
  borderRightColor: '#a855f7',
  animation: 'spin 1s linear infinite', // references global spin
};

const titleText = {
  fontSize: '1.1rem',
  opacity: 0.9,
  marginBottom: '2rem',
};

const btnStyle = {
  background: 'linear-gradient(to right, #a855f7, #ec4899)',
  border: 'none',
  color: '#fff',
  padding: '0.75rem 2rem',
  borderRadius: '2rem',
  fontSize: '1rem',
  fontWeight: 600,
  cursor: 'pointer',
  transition: 'all 0.2s ease',
  boxShadow: '0 4px 15px rgba(168, 85, 247, 0.5)',
};

// ---- Loading Screen Component ----
function LoadingScreen() {
  return (
    <div style={bgGradient}>
      <div style={glassCard}>
        <div style={logoText}>Acciox</div>
        <div style={spinnerContainer}>
          <div style={spinnerStyle}></div>
        </div>
        <p style={titleText}>Verifying your access…</p>
      </div>
    </div>
  );
}

// ---- RoleGuard Component ----
export function RoleGuard({ allowedRoles, children }) {
  const { currentUser, userRole, userStatus, loading } = useAuth();

  if (loading) return <LoadingScreen />;
  if (!currentUser) return <Navigate to="/login" replace />;
  if (userRole === 'client' && userStatus === 'unverified') {
    return <Navigate to="/not-activated" replace />;
  }
  if (allowedRoles && !allowedRoles.includes(userRole)) {
    return <Navigate to="/unauthorized" replace />;
  }
  return children;
}

// ---- Unauthorized Page Component ----
export function UnauthorizedPage() {
  const { userRole } = useAuth();
  const navigate = useNavigate();

  const goToDashboard = () => {
    const dashRoutes = {
      admin: '/admin',
      accountant: '/accountant',
      client: '/client',
    };
    navigate(dashRoutes[userRole] || '/');
  };

  return (
    <div style={bgGradient}>
      <div style={glassCard}>
        <div style={logoText}>Acciox</div>
        <h2 style={{ fontWeight: 700, fontSize: '1.5rem', marginBottom: '1rem' }}>
          Access Denied
        </h2>
        <p style={{ opacity: 0.9, marginBottom: '2rem', lineHeight: 1.6 }}>
          You don't have permission to view this page.
        </p>
        <button style={btnStyle} onClick={goToDashboard}>
          Go to Dashboard
        </button>
      </div>
    </div>
  );
}
