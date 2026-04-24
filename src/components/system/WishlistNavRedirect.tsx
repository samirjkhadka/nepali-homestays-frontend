import { Navigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth';

export default function WishlistNavRedirect() {
  const { user, loading } = useAuth();
  if (loading) {
    return <div className="flex min-h-[40vh] items-center justify-center text-muted-foreground">Loading…</div>;
  }
  if (!user) {
    return <Navigate to="/login" replace state={{ from: { pathname: '/dashboard/guest', search: '?tab=wishlist' } } } />;
  }
  return <Navigate to="/dashboard/guest?tab=wishlist" replace />;
}
