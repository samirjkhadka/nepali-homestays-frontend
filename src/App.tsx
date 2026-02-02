import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from '@/components/ui/toaster';
import { useAuth } from '@/lib/auth';
import Layout from '@/components/Layout';
import HomePage from '@/pages/HomePage';
import SearchPage from '@/pages/SearchPage';
import ListingDetailPage from '@/pages/ListingDetailPage';
import LoginPage from '@/pages/auth/LoginPage';
import SignupPage from '@/pages/auth/SignupPage';
import VerifyPage from '@/pages/auth/VerifyPage';
import ForgotPasswordPage from '@/pages/auth/ForgotPasswordPage';
import ResetPasswordPage from '@/pages/auth/ResetPasswordPage';
import GuestDashboard from '@/pages/dashboard/GuestDashboard';
import HostDashboard from '@/pages/dashboard/HostDashboard';
import AdminDashboard from '@/pages/admin/AdminDashboard';
import HostListingNew from '@/pages/host/HostListingNew';
import HostListingEdit from '@/pages/host/HostListingEdit';
import PayBookingPage from '@/pages/booking/PayBookingPage';
import BookingConfirmationPage from '@/pages/booking/BookingConfirmationPage';
import ChangePasswordPage from '@/pages/profile/ChangePasswordPage';
import DesignSystemTest from '@/pages/DesignSystemTest';

function ProtectedRoute({ children, roles }: { children: React.ReactNode; roles: string[] }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex min-h-screen items-center justify-center">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (!roles.includes(user.role)) return <Navigate to="/" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="search" element={<SearchPage />} />
          <Route path="listings/:id" element={<ListingDetailPage />} />
          <Route path="design-system" element={<DesignSystemTest />} />
          <Route path="login" element={<LoginPage />} />
          <Route path="signup" element={<SignupPage />} />
          <Route path="verify" element={<VerifyPage />} />
          <Route path="forgot-password" element={<ForgotPasswordPage />} />
          <Route path="reset-password" element={<ResetPasswordPage />} />
          <Route
            path="dashboard/guest"
            element={
              <ProtectedRoute roles={['guest', 'host']}>
                <GuestDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="bookings/:id/pay"
            element={
              <ProtectedRoute roles={['guest', 'host']}>
                <PayBookingPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="bookings/:id/confirmation"
            element={
              <ProtectedRoute roles={['guest', 'host']}>
                <BookingConfirmationPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="dashboard/host"
            element={
              <ProtectedRoute roles={['host']}>
                <HostDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="host/listings/new"
            element={
              <ProtectedRoute roles={['host']}>
                <HostListingNew />
              </ProtectedRoute>
            }
          />
          <Route
            path="host/listings/:id/edit"
            element={
              <ProtectedRoute roles={['host']}>
                <HostListingEdit />
              </ProtectedRoute>
            }
          />
          <Route
            path="admin/dashboard"
            element={
              <ProtectedRoute roles={['admin']}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="profile/change-password"
            element={
              <ProtectedRoute roles={['guest', 'host', 'admin']}>
                <ChangePasswordPage />
              </ProtectedRoute>
            }
          />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Toaster />
    </>
  );
}
