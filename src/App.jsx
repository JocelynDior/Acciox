Here's the corrected src/App.jsx with all style tags and CSS keyframes removed. The fallback is a simple "Loading..." text in white:

```jsx
import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { RoleGuard, UnauthorizedPage } from './components/RoleGuard';
import { Toaster } from 'react-hot-toast';

// Lazy-loaded page components
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const TermsOfService = lazy(() => import('./pages/TermsOfService'));
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy'));
const NotActivated = lazy(() => import('./pages/NotActivated'));
const AdminHome = lazy(() => import('./pages/AdminHome'));
const CompanyManagement = lazy(() => import('./pages/CompanyManagement'));
const UserManagement = lazy(() => import('./pages/UserManagement'));
const AdminSettings = lazy(() => import('./pages/AdminSettings'));
const AccountantHome = lazy(() => import('./pages/AccountantHome'));
const CompanyWorkspace = lazy(() => import('./pages/CompanyWorkspace'));
const TransactionQueue = lazy(() => import('./pages/TransactionQueue'));
const SyncManager = lazy(() => import('./pages/SyncManager'));
const AccountantSettings = lazy(() => import('./pages/AccountantSettings'));
const CompanyDashboard = lazy(() => import('./pages/CompanyDashboard'));
const Transactions = lazy(() => import('./pages/Transactions'));
const StaffExpenses = lazy(() => import('./pages/StaffExpenses'));
const Payroll = lazy(() => import('./pages/Payroll'));
const Reports = lazy(() => import('./pages/Reports'));
const InvoiceManager = lazy(() => import('./pages/InvoiceManager'));
const GroupChat = lazy(() => import('./pages/GroupChat'));
const PrivateChat = lazy(() => import('./pages/PrivateChat'));
const AIChat = lazy(() => import('./pages/AIChat'));
const ClientHome = lazy(() => import('./pages/ClientHome'));
const ClientReports = lazy(() => import('./pages/ClientReports'));
const ClientChat = lazy(() => import('./pages/ClientChat'));

// Simple fallback component – no CSS keyframes, no style tags
const Loader = () => <div style={{ color: 'white' }}>Loading...</div>;

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Suspense fallback={<Loader />}>
          <Routes>
            {/* Redirect root to login */}
            <Route path="/" element={<Navigate to="/login" replace />} />

            {/* Public routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/terms" element={<TermsOfService />} />
            <Route path="/privacy" element={<PrivacyPolicy />} />
            <Route path="/not-activated" element={<NotActivated />} />
            <Route path="/unauthorized" element={<UnauthorizedPage />} />

            {/* Admin protected routes */}
            <Route
              path="/admin"
              element={
                <RoleGuard allowedRoles={['admin']}>
                  <AdminHome />
                </RoleGuard>
              }
            />
            <Route
              path="/admin/companies"
              element={
                <RoleGuard allowedRoles={['admin']}>
                  <CompanyManagement />
                </RoleGuard>
              }
            />
            <Route
              path="/admin/users"
              element={
                <RoleGuard allowedRoles={['admin']}>
                  <UserManagement />
                </RoleGuard>
              }
            />
            <Route
              path="/admin/settings"
              element={
                <RoleGuard allowedRoles={['admin']}>
                  <AdminSettings />
                </RoleGuard>
              }
            />

            {/* Accountant protected routes */}
            <Route
              path="/accountant"
              element={
                <RoleGuard allowedRoles={['accountant']}>
                  <AccountantHome />
                </RoleGuard>
              }
            />
            <Route
              path="/accountant/company/:companyId"
              element={
                <RoleGuard allowedRoles={['accountant']}>
                  <CompanyWorkspace />
                </RoleGuard>
              }
            />
            <Route
              path="/accountant/queue"
              element={
                <RoleGuard allowedRoles={['accountant']}>
                  <TransactionQueue />
                </RoleGuard>
              }
            />
            <Route
              path="/accountant/sync"
              element={
                <RoleGuard allowedRoles={['accountant']}>
                  <SyncManager />
                </RoleGuard>
              }
            />
            <Route
              path="/accountant/settings"
              element={
                <RoleGuard allowedRoles={['accountant']}>
                  <AccountantSettings />
                </RoleGuard>
              }
            />

            {/* Company routes (admin + accountant) */}
            <Route
              path="/company/:companyId/dashboard"
              element={
                <RoleGuard allowedRoles={['admin', 'accountant']}>
                  <CompanyDashboard />
                </RoleGuard>
              }
            />
            <Route
              path="/company/:companyId/transactions"
              element={
                <RoleGuard allowedRoles={['admin', 'accountant']}>
                  <Transactions />
                </RoleGuard>
              }
            />
            <Route
              path="/company/:companyId/expenses"
              element={
                <RoleGuard allowedRoles={['admin', 'accountant']}>
                  <StaffExpenses />
                </RoleGuard>
              }
            />
            <Route
              path="/company/:companyId/payroll"
              element={
                <RoleGuard allowedRoles={['admin', 'accountant']}>
                  <Payroll />
                </RoleGuard>
              }
            />
            <Route
              path="/company/:companyId/reports"
              element={
                <RoleGuard allowedRoles={['admin', 'accountant']}>
                  <Reports />
                </RoleGuard>
              }
            />
            <Route
              path="/company/:companyId/invoices"
              element={
                <RoleGuard allowedRoles={['admin', 'accountant']}>
                  <InvoiceManager />
                </RoleGuard>
              }
            />
            <Route
              path="/company/:companyId/chat/group"
              element={
                <RoleGuard allowedRoles={['admin', 'accountant']}>
                  <GroupChat />
                </RoleGuard>
              }
            />
            <Route
              path="/company/:companyId/chat/private"
              element={
                <RoleGuard allowedRoles={['admin', 'accountant']}>
                  <PrivateChat />
                </RoleGuard>
              }
            />
            <Route
              path="/company/:companyId/chat/ai"
              element={
                <RoleGuard allowedRoles={['admin', 'accountant']}>
                  <AIChat />
                </RoleGuard>
              }
            />

            {/* Client protected routes */}
            <Route
              path="/client"
              element={
                <RoleGuard allowedRoles={['client']}>
                  <ClientHome />
                </RoleGuard>
              }
            />
            <Route
              path="/client/reports"
              element={
                <RoleGuard allowedRoles={['client']}>
                  <ClientReports />
                </RoleGuard>
              }
            />
            <Route
              path="/client/chat"
              element={
                <RoleGuard allowedRoles={['client']}>
                  <ClientChat />
                </RoleGuard>
              }
            />

            {/* Fallback for unknown routes */}
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </Suspense>
        <Toaster position="top-right" />
      </Router>
    </AuthProvider>
  );
}
```
