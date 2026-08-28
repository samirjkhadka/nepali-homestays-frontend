import { useState, useEffect, useRef, type LegacyRef } from 'react';
import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Globe, ChevronDown, LogOut, User, KeyRound, Heart, MessageSquare, Receipt, Calendar, LogIn, UserPlus, LayoutDashboard, PlusCircle, Moon, Sun } from 'lucide-react';
import { NotificationBell } from '@/components/NotificationBell';
import { useAuth , isAdminRole } from '@/lib/auth';
import { useI18n } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { useTheme } from '@/components/system/ThemeProvider';
import { CurrencySwitcher } from '@/components/CurrencySwitcher';
import { PageTransition } from '@/components/PageTransition';
import CompareWidget from '@/components/system/CompareWidget';
import { assets } from '@/lib/design-tokens';
import { getImageDisplayUrl } from '@/lib/image-url';

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

const navItems = [
  { key: 'nav.home', href: '/' },
  { key: 'nav.search', href: '/search' },
  { key: 'nav.treks', href: '/treks' },
  { key: 'nav.experiences', href: '/things-to-do' },
  { key: 'nav.festivals', href: '/festivals' },
  { key: 'nav.tripPlanner', href: '/trip-planner' },
  { key: 'nav.blogs', href: '/blogs' },
  { key: 'nav.about', href: '/about' },
];

const languages = [
  { code: 'en' as const, name: 'English', flag: '🇬🇧' },
  { code: 'ne' as const, name: 'नेपाली', flag: '🇳🇵' },
];

type AuthUser = { id: number; email: string; role: string };

