import React from 'react';
import { Link } from 'react-router-dom';

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
  animation: 'fadeIn 0.8s ease forwards',
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

export default function TermsOfService() {
  return (
    <div style={containerStyle}>
      <div style={cardStyle}>
        <h1 style={logoStyle}>Acciox</h1>
        <p style={{ ...paragraphStyle, fontSize: '1.1rem' }}>
          Terms of Service
        </p>

        <h2 style={sectionTitleStyle}>1. Introduction</h2>
        <p style={paragraphStyle}>
          Acciox is an AI-powered multi-company finance and bookkeeping platform designed to automate transaction categorization, expense analysis, and financial reporting. These Terms apply to all users of the platform, including administrators, accountants, and clients.
        </p>

        <h2 style={sectionTitleStyle}>2. Acceptance of Terms</h2>
        <p style={paragraphStyle}>
          By creating an account or using Acciox, you agree to be bound by these Terms of Service. If you do not agree, do not register or use the platform.
        </p>

        <h2 style={sectionTitleStyle}>3. User Accounts & Roles</h2>
        <p style={paragraphStyle}>
          Acciox supports three roles: Admin, Accountant, and Client. Each role has specific permissions and responsibilities. Admins manage companies and users. Accountants process transactions and generate reports. Clients view their financial data and communicate with their accountant.
        </p>

        <h2 style={sectionTitleStyle}>4. Financial Data</h2>
        <p style={paragraphStyle}>
          All financial data uploaded to Acciox is treated with strict confidentiality. We store data securely using Firebase services and do not share it with third parties except as necessary to provide our service (e.g., Xero/QuickBooks integrations).
        </p>

        <h2 style={sectionTitleStyle}>5. AI Processing</h2>
        <p style={paragraphStyle}>
          Acciox uses AI models (Groq, and optionally Gemini) to categorize transactions and generate insights. All AI-generated results should be reviewed by a human accountant before finalizing. The AI provides suggestions, not professional financial advice.
        </p>

        <h2 style={sectionTitleStyle}>6. Data Security</h2>
        <p style={paragraphStyle}>
          We protect your data using Firebase Authentication, Firestore security rules, encryption at rest and in transit, and role-based access controls. However, no system is 100% secure, and you are responsible for maintaining your login credentials securely.
        </p>

        <h2 style={sectionTitleStyle}>7. Prohibited Activities</h2>
        <p style={paragraphStyle}>
          You may not use Acciox for fraudulent activities, unauthorized access, manipulation of financial records, or any illegal purpose. Violation may result in immediate account termination.
        </p>

        <h2 style={sectionTitleStyle}>8. Account Verification</h2>
        <p style={paragraphStyle}>
          Client accounts require verification by an admin before full access is granted. Unverified accounts have restricted functionality. Acciox reserves the right to reject unverified accounts.
        </p>

        <h2 style={sectionTitleStyle}>9. Third-Party Integrations</h2>
        <p style={paragraphStyle}>
          When connecting Xero or QuickBooks, you agree to their respective terms of service. Acciox is not responsible for the accuracy or availability of data from third-party services.
        </p>

        <h2 style={sectionTitleStyle}>10. Termination</h2>
        <p style={paragraphStyle}>
          Admin users may deactivate accounts at their discretion. Acciox may also suspend or terminate access for breach of these terms without prior notice.
        </p>

        <h2 style={sectionTitleStyle}>11. Limitation of Liability</h2>
        <p style={paragraphStyle}>
          AI-generated suggestions are not guaranteed to be accurate or suitable for your business. Acciox and its creators are not liable for any financial decisions made based on platform outputs.
        </p>

        <h2 style={sectionTitleStyle}>12. Changes to Terms</h2>
        <p style={paragraphStyle}>
          We may update these Terms from time to time. Users will be notified of significant changes via email or platform notification. Continued use constitutes acceptance of revised terms.
        </p>

        <h2 style={sectionTitleStyle}>13. Contact</h2>
        <p style={paragraphStyle}>
          For questions about these Terms, contact support at{' '}
          <a href="mailto:support@acciox.com" style={{ color: '#e879f9' }}>
            support@acciox.com
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
            <Link to="/privacy" style={{ color: '#e879f9', textDecoration: 'none' }}>
              Privacy Policy
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
