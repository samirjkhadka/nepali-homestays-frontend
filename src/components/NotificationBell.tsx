import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Bell } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '@/lib/api';
import { useAuth , isAdminRole } from '@/lib/auth';
import { formatDateTime } from '@/lib/format';

type Notification = {
  id: number;
  title: string;
  body: string | null;
  type: string;
  image_url: string | null;
  related_id: number | null;
  related_type: string | null;
  read_at: string | null;
  created_at: string;
};

const API_URL = (import.meta.env.VITE_API_URL || '').trim();

export function NotificationBell() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchList = () => {
    if (!user) return;
    api.get<{ notifications: Notification[] }>('/api/notifications', { params: { limit: 30 } }).then((res) => {
      setNotifications(res.data.notifications || []);
    }).catch(() => {});
  };

  const fetchUnread = () => {
    if (!user) return;
    api.get<{ count: number }>('/api/notifications/unread-count').then((res) => {
      setUnreadCount(res.data.count ?? 0);
    }).catch(() => {});
  };

  useEffect(() => {
    if (!user) return;
    fetchUnread();
    const t = setInterval(fetchUnread, 60000);
    return () => clearInterval(t);
  }, [user]);

  useEffect(() => {
    if (open && user) {
      setLoading(true);
      fetchList();
      fetchUnread();
      setLoading(false);
    }
  }, [open, user]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const markRead = (id: number) => {
    api.patch(`/api/notifications/${id}/read`).then(() => {
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read_at: new Date().toISOString() } : n)));
      setUnreadCount((c) => Math.max(0, c - 1));
    }).catch(() => {});
  };

  const markAllRead = () => {
    api.patch('/api/notifications/read-all').then(() => {
      setNotifications((prev) => prev.map((n) => ({ ...n, read_at: n.read_at || new Date().toISOString() })));
      setUnreadCount(0);
    }).catch(() => {});
  };

  const getLink = (n: Notification): string | null => {
    if (n.related_type === 'listing' && n.related_id) return `/listings/${n.related_id}`;
    if (n.related_type === 'booking' && n.related_id) return `/dashboard/guest?tab=bookings`;
    if (n.related_type === 'payment') return `/dashboard/guest?tab=payment-history`;
    if (isAdminRole(user?.role)) return '/admin/overview';
    if (user?.role === 'host') return '/host/overview';
    return null;
  };

  if (!user) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-lg hover:bg-muted transition-colors"
        aria-label="Notifications"
        aria-expanded={open}
      >
        <Bell className="w-5 h-5 text-muted-foreground" />
        {unreadCount > 0 && (
          <span className="absolute top-0.5 right-0.5 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-primary px-1 text-[10px] font-medium text-primary-foreground">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="absolute right-0 top-full z-50 mt-2 w-[360px] max-h-[400px] flex flex-col rounded-lg border border-border bg-card shadow-lg"
          >
            <div className="flex items-center justify-between px-4 py-2 border-b border-border">
              <span className="font-medium text-foreground">Notifications</span>
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={markAllRead}
                  className="text-xs text-primary hover:underline"
                >
                  Mark all read
                </button>
              )}
            </div>
            <div className="overflow-y-auto flex-1">
              {loading ? (
                <div className="p-4 text-center text-sm text-muted-foreground">Loading…</div>
              ) : notifications.length === 0 ? (
                <div className="p-4 text-center text-sm text-muted-foreground">No notifications</div>
              ) : (
                <ul className="py-1">
                  {notifications.map((n) => {
                    const link = getLink(n);
                    const content = (
                      <>
                        {n.image_url && (
                          <img
                            src={n.image_url.startsWith('http') ? n.image_url : (API_URL + n.image_url)}
                            alt=""
                            className="w-10 h-10 object-cover rounded shrink-0"
                          />
                        )}
                        <div className="min-w-0 flex-1">
                          <p className={`text-sm ${n.read_at ? 'text-muted-foreground' : 'font-medium text-foreground'}`}>{n.title}</p>
                          {n.body && <p className="text-xs text-muted-foreground truncate">{n.body}</p>}
                          <p className="text-xs text-muted-foreground mt-0.5">{formatDateTime(n.created_at)}</p>
                        </div>
                      </>
                    );
                    return (
                      <li key={n.id}>
                        {link ? (
                          <Link
                            to={link}
                            onClick={() => {
                              if (!n.read_at) markRead(n.id);
                              setOpen(false);
                            }}
                            className="flex gap-3 px-4 py-3 hover:bg-muted transition-colors"
                          >
                            {content}
                          </Link>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              if (!n.read_at) markRead(n.id);
                            }}
                            className="w-full flex gap-3 px-4 py-3 hover:bg-muted transition-colors text-left"
                          >
                            {content}
                          </button>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