function UserMenuDesktop({
  user,
  profile,
  dropdownRef,
  showUserDropdown,
  setShowUserDropdown,
  initials,
  hostDashboardBase,
  guestDashboardBase,
  becomingHost,
  setBecomingHost,
  toast,
  logout,
  navigate,
}: {
  user: AuthUser;
  profile: { name?: string; avatar_url?: string | null } | null;
  dropdownRef: React.RefObject<HTMLDivElement | null>;
  showUserDropdown: boolean;
  setShowUserDropdown: (v: boolean) => void;
  initials: string;
  hostDashboardBase: string;
  guestDashboardBase: string;
  becomingHost: boolean;
  setBecomingHost: (v: boolean) => void;
  toast: (opts: { title: string; variant?: 'default' | 'destructive' }) => void;
  logout: (redirect?: string) => void;
  navigate: ReturnType<typeof useNavigate>;
}) {
  const avatarSrc = profile?.avatar_url?.trim() ? getImageDisplayUrl(profile.avatar_url) : '';
  return (
    <div className="relative" ref={dropdownRef as LegacyRef<HTMLDivElement>}>
      <button
        type="button"
        onClick={() => setShowUserDropdown(!showUserDropdown)}
        className="flex items-center gap-2 rounded-full border border-border bg-muted/50 p-1 pr-2 transition-colors hover:bg-muted focus:outline-none focus:ring-2 focus:ring-primary"
        aria-expanded={showUserDropdown}
      >
        {avatarSrc ? (
          <img
            src={avatarSrc}
            alt=""
            className="h-8 w-8 rounded-full object-cover"
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = assets.logo;
              e.currentTarget.className = 'h-8 w-8 rounded-full object-contain p-1 bg-card';
            }}
          />
        ) : (
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
            {initials}
          </span>
        )}
        <ChevronDown className="h-4 w-4 text-muted-foreground" />
      </button>
      <AnimatePresence>
        {showUserDropdown && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute right-0 top-full z-50 mt-2 min-w-[200px] rounded-lg border border-border bg-card py-1 shadow-elevated"
          >
            <Link
              to={isAdminRole(user.role) ? '/admin/overview' : `${user.role === 'host' ? hostDashboardBase : guestDashboardBase}?tab=profile`}
              onClick={() => setShowUserDropdown(false)}
              className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-foreground hover:bg-muted"
            >
              <User className="h-4 w-4" />
              Profile
            </Link>
            {(user.role === 'guest' || user.role === 'host') && (
              <>
                <Link
                  to={`${guestDashboardBase}?tab=bookings`}
                  onClick={() => setShowUserDropdown(false)}
                  className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-foreground hover:bg-muted"
                >
                  <Calendar className="h-4 w-4" />
                  Bookings
                </Link>
                <Link
                  to={`${guestDashboardBase}?tab=wishlist`}
                  onClick={() => setShowUserDropdown(false)}
                  className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-foreground hover:bg-muted"
                >
                  <Heart className="h-4 w-4" />
                  Wishlist
                </Link>
                <Link
                  to={`${guestDashboardBase}?tab=messages`}
                  onClick={() => setShowUserDropdown(false)}
                  className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-foreground hover:bg-muted"
                >
                  <MessageSquare className="h-4 w-4" />
                  Messages
                </Link>
                <Link
                  to={`${guestDashboardBase}?tab=payment-history`}
                  onClick={() => setShowUserDropdown(false)}
                  className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-foreground hover:bg-muted"
                >
                  <Receipt className="h-4 w-4" />
                  Payment history
                </Link>
                {user.role === 'guest' && (
                  <button
                    type="button"
                    onClick={() => {
                      setBecomingHost(true);
                      api
                        .post<{ message: string }>('/api/profile/become-host')
                        .then(() => {
                          setShowUserDropdown(false);
                          toast({ title: 'You are now a host. Please log in again to access the Host Dashboard.' });
                          logout('/login?became=host');
                        })
                        .catch((err) => {
                          setBecomingHost(false);
                          toast({ title: err.response?.data?.message || 'Failed to become a host.', variant: 'destructive' });
                        });
                    }}
                    disabled={becomingHost}
                    className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-foreground hover:bg-muted"
                  >
                    <PlusCircle className="h-4 w-4" />
                    {becomingHost ? 'Upgrading…' : 'Become a host'}
                  </button>
                )}
              </>
            )}
            {user.role === 'host' && (
              <>
                <Link to="/host/overview" onClick={() => setShowUserDropdown(false)} className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-foreground hover:bg-muted">
                  <LayoutDashboard className="h-4 w-4" />
                  Host Dashboard
                </Link>
                <Link
                  to="/host/listings/new"
                  onClick={() => setShowUserDropdown(false)}
                  className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-foreground hover:bg-muted"
                >
                  <PlusCircle className="h-4 w-4" />
                  Add Listing
                </Link>
              </>
            )}
            {user.role === 'admin' && (
              <Link to="/admin/overview" onClick={() => setShowUserDropdown(false)} className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-foreground hover:bg-muted">
                <LayoutDashboard className="h-4 w-4" />
                Admin
              </Link>
            )}
            <Link to="/profile/change-password" onClick={() => setShowUserDropdown(false)} className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-foreground hover:bg-muted">
              <KeyRound className="h-4 w-4" />
              Change password
            </Link>
            <button
              type="button"
              onClick={() => {
                setShowUserDropdown(false);
                logout();
                navigate('/');
              }}
              className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-foreground hover:bg-muted"
            >
              <LogOut className="h-4 w-4" />
              Log out
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function Layout() {
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const { locale, setLocale, t } = useI18n();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const isHome = pathname === '/';
  const marketingFullBleedPaths = new Set([
    '/team',
    '/careers',
    '/press',
    '/packages',
    '/destinations',
    '/experiences',
    '/help',
    '/safety',
    '/cancellation',
    '/faqs',
    '/privacy',
    '/terms',
    '/cookies',
  ]);
  const authFullBleedPaths = new Set(['/login', '/signin', '/signup', '/verify', '/forgot-password', '/reset-password']);
  const isListingDetail = /^\/listings\/[^/]+$/.test(pathname);
  const publicInfoPaths = new Set(['/search', '/about', '/contact', '/blogs', '/videos']);
  const isFullWidthMain =
    isHome ||
    marketingFullBleedPaths.has(pathname) ||
    authFullBleedPaths.has(pathname) ||
    isListingDetail ||
    publicInfoPaths.has(pathname);
  const isDark = theme === 'dark';
  const [profile, setProfile] = useState<{ name?: string; avatar_url?: string | null } | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const currentLang = languages.find((l) => l.code === locale) ?? languages[0];
  const [showLangDropdown, setShowLangDropdown] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [becomingHost, setBecomingHost] = useState(false);
  const { toast } = useToast();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const langDropdownRef = useRef<HTMLDivElement>(null);

  const toggleTheme = () => {
    setTheme(isDark ? 'light' : 'dark');
  };

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
      const target = e.target as Node;
      if (dropdownRef.current && !dropdownRef.current.contains(target)) setShowUserDropdown(false);
      if (langDropdownRef.current && !langDropdownRef.current.contains(target)) setShowLangDropdown(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const initials = user ? getInitials(profile?.name ?? null, user.email) : '';
  const guestDashboardBase = '/dashboard/guest';
  const hostDashboardBase = '/host/overview';

  return (
    <div className="min-h-screen bg-background">
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="fixed top-0 left-0 right-0 z-50 glass border-b border-border/50"
      >
        <div className="section-container">
          <div className="flex items-center justify-between h-20">
            <motion.div whileHover={{ scale: 1.02 }}>
              <Link to="/" className="flex items-center gap-3">
                <div className="w-10 h-10 shrink-0 overflow-hidden rounded-full border border-border/50 bg-white p-1.5 flex items-center justify-center dark:bg-card">
                  <img src={assets.logo} alt="" className="h-full w-full object-contain" />
                </div>
                <span className="font-display text-xl font-semibold text-foreground">Nepali Homestays</span>
              </Link>
            </motion.div>

            <div className="hidden lg:flex items-center gap-8">
              {navItems.map((item) => (
                <Link key={item.key} to={item.href} className="nav-link text-foreground/80 hover:text-primary font-medium transition-colors">
                  <motion.span whileHover={{ y: -2 }} className="block">
                    {t(item.key)}
                  </motion.span>
                </Link>
              ))}
            </div>

            <div className="hidden lg:flex items-center gap-4">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                type="button"
                onClick={toggleTheme}
                className="p-2 rounded-lg hover:bg-muted transition-colors"
                aria-label="Toggle theme"
              >
                <AnimatePresence mode="wait" initial={false}>
                  {isDark ? (
                    <motion.div
                      key="sun"
                      initial={{ rotate: -90, opacity: 0 }}
                      animate={{ rotate: 0, opacity: 1 }}
                      exit={{ rotate: 90, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Sun className="w-5 h-5 text-accent" />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="moon"
                      initial={{ rotate: 90, opacity: 0 }}
                      animate={{ rotate: 0, opacity: 1 }}
                      exit={{ rotate: -90, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Moon className="w-5 h-5 text-muted-foreground" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.button>

              <CurrencySwitcher />

              <Link to="/wishlist" aria-label="Wishlist" className="p-2 rounded-lg hover:bg-muted transition-colors">
                <Heart className="w-5 h-5 text-foreground" />
              </Link>

              <div className="relative" ref={langDropdownRef}>
                <button
                  type="button"
                  onClick={() => setShowLangDropdown(!showLangDropdown)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-muted transition-colors"
                  aria-expanded={showLangDropdown}
                >
                  <Globe className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">
                    {currentLang.flag} {currentLang.code.toUpperCase()}
                  </span>
                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                </button>
                <AnimatePresence>
                  {showLangDropdown && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute right-0 top-full mt-2 bg-card rounded-lg shadow-elevated border border-border overflow-hidden"
                    >
                      {languages.map((lang) => (
                        <button
                          key={lang.code}
                          type="button"
                          onClick={() => {
                            setLocale(lang.code);
                            setShowLangDropdown(false);
                          }}
                          className="flex items-center gap-3 w-full px-4 py-3 hover:bg-muted transition-colors text-left"
                        >
                          <span>{lang.flag}</span>
                          <span className="text-sm">{lang.name}</span>
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {user && <NotificationBell />}

              {user ? (
                <UserMenuDesktop
                  user={user}
                  profile={profile}
                  dropdownRef={dropdownRef}
                  showUserDropdown={showUserDropdown}
                  setShowUserDropdown={setShowUserDropdown}
                  initials={initials}
                  hostDashboardBase={hostDashboardBase}
                  guestDashboardBase={guestDashboardBase}
                  becomingHost={becomingHost}
                  setBecomingHost={setBecomingHost}
                  toast={toast}
                  logout={logout}
                  navigate={navigate}
                />
              ) : (
                <>
                  <Link to="/signin">
                    <Button variant="ghost" className="font-medium">
                      <LogIn className="w-4 h-4 mr-1" />
                      {t('nav.signIn')}
                    </Button>
                  </Link>
                  <Link to="/signup">
                    <Button className="font-medium bg-primary hover:bg-primary/90">
                      <UserPlus className="w-4 h-4 mr-1" />
                      {t('nav.signUp')}
                    </Button>
                  </Link>
                </>
              )}
            </div>

            <div className="flex items-center gap-1 lg:hidden">
              {user && <NotificationBell />}
              <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="p-2 rounded-lg hover:bg-muted transition-colors"
                aria-label={isOpen ? 'Close menu' : 'Open menu'}
              >
                {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="lg:hidden bg-card border-t border-border"
            >
              <div className="section-container py-4 space-y-4">
                {navItems.map((item, index) => (
                  <motion.div
                    key={item.key}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Link
                      to={item.href}
                      className="block py-2 text-foreground/80 hover:text-primary font-medium"
                      onClick={() => setIsOpen(false)}
                    >
                      {t(item.key)}
                    </Link>
                  </motion.div>
                ))}

                <div className="pt-4 border-t border-border space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <button type="button" onClick={toggleTheme} className="p-2 rounded-lg hover:bg-muted transition-colors mr-2" aria-label="Toggle theme">
                      {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                    </button>
                    <Globe className="w-4 h-4 text-muted-foreground shrink-0" />
                    <select
                      value={currentLang.code}
                      onChange={(e) => {
                        setLocale((e.target.value === 'ne' ? 'ne' : 'en') as 'en' | 'ne');
                      }}
                      className="bg-transparent text-sm border border-border rounded-md px-2 py-1.5 flex-1 min-w-0"
                    >
                      {languages.map((lang) => (
                        <option key={lang.code} value={lang.code}>
                          {lang.flag} {lang.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-muted-foreground mb-1 block">Currency</span>
                    <CurrencySwitcher />
                  </div>

                  {user ? (
                    <div className="flex flex-col gap-2">
                      <Link
                        to={isAdminRole(user.role) ? '/admin/overview' : user.role === 'host' ? '/host/overview' : guestDashboardBase}
                        onClick={() => setIsOpen(false)}
                      >
                        <Button variant="outline" className="w-full">
                          {user.role === 'admin' ? (
                            <>
                              <LayoutDashboard className="h-4 w-4 mr-2" />
                              Admin
                            </>
                          ) : user.role === 'host' ? (
                            <>
                              <LayoutDashboard className="h-4 w-4 mr-2" />
                              Host Dashboard
                            </>
                          ) : (
                            'Dashboard'
                          )}
                        </Button>
                      </Link>
                      {user.role === 'host' && (
                        <Link to="/host/listings/new" onClick={() => setIsOpen(false)} className="block">
                          <Button variant="outline" className="w-full">
                            <PlusCircle className="h-4 w-4 mr-2" />
                            Add Listing
                          </Button>
                        </Link>
                      )}
                      <Button
                        variant="ghost"
                        className="w-full"
                        onClick={() => {
                          setIsOpen(false);
                          logout();
                          navigate('/');
                        }}
                      >
                        Log out
                      </Button>
                    </div>
                  ) : (
                    <div className="flex gap-3">
                      <Link to="/signin" className="flex-1" onClick={() => setIsOpen(false)}>
                        <Button variant="outline" className="w-full">
                          {t('nav.signIn')}
                        </Button>
                      </Link>
                      <Link to="/signup" className="flex-1" onClick={() => setIsOpen(false)}>
                        <Button className="w-full">{t('nav.signUp')}</Button>
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>

      <div className="h-20" />
      <main className={isFullWidthMain ? '' : 'container mx-auto px-4 py-6'}>
        <PageTransition>
          <Outlet />
        </PageTransition>
      </main>
      <CompareWidget />
    </div>
  );
}
