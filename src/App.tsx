import { Routes, Route, Navigate, useParams, useLocation } from 'react-router-dom';
import { Toaster } from '@/components/ui/toaster';
import { useAuth } from '@/lib/auth';
import Layout from '@/components/layout/Layout';
import RouteTracker from '@/components/system/RouteTracker';
import HomePage from '@/pages/public/HomePage';
import VideosPage from '@/pages/public/VideosPage';
import SearchPage from '@/pages/public/SearchPage';
import ListingDetailPage from '@/pages/public/ListingDetailPage';
import LoginPage from '@/pages/auth/LoginPage';
import SignupPage from '@/pages/auth/SignupPage';
import VerifyPage from '@/pages/auth/VerifyPage';
import ForgotPasswordPage from '@/pages/auth/ForgotPasswordPage';
import ResetPasswordPage from '@/pages/auth/ResetPasswordPage';
import GuestDashboard from '@/pages/guest/GuestDashboard';
import HostDashboard from '@/pages/host/HostDashboard';
import AdminDashboard from '@/pages/admin/AdminDashboard';
import AdminListingNew from '@/pages/admin/AdminListingNew';
import AdminListingEdit from '@/pages/admin/AdminListingEdit';
import AdminSendNotifications from '@/pages/admin/AdminSendNotifications';
import AdminStaticData from '@/pages/admin/AdminStaticData';
import HostListingNew from '@/pages/host/HostListingNew';
import HostListingEdit from '@/pages/host/HostListingEdit';
import PayBookingPage from '@/pages/booking/PayBookingPage';
import BookingConfirmationPage from '@/pages/booking/BookingConfirmationPage';
import ChangePasswordPage from '@/pages/profile/ChangePasswordPage';
import DesignSystemTest from '@/pages/public/DesignSystemTest';
import AboutPage from '@/pages/public/AboutPage';
import ContactPage from '@/pages/public/ContactPage';
import BlogsPage from '@/pages/public/BlogsPage';
import CmsPage from '@/pages/public/CmsPage';
import FestivalsPage from '@/pages/public/FestivalsPage';
import ThingsToDoPage from '@/pages/public/ExperiencesPage';
import TripPlannerPage from '@/pages/public/TripPlannerPage';
import TeamPage from '@/pages/public/marketing/TeamPage';
import CareersPage from '@/pages/public/marketing/CareersPage';
import PressPage from '@/pages/public/marketing/PressPage';
import PackagesPage from '@/pages/public/marketing/PackagesPage';
import DestinationsPage from '@/pages/public/marketing/DestinationsPage';
import ExperiencesPage from '@/pages/public/marketing/ExperiencesPage';
import WishlistNavRedirect from '@/components/system/WishlistNavRedirect';

function HomestayToListingRedirect() {
  const { id } = useParams();
  return <Navigate to={id != null ? `/listings/${id}` : '/search'} replace />;
}

function ProtectedRoute({ children, roles }: { children: React.ReactNode; roles: string[] }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <div className="flex min-h-screen items-center justify-center">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  const r = (user.role || '').toLowerCase();
  if (!roles.some((allowed) => allowed.toLowerCase() === r)) return <Navigate to="/" replace />;
  if (user.must_change_password && !location.pathname.includes('/profile/change-password')) {
    return <Navigate to="/profile/change-password" replace />;
  }
  return <>{children}</>;
}

export default function App() {
  return (
    <>
      <RouteTracker />
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="videos" element={<VideosPage />} />
          <Route path="search" element={<SearchPage />} />
          <Route path="listings/:id" element={<ListingDetailPage />} />
          <Route path="homestay/:id" element={<HomestayToListingRedirect />} />
          <Route path="design-system" element={<DesignSystemTest />} />
          <Route path="about" element={<AboutPage />} />
          <Route path="contact" element={<ContactPage />} />
          <Route path="blogs" element={<BlogsPage />} />
          <Route path="team" element={<TeamPage />} />
          <Route path="careers" element={<CareersPage />} />
          <Route path="press" element={<PressPage />} />
          <Route path="packages" element={<PackagesPage />} />
          <Route path="destinations" element={<DestinationsPage />} />
          <Route path="experiences" element={<ExperiencesPage />} />
          <Route path="help" element={<CmsPage slugOverride="help" />} />
          <Route path="safety" element={<CmsPage slugOverride="safety" />} />
          <Route path="cancellation" element={<CmsPage slugOverride="cancellation" />} />
          <Route path="faqs" element={<CmsPage slugOverride="faqs" />} />
          <Route path="privacy" element={<CmsPage slugOverride="privacy" />} />
          <Route path="terms" element={<CmsPage slugOverride="terms" />} />
          <Route path="cookies" element={<CmsPage slugOverride="cookies" />} />
          <Route path="cms/:slug" element={<CmsPage />} />
          <Route path="festivals" element={<FestivalsPage />} />
          <Route path="things-to-do" element={<ThingsToDoPage />} />
          <Route path="trip-planner" element={<TripPlannerPage />} />
          <Route path="wishlist" element={<WishlistNavRedirect />} />
          <Route path="signin" element={<LoginPage />} />
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
            path="admin/listings/new"
            element={
              <ProtectedRoute roles={['admin']}>
                <AdminListingNew />
              </ProtectedRoute>
            }
          />
          <Route
            path="admin/listings/:id/edit"
            element={
              <ProtectedRoute roles={['admin']}>
                <AdminListingEdit />
              </ProtectedRoute>
            }
          />
          <Route
            path="admin/notifications/send"
            element={
              <ProtectedRoute roles={['admin']}>
                <AdminSendNotifications />
              </ProtectedRoute>
            }
          />
          <Route
            path="admin/static-data"
            element={
              <ProtectedRoute roles={['admin']}>
                <AdminStaticData />
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
