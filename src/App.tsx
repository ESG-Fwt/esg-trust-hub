import { useEffect } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from '@/components/ThemeProvider';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { useAuthStore } from '@/stores/authStore';
import Login from "./pages/Login";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import SupplierSubmit from "./pages/supplier/SupplierSubmit";
import SupplierHistory from "./pages/supplier/SupplierHistory";
import SupplierProfile from "./pages/supplier/SupplierProfile";
import SubmissionSuccess from "./pages/SubmissionSuccess";
import ManagerDashboard from "./pages/ManagerDashboard";
import AdminSubmissions from "./pages/AdminSubmissions";
import AdminReviewSubmission from "./pages/AdminReviewSubmission";
import AdminOrganizations from "./pages/AdminOrganizations";
import AdminUsers from "./pages/AdminUsers";
import AdminAuditTrail from "./pages/AdminAuditTrail";
import NotFound from "./pages/NotFound";
import ProtectedRoute from "./components/ProtectedRoute";

const queryClient = new QueryClient();

const AppRoutes = () => {
  const { initialize, isAuthenticated, role } = useAuthStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

  return (
    <Routes>
      {/* Root redirect */}
      <Route path="/" element={
        isAuthenticated
          ? <Navigate to={role === 'manager' ? '/admin/dashboard' : '/supplier/submit'} replace />
          : <Navigate to="/login" replace />
      } />

      {/* Auth */}
      <Route path="/login" element={<Login />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      {/* Supplier Portal */}
      <Route path="/supplier/submit" element={
        <ProtectedRoute requiredRole="supplier"><SupplierSubmit /></ProtectedRoute>
      } />
      <Route path="/supplier/history" element={
        <ProtectedRoute requiredRole="supplier"><SupplierHistory /></ProtectedRoute>
      } />
      <Route path="/supplier/profile" element={
        <ProtectedRoute requiredRole="supplier"><SupplierProfile /></ProtectedRoute>
      } />
      <Route path="/submission/success" element={
        <ProtectedRoute requiredRole="supplier"><SubmissionSuccess /></ProtectedRoute>
      } />

      {/* Legacy supplier redirects */}
      <Route path="/submission/new" element={<Navigate to="/supplier/submit" replace />} />

      {/* Manager Portal */}
      <Route path="/admin/dashboard" element={
        <ProtectedRoute requiredRole="manager"><ManagerDashboard /></ProtectedRoute>
      } />
      <Route path="/admin/submissions" element={
        <ProtectedRoute requiredRole="manager"><AdminSubmissions /></ProtectedRoute>
      } />
      <Route path="/admin/review/:id" element={
        <ProtectedRoute requiredRole="manager"><AdminReviewSubmission /></ProtectedRoute>
      } />
      <Route path="/manager/review/:id" element={
        <ProtectedRoute requiredRole="manager"><AdminReviewSubmission /></ProtectedRoute>
      } />
      <Route path="/admin/organizations" element={
        <ProtectedRoute requiredRole="manager"><AdminOrganizations /></ProtectedRoute>
      } />
      <Route path="/admin/users" element={
        <ProtectedRoute requiredRole="manager"><AdminUsers /></ProtectedRoute>
      } />
      <Route path="/admin/audit" element={
        <ProtectedRoute requiredRole="manager"><AdminAuditTrail /></ProtectedRoute>
      } />

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => (
  <ThemeProvider>
    <LanguageProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner position="top-right" />
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </TooltipProvider>
      </QueryClientProvider>
    </LanguageProvider>
  </ThemeProvider>
);

export default App;
