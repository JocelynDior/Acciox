import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { db, doc, getDoc } from '../firebase';
import { toast } from 'react-hot-toast';

// ---- Inline Styles ----
const pageStyle = {
  background: 'transparent',
  minHeight: '100vh',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '20px',
  fontFamily: "'Inter', system-ui, sans-serif",
};

const cardStyle = {
  background: 'rgba(255,255,255,0.08)',
  backdropFilter: 'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)',
  border: '1px solid rgba(255,255,255,0.15)',
  borderRadius: 20,
  padding: '40px 32px',
  maxWidth: 500,
  width: '100%',
  color: '#fff',
  boxShadow: '0 20px 50px rgba(0,0,0,0.4)',
  animation: 'fadeIn 0.7s ease forwards', // global fadeIn
  textAlign: 'center',
};

const iconContainerStyle = {
  width: 80,
  height: 80,
  borderRadius: '50%',
  background: 'linear-gradient(135deg, #7e22ce, #c026d3)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  margin: '0 auto 24px',
  fontSize: '2.5rem',
  animation: 'pulse-glow 2s infinite', // global pulse-glow
};

const titleStyle = {
  fontWeight: 700,
  fontSize: '1.8rem',
  marginBottom: 4,
};

const subtitleStyle = {
  background: 'linear-gradient(to right, #c026d3, #e879f9)',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  backgroundClip: 'text',
  fontWeight: 700,
  fontSize: '1.2rem',
  marginBottom: 16,
};

const messageStyle = {
  color: 'rgba(255,255,255,0.8)',
  lineHeight: 1.6,
  marginBottom: 20,
  fontSize: '0.95rem',
};

const infoBoxStyle = {
  background: 'rgba(255,255,255,0.06)',
  borderRadius: 12,
  padding: '16px 20px',
  marginBottom: 20,
  textAlign: 'left',
  fontSize: '0.9rem',
  border: '1px solid rgba(255,255,255,0.1)',
};

const infoRowStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: 8,
  color: 'rgba(255,255,255,0.7)',
};

const statusBadgeStyle = {
  background: '#f59e0b',
  color: '#000',
  padding: '2px 12px',
  borderRadius: 20,
  fontSize: '0.8rem',
  fontWeight: 600,
  display: 'inline-block',
};

const buttonRowStyle = {
  display: 'flex',
  gap: 12,
  marginTop: 20,
  flexWrap: 'wrap',
  justifyContent: 'center',
};

const gradientBtnStyle = {
  padding: '12px 24px',
  background: 'linear-gradient(135deg, #7e22ce, #c026d3)',
  border: 'none',
  borderRadius: 12,
  color: '#fff',
  fontWeight: 600,
  fontSize: '0.95rem',
  cursor: 'pointer',
  boxShadow: '0 4px 15px rgba(192,38,211,0.3)',
  transition: 'all 0.2s',
};

const glassBtnStyle = {
  padding: '12px 24px',
  background: 'rgba(255,255,255,0.1)',
  border: '1px solid rgba(255,255,255,0.2)',
  borderRadius: 12,
  color: '#fff',
  fontWeight: 600,
  fontSize: '0.95rem',
  cursor: 'pointer',
  backdropFilter: 'blur(10px)',
  transition: 'all 0.2s',
};

const bottomLinksStyle = {
  marginTop: 24,
  fontSize: '0.8rem',
  color: 'rgba(255,255,255,0.4)',
  display: 'flex',
  justifyContent: 'center',
  gap: 16,
  flexWrap: 'wrap',
};

export default function NotActivated() {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  const [userData, setUserData] = useState({
    email: currentUser?.email || '',
    companyName: '',
    createdAt: null,
    fullName: '',
  });
  const [loading, setLoading] = useState(true);

  // Fetch user document for company name & registration date
  useEffect(() => {
    if (!currentUser) return;
    async function fetchUserDoc() {
      try {
        const docSnap = await getDoc(doc(db, 'users', currentUser.uid));
        if (docSnap.exists()) {
          const data = docSnap.data();
          setUserData({
            email: data.email || currentUser.email,
            companyName: data.companyName || 'Your Company',
            createdAt: data.createdAt ? new Date(data.createdAt.seconds * 1000) : new Date(),
            fullName: data.fullName || '',
          });
        }
      } catch (err) {
        console.error('Error fetching user data:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchUserDoc();
  }, [currentUser]);

  const formatDate = (date) => {
    if (!date) return '—';
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  const handleRefreshStatus = async () => {
    if (!currentUser) return;
    try {
      const docSnap = await getDoc(doc(db, 'users', currentUser.uid));
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.status === 'active') {
          // Redirect to client dashboard
          navigate('/client', { replace: true });
        } else {
          toast('Still pending verification — please check back later.', { icon: '⏳' });
        }
      } else {
        toast.error('User data not found.');
      }
    } catch {
      toast.error('Could not check status. Try again.');
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch {
      toast.error('Logout failed.');
    }
  };

  return (
    <div style={pageStyle}>
      <div style={cardStyle}>
        <div style={iconContainerStyle}>⏳</div>
        <h1 style={titleStyle}>Account Not Activated</h1>
        <p style={subtitleStyle}>Welcome to Acciox!</p>

        <p style={messageStyle}>
          Your account has been created successfully and is currently under review.
          Our admin team will verify your company details and activate your account shortly.
        </p>

        {!loading && (
          <div style={infoBoxStyle}>
            <div style={infoRowStyle}>
              <span>📧 Email</span>
              <span>{userData.email}</span>
            </div>
            <div style={infoRowStyle}>
              <span>🏢 Company</span>
              <span>{userData.companyName}</span>
            </div>
            <div style={infoRowStyle}>
              <span>📅 Registered</span>
              <span>{formatDate(userData.createdAt)}</span>
            </div>
            <div style={infoRowStyle}>
              <span>🔄 Status</span>
              <span style={statusBadgeStyle}>Pending Verification</span>
            </div>
          </div>
        )}

        <p style={{ ...messageStyle, fontSize: '0.85rem' }}>
          You will receive an email notification once your account is activated.
          This usually takes 1-2 business days.
        </p>

        <div style={buttonRowStyle}>
          <button style={gradientBtnStyle} onClick={handleRefreshStatus}>
            Refresh Status
          </button>
          <button style={glassBtnStyle} onClick={handleLogout}>
            Logout
          </button>
        </div>

        <div style={bottomLinksStyle}>
          <span>
            Need help?{' '}
            <a href="mailto:support@acciox.com" style={{ color: '#e879f9' }}>
              Contact support
            </a>
          </span>
          <Link to="/terms" style={{ color: 'rgba(255,255,255,0.4)', textDecoration: 'none' }}>Terms</Link>
          <Link to="/privacy" style={{ color: 'rgba(255,255,255,0.4)', textDecoration: 'none' }}>Privacy</Link>
        </div>
      </div>
    </div>
  );
}
