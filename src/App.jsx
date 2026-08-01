import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { Toaster } from 'react-hot-toast';
import { RoleGuard } from './components/RoleGuard';

const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const NotActivated = lazy(() => import('./pages/NotActivated'));
const TermsOfService = lazy(() => import('./pages/TermsOfService'));
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy'));
const Settings = lazy(() => import('./pages/Settings'));
const MoreInfo = lazy(() => import('./pages/MoreInfo'));

// Admin
const AdminHome = lazy(() => import('./pages/admin/AdminHome'));
const CompanyManagement = lazy(() => import('./pages/admin/CompanyManagement'));
const UserManagement = lazy(() => import('./pages/admin/UserManagement'));

// Accountant
const AccountantHome = lazy(() => import('./pages/accountant/AccountantHome'));
const CompanyWorkspace = lazy(() => import('./pages/accountant/CompanyWorkspace'));
const TransactionQueue = lazy(() => import('./pages/accountant/TransactionQueue'));
const SyncManager = lazy(() => import('./pages/accountant/SyncManager'));

// Company
const CompanyDashboard = lazy(() => import('./pages/company/CompanyDashboard'));
const Transactions = lazy(() => import('./pages/company/Transactions'));
const StaffExpenses = lazy(() => import('./pages/company/StaffExpenses'));
const Payroll = lazy(() => import('./pages/company/Payroll'));
const Reports = lazy(() => import('./pages/company/Reports'));
const InvoiceManager = lazy(() => import('./pages/company/InvoiceManager'));
const AccountManagement = lazy(() => import('./pages/company/AccountManagement'));
const TaxManagement = lazy(() => import('./pages/company/TaxManagement'));
const Reconciliation = lazy(() => import('./pages/company/Reconciliation'));

// Chat
const ChatHub = lazy(() => import('./pages/chat/ChatHub'));
const GroupChat = lazy(() => import('./pages/chat/GroupChat'));
const PrivateChat = lazy(() => import('./pages/chat/PrivateChat'));
const AIChat = lazy(() => import('./pages/chat/AIChat'));

// Client
const ClientHome = lazy(() => import('./pages/client/ClientHome'));
const ClientChat = lazy(() => import('./pages/client/ClientChat'));
const ClientReports = lazy(() => import('./pages/client/ClientReports'));
const FinancialAdvice = lazy(() => import('./pages/client/FinancialAdvice')); // <-- new import

const Loader = () => (
  <div style={{
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    height: '100vh', background: '#0f0a1a', color: 'white', fontSize: '18px',
  }}>
    Loading Acciox...
  </div>
);

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster position="top-right" />
        <Suspense fallback={<Loader />}>
          <Routes>

            {/* Public */}
            <Route path="/" element={<Navigate to="/login" />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/not-activated" element={<NotActivated />} />
            <Route path="/terms" element={<TermsOfService />} />
            <Route path="/privacy" element={<PrivacyPolicy />} />

            {/* Shared - all roles */}
            <Route path="/settings" element={<RoleGuard allowedRoles={['admin', 'accountant', 'client']}><Settings /></RoleGuard>} />
            <Route path="/more-info" element={<RoleGuard allowedRoles={['admin', 'accountant', 'client']}><MoreInfo /></RoleGuard>} />
            <Route path="/chat" element={<RoleGuard allowedRoles={['admin', 'accountant', 'client']}><ChatHub /></RoleGuard>} />
            <Route path="/chat/private" element={<RoleGuard allowedRoles={['admin', 'accountant', 'client']}><PrivateChat /></RoleGuard>} />
            <Route path="/chat/ai" element={<RoleGuard allowedRoles={['admin', 'accountant', 'client']}><AIChat /></RoleGuard>} />

            {/* Admin */}
            <Route path="/admin" element={<RoleGuard allowedRoles={['admin']}><AdminHome /></RoleGuard>} />
            <Route path="/admin/companies" element={<RoleGuard allowedRoles={['admin']}><CompanyManagement /></RoleGuard>} />
            <Route path="/admin/users" element={<RoleGuard allowedRoles={['admin']}><UserManagement /></RoleGuard>} />

            {/* Accountant */}
            <Route path="/accountant" element={<RoleGuard allowedRoles={['accountant']}><AccountantHome /></RoleGuard>} />
            <Route path="/accountant/company/:companyId" element={<RoleGuard allowedRoles={['accountant']}><CompanyWorkspace /></RoleGuard>} />
            <Route path="/accountant/queue" element={<RoleGuard allowedRoles={['accountant']}><TransactionQueue /></RoleGuard>} />
            <Route path="/accountant/sync" element={<RoleGuard allowedRoles={['accountant']}><SyncManager /></RoleGuard>} />

            {/* Company workspace - admin + accountant + client (read only) */}
            <Route path="/company/:companyId/dashboard" element={<RoleGuard allowedRoles={['admin', 'accountant']}><CompanyDashboard /></RoleGuard>} />
            <Route path="/company/:companyId/transactions" element={<RoleGuard allowedRoles={['admin', 'accountant']}><Transactions /></RoleGuard>} />
            <Route path="/company/:companyId/expenses" element={<RoleGuard allowedRoles={['admin', 'accountant']}><StaffExpenses /></RoleGuard>} />
            <Route path="/company/:companyId/payroll" element={<RoleGuard allowedRoles={['admin', 'accountant']}><Payroll /></RoleGuard>} />
            <Route path="/company/:companyId/reports" element={<RoleGuard allowedRoles={['admin', 'accountant']}><Reports /></RoleGuard>} />
            <Route path="/company/:companyId/invoices" element={<RoleGuard allowedRoles={['admin', 'accountant']}><InvoiceManager /></RoleGuard>} />
            <Route path="/company/:companyId/accounts" element={<RoleGuard allowedRoles={['admin', 'accountant', 'client']}><AccountManagement /></RoleGuard>} />
            <Route path="/company/:companyId/tax" element={<RoleGuard allowedRoles={['admin', 'accountant', 'client']}><TaxManagement /></RoleGuard>} />
            <Route path="/company/:companyId/reconciliation" element={<RoleGuard allowedRoles={['admin', 'accountant', 'client']}><Reconciliation /></RoleGuard>} />
            <Route path="/company/:companyId/chat/group" element={<RoleGuard allowedRoles={['admin', 'accountant', 'client']}><GroupChat /></RoleGuard>} />

            {/* Client */}
            <Route path="/client" element={<RoleGuard allowedRoles={['client']}><ClientHome /></RoleGuard>} />
            <Route path="/client/reports" element={<RoleGuard allowedRoles={['client']}><ClientReports /></RoleGuard>} />
            <Route path="/client/chat" element={<RoleGuard allowedRoles={['client']}><ClientChat /></RoleGuard>} />
            <Route path="/client/financial-advice" element={<RoleGuard allowedRoles={['client']}><FinancialAdvice /></RoleGuard>} />  {/* new route */}

            {/* Catch all */}
            <Route path="*" element={<Navigate to="/login" />} />

          </Routes>
        </Suspense>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
