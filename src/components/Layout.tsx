import { useState, useEffect, useRef } from 'react';
import { Link, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { useCurrency } from '@/lib/currency';
import { Button } from '@/components/ui/button';
import { Home, Search, LogOut, User, KeyRound, ChevronDown, Heart, MessageSquare, Receipt, Calendar } from 'lucide-react';
import { api } from '@/lib/api';
import { assets } from '@/lib/design-tokens';
import type { CurrencyCode } from '@/lib/currency';

function getInitials(name: string | null, email: string): string {
  if (name && name.trim()) {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return name.slice(0, 2).toUpperCase();
  }
  const local = email.split('@')[0];
  if (local.length >= 2) return local.slice(0, 2).toUpperCase();
  return email.slice(0, 2).toUpperCase();
}

const CURRENCIES: CurrencyCode[] = ['NPR', 'USD', 'INR', 'GBP', 'EUR', 'AUD'];

export default function Layout() {
  const { user, logout } = useAuth();
  const { currency, setCurrency } = useCurrency();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<{ name?: string; avatar_url?: string | null } | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) {
      setProfile(null);
      return;
    }
    api
      .get<{ name?: string; avatar_url?: string | null }>('/api/profile')
      .then((res) => setProfile(res.data))
      .catch(() => setProfile(null));
  }, [user]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setDropdownOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const initials = user ? getInitials(profile?.name ?? null, user.email) : '';
  const guestDashboardBase = '/dashboard/guest';
  const hostDashboardBase = '/dashboard/host';

  return (
    <div className="min-h-screen bg-secondary-50">
      <header className="sticky top-0 z-50 w-full border-b border-primary-200/50 bg-white/95 backdrop-blur">
        <div className="container mx-auto flex h-14 items-center justify-between px-4">
          <Link to="/" className="flex items-center gap-3 font-semibold text-primary-700">
            <img src={assets.logo} alt="Nepali Homestays" className="h-8 w-auto" />
            <span className="hidden sm:inline">Nepali Homestays</span>
          </Link>
          <nav className="flex items-center gap-3">
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
              className="rounded-md border border-primary-200 bg-primary-50/50 px-2 py-1.5 text-sm font-medium text-primary-800 focus:outline-none focus:ring-2 focus:ring-accent-500"
              aria-label="Currency"
            >
              {CURRENCIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <Link to="/">
              <Button variant="ghost" size="sm">
                <Home className="mr-1 h-4 w-4" />
                Home
              </Button>
            </Link>
            <Link to="/search">
              <Button variant="ghost" size="sm">
                <Search className="mr-1 h-4 w-4" />
                Search
              </Button>
            </Link>
            {user ? (
              <>
                {user.role === 'host' && (
                  <>
                    <Link to="/dashboard/host">
                      <Button variant="default" size="sm">
                        Host Dashboard
                      </Button>
                    </Link>
                    <Link to="/host/listings/new">
                      <Button variant="outline" size="sm">
                        Add Listing
                      </Button>
                    </Link>
                  </>
                )}
                {user.role === 'admin' && (
                  <Link to="/admin/dashboard">
                    <Button variant="destructive" size="sm">
                      Admin
                    </Button>
                  </Link>
                )}
                <div className="relative" ref={dropdownRef}>
                  <button
                    type="button"
                    onClick={() => setDropdownOpen((o) => !o)}
                    className="flex items-center gap-2 rounded-full border border-primary-200 bg-primary-50/50 p-1 pr-2 transition-colors hover:bg-primary-100 focus:outline-none focus:ring-2 focus:ring-accent-500"
                    aria-expanded={dropdownOpen}
                    aria-haspopup="true"
                  >
                    {profile?.avatar_url ? (
                      <img
                        src={profile.avatar_url.startsWith('http') ? profile.avatar_url : (import.meta.env.VITE_API_URL || '') + profile.avatar_url}
                        alt=""
                        className="h-8 w-8 rounded-full object-cover"
                      />
                    ) : (
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-accent-500 text-sm font-semibold text-white">
                        {initials}
                      </span>
                    )}
                    <ChevronDown className={`h-4 w-4 text-primary-600 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {dropdownOpen && (
                    <div className="absolute right-0 top-full z-50 mt-1 min-w-[200px] rounded-lg border border-primary-200 bg-white py-1 shadow-lg">
                      <Link
                        to={user.role === 'admin' ? '/admin/dashboard' : `${user.role === 'host' ? hostDashboardBase : guestDashboardBase}?tab=profile`}
                        onClick={() => setDropdownOpen(false)}
                        className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-primary-800 hover:bg-primary-50"
                      >
                        <User className="h-4 w-4" />
                        Profile
                      </Link>
                      {(user.role === 'guest' || user.role === 'host') && (
                        <>
                          <Link
                            to={`${guestDashboardBase}?tab=bookings`}
                            onClick={() => setDropdownOpen(false)}
                            className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-primary-800 hover:bg-primary-50"
                          >
                            <Calendar className="h-4 w-4" />
                            Bookings
                          </Link>
                          <Link
                            to={`${guestDashboardBase}?tab=wishlist`}
                            onClick={() => setDropdownOpen(false)}
                            className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-primary-800 hover:bg-primary-50"
                          >
                            <Heart className="h-4 w-4" />
                            Wishlist
                          </Link>
                          <Link
                            to={`${guestDashboardBase}?tab=messages`}
                            onClick={() => setDropdownOpen(false)}
                            className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-primary-800 hover:bg-primary-50"
                          >
                            <MessageSquare className="h-4 w-4" />
                            Messages
                          </Link>
                          <Link
                            to={`${guestDashboardBase}?tab=payment-history`}
                            onClick={() => setDropdownOpen(false)}
                            className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-primary-800 hover:bg-primary-50"
                          >
                            <Receipt className="h-4 w-4" />
                            Payment history
                          </Link>
                        </>
                      )}
                      <Link
                        to="/profile/change-password"
                        onClick={() => setDropdownOpen(false)}
                        className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-primary-800 hover:bg-primary-50"
                      >
                        <KeyRound className="h-4 w-4" />
                        Change password
                      </Link>
                      <button
                        type="button"
                        onClick={() => {
                          setDropdownOpen(false);
                          logout();
                          navigate('/');
                        }}
                        className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-primary-800 hover:bg-primary-50"
                      >
                        <LogOut className="h-4 w-4" />
                        Log out
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <Link to="/login">
                  <Button variant="ghost" size="sm">
                    Log in
                  </Button>
                </Link>
                <Link to="/signup">
                  <Button size="sm">Sign up</Button>
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>
      <main className="container mx-auto px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}
