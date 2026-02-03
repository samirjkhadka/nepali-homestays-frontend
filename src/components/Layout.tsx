import { useState, useEffect, useRef } from 'react';
import { Link, Outlet, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Globe, ChevronDown, LogOut, User, KeyRound, Heart, MessageSquare, Receipt, Calendar, LogIn, UserPlus, LayoutDashboard, PlusCircle } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { useCurrency } from '@/lib/currency';
import { useI18n } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
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

const navItems = [
  { key: 'nav.home', href: '/' },
  { key: 'nav.packages', href: '/search' },
  { key: 'nav.homestays', href: '/search' },
  { key: 'nav.videos', href: '/videos' },
  { key: 'nav.blogs', href: '/blogs' },
  { key: 'nav.about', href: '/about' },
  { key: 'nav.contact', href: '/contact' },
];

const languages = [
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'ne', name: 'नेपाली', flag: '🇳🇵' },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const { currency, setCurrency } = useCurrency();
  const { locale, setLocale, t } = useI18n();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<{ name?: string; avatar_url?: string | null } | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const currentLang = languages.find((l) => l.code === locale) ?? languages[0];
  const [showLangDropdown, setShowLangDropdown] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const langDropdownRef = useRef<HTMLDivElement>(null);

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
  const hostDashboardBase = '/dashboard/host';

  return (
    <div className="min-h-screen bg-background">
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80"
      >
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-3">
              <motion.img
                src={assets.logo}
                alt="Nepali Homestays"
                className="h-8 w-auto"
                whileHover={{ scale: 1.02 }}
              />
              <span className="font-serif text-xl font-semibold text-foreground hidden sm:inline">
                Nepali Homestays
              </span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center gap-8">
              {navItems.map((item) => (
                <Link key={item.key} to={item.href}>
                  <motion.span
                    className="text-foreground/80 hover:text-primary font-medium transition-colors cursor-pointer block"
                    whileHover={{ y: -2 }}
                  >
                    {t(item.key)}
                  </motion.span>
                </Link>
              ))}
            </div>

            {/* Right: Language + Currency + Auth */}
            <div className="hidden lg:flex items-center gap-4">
              {/* Currency */}
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
                className="rounded-lg border border-border bg-muted/50 px-3 py-2 text-sm font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                aria-label="Currency"
              >
                {CURRENCIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              {/* Language */}
              <div className="relative" ref={langDropdownRef}>
                <button
                  type="button"
                  onClick={() => setShowLangDropdown(!showLangDropdown)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-muted transition-colors"
                  aria-expanded={showLangDropdown}
                >
                  <Globe className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">{currentLang.flag} {currentLang.code.toUpperCase()}</span>
                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                </button>
                <AnimatePresence>
                  {showLangDropdown && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute right-0 top-full mt-2 bg-card rounded-lg shadow-lg border border-border overflow-hidden min-w-[140px]"
                    >
                      {languages.map((lang) => (
                        <button
                          key={lang.code}
                          type="button"
                          onClick={() => {
                            setLocale(lang.code as 'en' | 'ne');
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
              {/* Auth / User */}
              {user ? (
                <div className="relative" ref={dropdownRef}>
                  <button
                    type="button"
                    onClick={() => setShowUserDropdown(!showUserDropdown)}
                    className="flex items-center gap-2 rounded-full border border-border bg-muted/50 p-1 pr-2 transition-colors hover:bg-muted focus:outline-none focus:ring-2 focus:ring-primary"
                    aria-expanded={showUserDropdown}
                  >
                    {profile?.avatar_url ? (
                      <img
                        src={profile.avatar_url.startsWith('http') ? profile.avatar_url : (import.meta.env.VITE_API_URL || '') + profile.avatar_url}
                        alt=""
                        className="h-8 w-8 rounded-full object-cover"
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
                        className="absolute right-0 top-full z-50 mt-2 min-w-[200px] rounded-lg border border-border bg-card py-1 shadow-lg"
                      >
                        <Link
                          to={user.role === 'admin' ? '/admin/dashboard' : `${user.role === 'host' ? hostDashboardBase : guestDashboardBase}?tab=profile`}
                          onClick={() => setShowUserDropdown(false)}
                          className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-foreground hover:bg-muted"
                        >
                          <User className="h-4 w-4" />
                          Profile
                        </Link>
                        {(user.role === 'guest' || user.role === 'host') && (
                          <>
                            <Link to={`${guestDashboardBase}?tab=bookings`} onClick={() => setShowUserDropdown(false)} className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-foreground hover:bg-muted">
                              <Calendar className="h-4 w-4" />
                              Bookings
                            </Link>
                            <Link to={`${guestDashboardBase}?tab=wishlist`} onClick={() => setShowUserDropdown(false)} className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-foreground hover:bg-muted">
                              <Heart className="h-4 w-4" />
                              Wishlist
                            </Link>
                            <Link to={`${guestDashboardBase}?tab=messages`} onClick={() => setShowUserDropdown(false)} className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-foreground hover:bg-muted">
                              <MessageSquare className="h-4 w-4" />
                              Messages
                            </Link>
                            <Link to={`${guestDashboardBase}?tab=payment-history`} onClick={() => setShowUserDropdown(false)} className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-foreground hover:bg-muted">
                              <Receipt className="h-4 w-4" />
                              Payment history
                            </Link>
                          </>
                        )}
                        {user.role === 'host' && (
                          <>
                            <Link to="/dashboard/host" onClick={() => setShowUserDropdown(false)} className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-foreground hover:bg-muted">
                              <LayoutDashboard className="h-4 w-4" />
                              Host Dashboard
                            </Link>
                            <Link to="/host/listings/new" onClick={() => setShowUserDropdown(false)} className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-foreground hover:bg-muted">
                              <PlusCircle className="h-4 w-4" />
                              Add Listing
                            </Link>
                          </>
                        )}
                        {user.role === 'admin' && (
                          <Link to="/admin/dashboard" onClick={() => setShowUserDropdown(false)} className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-foreground hover:bg-muted">
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
              ) : (
                <>
                  <Link to="/login">
                    <Button variant="ghost" className="font-medium">
                      <LogIn className="w-4 h-4 mr-2" />
                      {t('nav.signIn')}
                    </Button>
                  </Link>
                  <Link to="/signup">
                    <Button className="font-medium bg-primary hover:bg-primary/90">
                      <UserPlus className="w-4 h-4 mr-2" />
                      {t('nav.signUp')}
                    </Button>
                  </Link>
                </>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              type="button"
              onClick={() => setIsOpen(!isOpen)}
              className="lg:hidden p-2 rounded-lg hover:bg-muted transition-colors"
              aria-label={isOpen ? 'Close menu' : 'Open menu'}
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="lg:hidden border-t border-border bg-card"
            >
              <div className="container mx-auto px-4 py-4 space-y-4">
                {navItems.map((item, index) => (
                  <Link key={item.key} to={item.href} onClick={() => setIsOpen(false)}>
                    <motion.span
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="block py-2 text-foreground/80 hover:text-primary font-medium"
                    >
                      {t(item.key)}
                    </motion.span>
                  </Link>
                ))}
                <div className="pt-4 border-t border-border space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-muted-foreground">Currency</span>
                    <select
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
                      className="rounded-md border border-border bg-muted/50 px-2 py-1.5 text-sm"
                    >
                      {CURRENCIES.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-muted-foreground" />
                    <select
                      value={currentLang.code}
                      onChange={(e) => setLocale((e.target.value === 'ne' ? 'ne' : 'en') as 'en' | 'ne')}
                      className="flex-1 rounded-md border border-border bg-muted/50 px-2 py-1.5 text-sm"
                    >
                      {languages.map((lang) => (
                        <option key={lang.code} value={lang.code}>
                          {lang.flag} {lang.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  {user ? (
                    <div className="flex flex-col gap-2">
                      <Link to={user.role === 'host' ? '/dashboard/host' : guestDashboardBase} onClick={() => setIsOpen(false)}>
                        <Button variant="outline" className="w-full">Dashboard</Button>
                      </Link>
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
                      <Link to="/login" onClick={() => setIsOpen(false)} className="flex-1">
                        <Button variant="outline" className="w-full"><LogIn className="w-4 h-4 mr-2" />{t('nav.signIn')}</Button>
                      </Link>
                      <Link to="/signup" onClick={() => setIsOpen(false)} className="flex-1">
                        <Button className="w-full"><UserPlus className="w-4 h-4 mr-2" />{t('nav.signUp')}</Button>
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>

      {/* Spacer for fixed nav */}
      <div className="h-20" />
      <main className="container mx-auto px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}
