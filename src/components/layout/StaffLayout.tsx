import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  BarChart3, Home, Users, Bed, Building2, CreditCard, FileText, Newspaper,
  Settings, CalendarX, Mountain, ShieldCheck, Wallet, Activity, Star,
  MessageSquare, User, Menu, X, LogOut, ExternalLink,
} from 'lucide-react';
import { useAuth } from '@/lib/auth';

export interface StaffNavItem {
  /** Path segment; the route is `${base}/${to}`. */
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  /** Superadmin-only items are hidden from ordinary admins. */
  superadminOnly?: boolean;
}

export interface StaffNavGroup {
  heading: string;
  items: StaffNavItem[];
}

/**
 * Grouped rather than a flat list of thirteen.
 *
 * The grouping follows what someone is trying to DO — moderating, running
 * today's operations, editing content, configuring the platform, or looking for
 * why something went wrong — not which API a screen happens to call.
 */
export const ADMIN_NAV: StaffNavGroup[] = [
  { heading: 'Overview', items: [
    { to: 'overview', label: 'Dashboard', icon: BarChart3 },
  ]},
  { heading: 'Moderation', items: [
    { to: 'listings', label: 'Listings', icon: Home },
    { to: 'users', label: 'Users', icon: Users },
  ]},
  { heading: 'Operations', items: [
    { to: 'bookings', label: 'Bookings', icon: Bed },
    { to: 'payments', label: 'Payments', icon: CreditCard },
    { to: 'corporates', label: 'Corporates', icon: Building2 },
    { to: 'wallet_utilities', label: 'Wallet utilities', icon: Wallet },
  ]},
  { heading: 'Content', items: [
    { to: 'content', label: 'Pages & media', icon: Newspaper },
    { to: 'treks', label: 'Treks', icon: Mountain },
  ]},
  { heading: 'Configuration', items: [
    { to: 'settings', label: 'Settings', icon: Settings },
    { to: 'cancellation', label: 'Cancellation', icon: CalendarX },
    { to: 'security', label: 'Security', icon: ShieldCheck, superadminOnly: true },
  ]},
  { heading: 'Diagnostics', items: [
    { to: 'reports', label: 'Reports', icon: FileText },
    { to: 'logs', label: 'Logs', icon: Activity },
  ]},
];

export const HOST_NAV: StaffNavGroup[] = [
  { heading: 'Overview', items: [
    { to: 'overview', label: 'Dashboard', icon: BarChart3 },
  ]},
  { heading: 'Your homestays', items: [
    { to: 'listings', label: 'Listings', icon: Home },
    { to: 'calendar', label: 'Calendar', icon: CalendarX },
  ]},
  { heading: 'Guests', items: [
    { to: 'bookings', label: 'Bookings', icon: Bed },
    { to: 'messages', label: 'Messages', icon: MessageSquare },
    { to: 'reviews', label: 'Reviews', icon: Star },
  ]},
  { heading: 'Money', items: [
    { to: 'utilities', label: 'Wallet & bills', icon: Wallet },
  ]},
  { heading: 'Account', items: [
    { to: 'profile', label: 'Profile', icon: User },
  ]},
];

interface StaffLayoutProps {
  base: '/admin' | '/host';
  title: string;
  nav: StaffNavGroup[];
}

/**
 * The shell for staff consoles — one implementation, two menus.
 *
 * Deliberately outside the public Layout. An admin signing in to moderate
 * listings does not need the marketing nav, the language switcher or the
 * footer, and having them there made the console feel like a page on the
 * website rather than a tool.
 */
export function StaffLayout({ base, title, nav }: StaffLayoutProps) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const isSuperAdmin = user?.role === 'superadmin';

  // Navigating on a phone should close the drawer. Without this the new screen
  // renders behind a menu the user has to dismiss by hand.
  useEffect(() => { setOpen(false); }, [location.pathname]);

  const visible = nav
    .map((g) => ({ ...g, items: g.items.filter((i) => !i.superadminOnly || isSuperAdmin) }))
    .filter((g) => g.items.length > 0);

  const sidebar = (
    <nav className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-sidebar-border px-4 py-4">
        <Link to={`${base}/overview`} className="min-w-0">
          <span className="block truncate font-display text-lg font-semibold text-sidebar-foreground">
            {title}
          </span>
          <span className="block truncate text-xs text-sidebar-muted">Nepali Homestays</span>
        </Link>
        <button
          type="button"
          className="rounded p-1 text-sidebar-muted hover:text-sidebar-foreground lg:hidden"
          onClick={() => setOpen(false)}
          aria-label="Close menu"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-2 py-4">
        {visible.map((group) => (
          <div key={group.heading} className="mb-5">
            <p className="px-3 pb-1.5 text-[11px] font-semibold uppercase tracking-wider text-sidebar-muted">
              {group.heading}
            </p>
            <ul className="space-y-0.5">
              {group.items.map((item) => (
                <li key={item.to}>
                  <NavLink
                    to={`${base}/${item.to}`}
                    className={({ isActive }) =>
                      `flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors ${
                        isActive
                          ? 'bg-sidebar-active font-medium text-sidebar-active-foreground'
                          : 'text-sidebar-muted hover:bg-sidebar-hover hover:text-sidebar-foreground'
                      }`
                    }
                  >
                    <item.icon className="h-4 w-4 shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="border-t border-sidebar-border p-3">
        <Link
          to="/"
          className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-sidebar-muted hover:bg-sidebar-hover hover:text-sidebar-foreground"
        >
          <ExternalLink className="h-4 w-4" /> View the site
        </Link>
      </div>
    </nav>
  );

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Desktop: always present. Mobile: a drawer, so the console is usable on
          a phone rather than merely rendering on one. */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 bg-sidebar lg:block">
        {sidebar}
      </aside>

      {open && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/40 lg:hidden"
            onClick={() => setOpen(false)}
            aria-hidden
          />
          <aside className="fixed inset-y-0 left-0 z-50 w-64 bg-sidebar lg:hidden">{sidebar}</aside>
        </>
      )}

      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-border bg-background/95 px-4 py-3 backdrop-blur">
          <button
            type="button"
            className="rounded p-1.5 text-muted-foreground hover:text-foreground lg:hidden"
            onClick={() => setOpen(true)}
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>

          <div className="ml-auto flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-medium leading-tight">{user?.email}</p>
              <p className="text-xs capitalize text-muted-foreground">{user?.role}</p>
            </div>
            <button
              type="button"
              onClick={() => { logout(); navigate('/login', { replace: true }); }}
              className="flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground"
            >
              <LogOut className="h-4 w-4" /> Sign out
            </button>
          </div>
        </header>

        <main className="p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

/** Preset for the admin console. */
export function AdminLayout() {
  return <StaffLayout base="/admin" title="Admin" nav={ADMIN_NAV} />;
}

/** Preset for the host console. */
export function HostLayout() {
  return <StaffLayout base="/host" title="Hosting" nav={HOST_NAV} />;
}
