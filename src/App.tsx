import { useEffect } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuthStore } from '@/stores/authStore';
import Login from "./pages/Login";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import SubmissionWizard from "./pages/SubmissionWizard";
import SubmissionSuccess from "./pages/SubmissionSuccess";
import ManagerDashboard from "./pages/ManagerDashboard";
import AdminSubmissions from "./pages/AdminSubmissions";
import AdminOrganizations from "./pages/AdminOrganizations";
import AdminUsers from "./pages/AdminUsers";
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
      <Route path="/" element={
        isAuthenticated
          ? <Navigate to={role === 'manager' ? '/admin/dashboard' : '/submission/new'} replace />
          : <Navigate to="/login" replace />
      } />
      <Route path="/login" element={<Login />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/submission/new" element={
        <ProtectedRoute requiredRole="supplier">
          <SubmissionWizard />
        </ProtectedRoute>
      } />
      <Route path="/submission/success" element={
        <ProtectedRoute requiredRole="supplier">
          <SubmissionSuccess />
        </ProtectedRoute>
      } />
      <Route path="/admin/dashboard" element={
        <ProtectedRoute requiredRole="manager">
          <ManagerDashboard />
        </ProtectedRoute>
      } />
      <Route path="/admin/submissions" element={
        <ProtectedRoute requiredRole="manager">
          <AdminSubmissions />
        </ProtectedRoute>
      } />
      <Route path="/admin/organizations" element={
        <ProtectedRoute requiredRole="manager">
          <AdminOrganizations />
        </ProtectedRoute>
      } />
      <Route path="/admin/users" element={
        <ProtectedRoute requiredRole="manager">
          <AdminUsers />
        </ProtectedRoute>
      } />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner position="top-right" />
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
