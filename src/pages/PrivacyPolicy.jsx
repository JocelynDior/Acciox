```jsx
import React from 'react';
import { Link } from 'react-router-dom';

// All styles as inline objects – no style injection or template literals with @keyframes
const containerStyle = {
  background: 'transparent',
  minHeight: '100vh',
  padding: '60px 20px',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'flex-start',
  fontFamily: "'Inter', system-ui, sans-serif",
};

const cardStyle = {
  background: 'rgba(255,255,255,0.08)',
  backdropFilter: 'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)',
  border: '1px solid rgba(255,255,255,0.15)',
  borderRadius: 20,
  padding: '40px 30px',
  maxWidth: 800,
  width: '100%',
  color: '#fff',
  boxShadow: '0 20px 50px rgba(0,0,0,0.4)',
  animation: 'fadeIn 0.8s ease forwards', // global fadeIn
};

const logoStyle = {
  background: 'linear-gradient(to right, #c026d3, #e879f9)',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  backgroundClip: 'text',
  fontSize: '2.5rem',
  fontWeight: 800,
  marginBottom: 8,
};

const sectionTitleStyle = {
  color: '#e879f9',
  fontSize: '1.4rem',
  marginTop: 28,
  marginBottom: 8,
  fontWeight: 600,
};

const paragraphStyle = {
  color: 'rgba(255,255,255,0.8)',
  lineHeight: 1.7,
  marginBottom: 16,
};

const footerStyle = {
  marginTop: 32,
  borderTop: '1px solid rgba(255,255,255,0.15)',
  paddingTop: 16,
  fontSize: '0.85rem',
  color: 'rgba(255,255,255,0.5)',
  textAlign: 'center',
};

export default function PrivacyPolicy() {
  return (
    <div style={containerStyle}>
      <div style={cardStyle}>
        <h1 style={logoStyle}>Acciox</h1>
        <p style={{ ...paragraphStyle, fontSize: '1.1rem' }}>
          Privacy Policy
        </p>

        <h2 style={sectionTitleStyle}>1. Introduction</h2>
        <p style={paragraphStyle}>
          Acciox is committed to protecting your privacy. This Privacy Policy explains how we collect, use, and safeguard your personal and financial information when you use our platform.
        </p>

        <h2 style={sectionTitleStyle}>2. Information We Collect</h2>
        <p style={paragraphStyle}>
          - <strong>Account Information:</strong> name, email address, role (admin/accountant/client).<br />
          - <strong>Company Financial Data:</strong> transactions, expenses, payroll, and invoices.<br />
          - <strong>Communications:</strong> chat messages between users.<br />
          - <strong>Usage Data:</strong> audit logs, feature usage, and session data for security and analytics.
        </p>

        <h2 style={sectionTitleStyle}>3. How We Use Your Information</h2>
        <p style={paragraphStyle}>
          - To provide AI-powered bookkeeping services.<br />
          - To process and categorize financial transactions automatically.<br />
          - To enable communication and collaboration between platform users.<br />
          - To maintain audit trails required for compliance and data integrity.
        </p>

        <h2 style={sectionTitleStyle}>4. AI Data Processing</h2>
        <p style={paragraphStyle}>
          Transaction data is sent to Groq AI for categorization and analysis. Gemini AI may be added as a secondary validator. AI providers do not retain your data beyond the processing request. No personal identifiable information is stored permanently by third-party AI services.
        </p>

        <h2 style={sectionTitleStyle}>5. Data Storage & Security</h2>
        <p style={paragraphStyle}>
          All data is stored in Firebase Firestore, encrypted in transit and at rest. Access is controlled by Firebase Authentication and strict security rules based on user role. The platform enforces a 30-minute session timeout for inactivity.
        </p>

        <h2 style={sectionTitleStyle}>6. Data Sharing</h2>
        <p style={paragraphStyle}>
          We do not sell or rent your personal data. Data may be shared with third-party integrations like Xero or QuickBooks only when you explicitly connect those services. Admins within your organization can view all company-level data as permitted by their role.
        </p>

        <h2 style={sectionTitleStyle}>7. Your Rights</h2>
        <p style={paragraphStyle}>
          You have the right to access, correct, export, and request deletion of your personal data. Contact us to exercise these rights. We will respond within a reasonable timeframe.
        </p>

        <h2 style={sectionTitleStyle}>8. Cookies & Analytics</h2>
        <p style={paragraphStyle}>
          We use Firebase Analytics for app performance monitoring only. No third-party advertising cookies are deployed.
        </p>

        <h2 style={sectionTitleStyle}>9. Children’s Privacy</h2>
        <p style={paragraphStyle}>
          Acciox is not intended for users under the age of 18. We do not knowingly collect data from minors.
        </p>

        <h2 style={sectionTitleStyle}>10. Changes to This Policy</h2>
        <p style={paragraphStyle}>
          We may update this Privacy Policy. Users will be notified of significant changes via email or platform notification.
        </p>

        <h2 style={sectionTitleStyle}>11. Contact Us</h2>
        <p style={paragraphStyle}>
          For privacy-related questions, contact:{' '}
          <a href="mailto:privacy@acciox.com" style={{ color: '#e879f9' }}>
            privacy@acciox.com
          </a>.
        </p>

        <div style={footerStyle}>
          <p>Last updated: 28 July 2026</p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginTop: 8 }}>
            <Link to="/login" style={{ color: '#e879f9', textDecoration: 'none' }}>
              Login
            </Link>
            <Link to="/register" style={{ color: '#e879f9', textDecoration: 'none' }}>
              Register
            </Link>
            <Link to="/terms" style={{ color: '#e879f9', textDecoration: 'none' }}>
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
```
