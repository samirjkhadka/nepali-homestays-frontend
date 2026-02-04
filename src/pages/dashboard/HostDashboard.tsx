import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Bed, DollarSign, Home, Plus, Calendar, BarChart3, Star, MessageSquare, Languages, ChevronRight } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  Line,
} from 'recharts';
import { api } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { useCurrency } from '@/lib/currency';

type Booking = {
  id: number;
  listing_title: string;
  listing_location?: string;
  listing_price?: string;
  guest_name: string;
  guest_email: string;
  check_in: string;
  check_out: string;
  guests: number;
  message: string | null;
  status: string;
  payment_amount?: number | null;
};

type Listing = { id: number; title: string; status: string; disabled_by_admin?: boolean };

const BOOKING_STATUSES = ['all', 'pending', 'pending_payment', 'approved', 'partial_paid', 'paid', 'completed', 'declined', 'cancelled'] as const;

function formatBookingDateRange(checkIn: string, checkOut: string): string {
  const fmt = (d: string) => new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  return `${fmt(checkIn)} – ${fmt(checkOut)}`;
}

function statusBadgeClass(status: string): string {
  switch (status) {
    case 'pending_payment':
      return 'bg-amber-100 text-amber-800';
    case 'partial_paid':
      return 'bg-amber-100 text-amber-800';
    case 'paid':
    case 'completed':
      return 'bg-primary-100 text-primary-800';
    case 'approved':
      return 'bg-accent-100 text-accent-800';
    case 'pending':
      return 'bg-accent-50 text-accent-700';
    case 'declined':
    case 'cancelled':
      return 'bg-destructive/10 text-destructive';
    default:
      return 'bg-primary-100 text-primary-700';
  }
}

const TABS = ['overview', 'listings', 'bookings', 'calendar', 'reviews', 'messages', 'profile'] as const;
type TabType = (typeof TABS)[number];

const CHART_COLORS = [
  '#0d9488', /* accent/teal */
  '#1e3a5f', /* primary */
  '#0ea5e9',
  '#22c55e',
  '#eab308',
  '#f97316',
  '#ef4444',
  '#a855f7',
];

function buildBookingsByStatusData(bookings: Booking[]): { name: string; value: number }[] {
  const counts: Record<string, number> = {};
  for (const b of bookings) {
    const label = b.status === 'pending_payment' ? 'Awaiting payment' : b.status === 'partial_paid' ? 'Partial paid' : b.status.replace(/_/g, ' ');
    counts[label] = (counts[label] ?? 0) + 1;
  }
  return Object.entries(counts).map(([name, value]) => ({ name, value }));
}

function buildListingsByStatusData(listings: Listing[]): { name: string; value: number }[] {
  const counts: Record<string, number> = {};
  for (const l of listings) {
    const label = l.status.charAt(0).toUpperCase() + l.status.slice(1);
    counts[label] = (counts[label] ?? 0) + 1;
  }
  return Object.entries(counts).map(([name, value]) => ({ name, value }));
}

function buildBookingsByMonthData(bookings: Booking[]): { month: string; bookings: number; earnings: number }[] {
  const now = new Date();
  const months: { month: string; bookings: number; earnings: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const monthLabel = d.toLocaleDateString('en-GB', { month: 'short', year: '2-digit' });
    let count = 0;
    let earnings = 0;
    for (const b of bookings) {
      const checkIn = b.check_in.slice(0, 7);
      if (checkIn === key) {
        count += 1;
        if ((b.status === 'paid' || b.status === 'completed') && b.payment_amount != null) {
          earnings += Number(b.payment_amount);
        }
      }
    }
    months.push({ month: monthLabel, bookings: count, earnings: Math.round(earnings * 100) / 100 });
  }
  return months;
}

export default function HostDashboard() {
  const { toast } = useToast();
  const { format: formatPrice } = useCurrency();
  const [searchParams, setSearchParams] = useSearchParams();
  const tabFromUrl = searchParams.get('tab') as TabType | null;
  const [tab, setTab] = useState<TabType>(TABS.includes(tabFromUrl as TabType) ? tabFromUrl! : 'overview');
  const [hostReviews, setHostReviews] = useState<{ id: number; listing_id: number; listing_title: string; reviewer_name: string; rating: number; title: string | null; comment: string | null; created_at: string }[]>([]);
  const [hostReviewsTotal, setHostReviewsTotal] = useState(0);
  const [conversations, setConversations] = useState<{ booking_id: number; listing_title: string; other_name: string; other_user_id: number; last_message: string | null; last_message_at: string | null; unread_count: number }[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<{ booking_id: number; other_user_id: number; listing_title: string; other_name: string } | null>(null);
  const [threadMessages, setThreadMessages] = useState<{ id: number; sender_id: number; message: string; sender_name: string; created_at: string }[]>([]);
  const [messageText, setMessageText] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [dashboard, setDashboard] = useState<{
    listings_count: number;
    bookings_count: number;
    earnings: number;
    earnings_currency?: string;
    listings: Listing[];
    bookings: Booking[];
  } | null>(null);
  const [blockListingId, setBlockListingId] = useState('');
  const [blockDates, setBlockDates] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [profileForm, setProfileForm] = useState({
    name: '',
    phone: '',
    bio: '',
    brief_intro: '',
    superhost: false,
    languages_spoken: '',
  });

  useEffect(() => {
    const t = searchParams.get('tab') as TabType | null;
    if (t && TABS.includes(t)) setTab(t);
  }, [searchParams]);

  useEffect(() => {
    api.get('/api/host/dashboard').then((res) => setDashboard(res.data)).catch(() => setDashboard(null));
    api.get('/api/profile').then((res) => {
      const p = res.data as { name?: string; phone?: string; bio?: string; brief_intro?: string; superhost?: boolean; languages_spoken?: string };
      setProfileForm({
        name: p.name ?? '',
        phone: p.phone ?? '',
        bio: p.bio ?? '',
        brief_intro: p.brief_intro ?? '',
        superhost: Boolean(p.superhost),
        languages_spoken: p.languages_spoken ?? '',
      });
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (tab !== 'reviews') return;
    api.get<{ reviews: typeof hostReviews; total: number }>('/api/host/reviews').then((res) => {
      setHostReviews(res.data.reviews || []);
      setHostReviewsTotal(res.data.total ?? 0);
    }).catch(() => { setHostReviews([]); setHostReviewsTotal(0); });
  }, [tab]);

  useEffect(() => {
    if (tab !== 'messages') return;
    api.get<{ conversations: typeof conversations }>('/api/messages').then((res) => setConversations(res.data.conversations || [])).catch(() => setConversations([]));
  }, [tab]);

  useEffect(() => {
    if (!selectedConversation) {
      setThreadMessages([]);
      return;
    }
    api.get<{ messages: typeof threadMessages }>(`/api/messages/${selectedConversation.booking_id}?mark_read=1`).then((res) => setThreadMessages(res.data.messages || [])).catch(() => setThreadMessages([]));
  }, [selectedConversation?.booking_id]);

  /** Messaging allowed only when payment is done and booking is active (not completed/cancelled). */
  const canMessageConversation = (bookingId: number) =>
    dashboard?.bookings?.some((b) => b.id === bookingId && ['pending_payment', 'approved', 'partial_paid', 'paid'].includes(b.status)) ?? false;
  const selectedCanMessage = selectedConversation ? canMessageConversation(selectedConversation.booking_id) : false;

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedConversation || !messageText.trim()) return;
    setSendingMessage(true);
    api.post('/api/messages', { booking_id: selectedConversation.booking_id, receiver_id: selectedConversation.other_user_id, message: messageText.trim() })
      .then(() => {
        setMessageText('');
        return api.get<{ messages: typeof threadMessages }>(`/api/messages/${selectedConversation.booking_id}`);
      })
      .then((res) => setThreadMessages(res.data.messages || []))
      .catch(() => toast({ title: 'Failed to send.', variant: 'destructive' }))
      .finally(() => setSendingMessage(false));
  };

  const handleApprove = (id: number) => {
    api.patch(`/api/bookings/${id}`, { status: 'approved' }).then(() => {
      toast({ title: 'Booking approved.' });
      setDashboard((d) => d ? { ...d, bookings: d.bookings.map((b) => b.id === id ? { ...b, status: 'approved' } : b) } : null);
    }).catch(() => toast({ title: 'Failed.', variant: 'destructive' }));
  };

  const handleDecline = (id: number) => {
    api.patch(`/api/bookings/${id}`, { status: 'declined' }).then(() => {
      toast({ title: 'Booking declined.' });
      setDashboard((d) => d ? { ...d, bookings: d.bookings.map((b) => b.id === id ? { ...b, status: 'declined' } : b) } : null);
    }).catch(() => toast({ title: 'Failed.', variant: 'destructive' }));
  };

  const handleMarkAsPaid = (id: number) => {
    api.patch(`/api/bookings/${id}`, { status: 'paid' }).then(() => {
      toast({ title: 'Booking marked as paid.' });
      setDashboard((d) => d ? { ...d, bookings: d.bookings.map((b) => b.id === id ? { ...b, status: 'paid' } : b) } : null);
    }).catch((err) => toast({ title: err.response?.data?.message || 'Failed to mark as paid.', variant: 'destructive' }));
  };

  const handleBlockDates = (e: React.FormEvent) => {
    e.preventDefault();
    const listingId = Number(blockListingId);
    const dates = blockDates.split(/[\s,]+/).filter(Boolean);
    if (!listingId || dates.length === 0) {
      toast({ title: 'Select a listing and enter dates (YYYY-MM-DD).', variant: 'destructive' });
      return;
    }
    api.post('/api/blocked-dates', { listing_id: listingId, dates }).then(() => {
      toast({ title: 'Dates blocked.' });
      setBlockDates('');
    }).catch(() => toast({ title: 'Failed.', variant: 'destructive' }));
  };

  const handleListingStatusChange = (listingId: number, status: 'approved' | 'disabled') => {
    api.patch(`/api/listings/${listingId}/status`, { status })
      .then((res) => {
        toast({ title: status === 'approved' ? 'Listing enabled.' : 'Listing disabled.' });
        const updated = res.data?.listing as { id: number; status: string; disabled_by_admin?: boolean } | undefined;
        if (updated && dashboard) {
          setDashboard({
            ...dashboard,
            listings: dashboard.listings.map((l) =>
              l.id === listingId ? { ...l, status: updated.status, disabled_by_admin: updated.disabled_by_admin } : l
            ),
          });
        }
      })
      .catch(() => toast({ title: 'Failed to update status.', variant: 'destructive' }));
  };

  if (!dashboard) return <div className="py-8 text-muted-foreground">Loading…</div>;

  return (
    <div>
      <h1 className="text-3xl font-bold text-primary-800">Host dashboard</h1>
      <p className="mt-1 text-muted-foreground">Manage your listings and bookings</p>
      <div className="mt-6 flex flex-wrap gap-2 border-b border-primary-200">
        {TABS.map((t) => (
          <button
            key={t}
            type="button"
            className={`px-4 py-2 font-medium capitalize transition-colors ${tab === t ? 'border-b-2 border-accent-500 text-accent-600' : 'text-muted-foreground hover:text-primary-700'}`}
            onClick={() => {
              setTab(t);
              setSearchParams(t === 'overview' ? {} : { tab: t });
            }}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <div className="mt-6 space-y-8">
          <div className="grid gap-4 sm:grid-cols-3">
            <button
              type="button"
              onClick={() => { setTab('listings'); setSearchParams({ tab: 'listings' }); }}
              className="text-left transition-transform hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-accent-500 focus:ring-offset-2 rounded-lg"
            >
              <Card className="border-primary-200 hover:border-primary-300 hover:shadow-md transition-colors cursor-pointer h-full">
                <CardContent className="flex items-center justify-between gap-4 p-6">
                  <div className="flex items-center gap-4">
                    <div className="rounded-full bg-primary-100 p-3">
                      <Home className="h-8 w-8 text-primary-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-primary-800">{dashboard.listings_count}</p>
                      <p className="text-sm text-muted-foreground">Listings</p>
                    </div>
                  </div>
                  <ChevronRight className="h-6 w-6 text-primary-400 shrink-0" />
                </CardContent>
              </Card>
            </button>
            <button
              type="button"
              onClick={() => { setTab('bookings'); setSearchParams({ tab: 'bookings' }); }}
              className="text-left transition-transform hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-accent-500 focus:ring-offset-2 rounded-lg"
            >
              <Card className="border-primary-200 hover:border-primary-300 hover:shadow-md transition-colors cursor-pointer h-full">
                <CardContent className="flex items-center justify-between gap-4 p-6">
                  <div className="flex items-center gap-4">
                    <div className="rounded-full bg-accent-100 p-3">
                      <Bed className="h-8 w-8 text-accent-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-primary-800">{dashboard.bookings_count}</p>
                      <p className="text-sm text-muted-foreground">Bookings</p>
                    </div>
                  </div>
                  <ChevronRight className="h-6 w-6 text-primary-400 shrink-0" />
                </CardContent>
              </Card>
            </button>
            <button
              type="button"
              onClick={() => { setTab('bookings'); setSearchParams({ tab: 'bookings' }); }}
              className="text-left transition-transform hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-accent-500 focus:ring-offset-2 rounded-lg"
            >
              <Card className="border-primary-200 hover:border-primary-300 hover:shadow-md transition-colors cursor-pointer h-full">
                <CardContent className="flex items-center justify-between gap-4 p-6">
                  <div className="flex items-center gap-4">
                    <div className="rounded-full bg-primary-100 p-3">
                      <DollarSign className="h-8 w-8 text-primary-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-primary-800">{formatPrice(String(dashboard.earnings))}</p>
                      <p className="text-sm text-muted-foreground">Earnings (from paid bookings)</p>
                    </div>
                  </div>
                  <ChevronRight className="h-6 w-6 text-primary-400 shrink-0" />
                </CardContent>
              </Card>
            </button>
          </div>

          <Card className="border-primary-200">
            <CardHeader className="border-b border-primary-100 bg-primary-50/50">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-accent-500" />
                <h3 className="font-semibold text-primary-800">At a glance</h3>
              </div>
              <p className="text-sm text-muted-foreground">Quick stats from your activity</p>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-lg border border-primary-200 bg-primary-50/30 p-4">
                  <p className="text-sm text-muted-foreground">Active listings</p>
                  <p className="text-2xl font-bold text-primary-800">
                    {dashboard.listings.filter((l) => l.status === 'approved').length}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">Ready for guests</p>
                </div>
                <div className="rounded-lg border border-primary-200 bg-primary-50/30 p-4">
                  <p className="text-sm text-muted-foreground">Upcoming / active bookings</p>
                  <p className="text-2xl font-bold text-primary-800">
                    {dashboard.bookings.filter((b) => ['pending', 'pending_payment', 'approved', 'partial_paid', 'paid'].includes(b.status)).length}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">Need your attention</p>
                </div>
                <div className="rounded-lg border border-primary-200 bg-primary-50/30 p-4">
                  <p className="text-sm text-muted-foreground">Paid bookings</p>
                  <p className="text-2xl font-bold text-primary-800">
                    {dashboard.bookings.filter((b) => b.status === 'paid' || b.status === 'completed').length}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">Confirmed & completed</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="border-primary-200">
              <CardHeader className="border-b border-primary-100 bg-primary-50/50">
                <h3 className="font-semibold text-primary-800">Bookings by status</h3>
                <p className="text-sm text-muted-foreground">Distribution of your bookings</p>
              </CardHeader>
              <CardContent className="p-6">
                {dashboard.bookings.length === 0 ? (
                  <div className="flex h-[280px] items-center justify-center text-muted-foreground text-sm">
                    No bookings yet
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={280}>
                    <PieChart>
                      <Pie
                        data={buildBookingsByStatusData(dashboard.bookings)}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={2}
                        dataKey="value"
                        nameKey="name"
                        label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                      >
                        {buildBookingsByStatusData(dashboard.bookings).map((_, i) => (
                          <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number | undefined) => [value ?? 0, 'Bookings']} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            <Card className="border-primary-200">
              <CardHeader className="border-b border-primary-100 bg-primary-50/50">
                <h3 className="font-semibold text-primary-800">Listings by status</h3>
                <p className="text-sm text-muted-foreground">Approved, pending, or rejected</p>
              </CardHeader>
              <CardContent className="p-6">
                {dashboard.listings.length === 0 ? (
                  <div className="flex h-[280px] items-center justify-center text-muted-foreground text-sm">
                    No listings yet
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={280}>
                    <PieChart>
                      <Pie
                        data={buildListingsByStatusData(dashboard.listings)}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={2}
                        dataKey="value"
                        nameKey="name"
                        label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                      >
                        {buildListingsByStatusData(dashboard.listings).map((_, i) => (
                          <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number | undefined) => [value ?? 0, 'Listings']} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>

          <Card className="border-primary-200">
            <CardHeader className="border-b border-primary-100 bg-primary-50/50">
              <h3 className="font-semibold text-primary-800">Bookings & earnings (last 6 months)</h3>
              <p className="text-sm text-muted-foreground">Monthly bookings and revenue from paid stays</p>
            </CardHeader>
            <CardContent className="p-6">
              {(() => {
                const monthlyData = buildBookingsByMonthData(dashboard.bookings);
                const hasAny = monthlyData.some((d) => d.bookings > 0 || d.earnings > 0);
                if (!hasAny) {
                  return (
                    <div className="flex h-[280px] items-center justify-center text-muted-foreground text-sm">
                      No bookings in the last 6 months
                    </div>
                  );
                }
                return (
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={monthlyData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-primary-200" />
                      <XAxis dataKey="month" tick={{ fontSize: 12 }} className="text-primary-700" />
                      <YAxis yAxisId="left" tick={{ fontSize: 12 }} allowDecimals={false} />
                      <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} tickFormatter={(v) => formatPrice(String(v))} />
                      <Tooltip
                        formatter={(value: number | undefined, name?: string) => [(name === 'earnings' ? formatPrice(String(value ?? 0)) : (value ?? 0)), name === 'earnings' ? 'Earnings' : 'Bookings']}
                        labelFormatter={(label) => `Month: ${label}`}
                      />
                      <Legend />
                      <Bar yAxisId="left" dataKey="bookings" name="Bookings" fill={CHART_COLORS[0]} radius={[4, 4, 0, 0]} />
                      <Line yAxisId="right" type="monotone" dataKey="earnings" name="Earnings" stroke={CHART_COLORS[1]} strokeWidth={2} dot={{ r: 4 }} />
                    </BarChart>
                  </ResponsiveContainer>
                );
              })()}
            </CardContent>
          </Card>
        </div>
      )}

      {tab === 'listings' && (
        <div className="mt-6 space-y-6">
          <Button className="bg-accent-500 hover:bg-accent-600" asChild>
            <Link to="/host/listings/new"><Plus className="mr-2 h-4 w-4" />Add listing</Link>
          </Button>
          <div className="grid gap-4 sm:grid-cols-2">
            {dashboard.listings.map((l) => {
              const isApproved = l.status === 'approved';
              const isDisabled = l.status === 'disabled';
              const disabledByAdmin = Boolean(l.disabled_by_admin);
              const canToggle = !disabledByAdmin && (isApproved || isDisabled);
              return (
                <Card key={l.id} className="border-primary-200">
                  <CardContent className="p-6 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-semibold text-primary-800">{l.title}</p>
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <span className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${isApproved ? 'bg-green-100 text-green-800' : isDisabled ? 'bg-muted text-muted-foreground' : l.status === 'rejected' ? 'bg-destructive/10 text-destructive' : 'bg-accent-100 text-accent-800'}`}>
                            {l.status === 'pending' ? 'Pending review' : l.status === 'rejected' ? 'Rejected' : isApproved ? 'Enabled' : 'Disabled'}
                          </span>
                          {disabledByAdmin && (
                            <span className="inline-block rounded-full px-3 py-1 text-xs font-medium bg-amber-100 text-amber-800">
                              Disabled by admin
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      {canToggle && (
                        isApproved ? (
                          <Button variant="outline" size="sm" onClick={() => handleListingStatusChange(l.id, 'disabled')}>
                            Disable
                          </Button>
                        ) : (
                          <Button size="sm" className="bg-accent-500 hover:bg-accent-600" onClick={() => handleListingStatusChange(l.id, 'approved')}>
                            Enable
                          </Button>
                        )
                      )}
                      <Button variant="outline" size="sm" asChild>
                        <Link to={`/host/listings/${l.id}/edit`}>Edit</Link>
                      </Button>
                      {isApproved && (
                        <Button variant="outline" size="sm" asChild>
                          <Link to={`/listings/${l.id}`}>View</Link>
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {tab === 'bookings' && (
        <div className="mt-6 space-y-6">
          <div>
            <Label className="text-primary-800">Filter by status</Label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="mt-1 flex h-9 w-full max-w-xs rounded-md border border-primary-200 bg-background px-3 py-1 text-sm"
            >
              <option value="all">All</option>
              {BOOKING_STATUSES.filter((s) => s !== 'all').map((s) => (
                <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
              ))}
            </select>
          </div>
          {(() => {
            const filtered =
              statusFilter === 'all'
                ? dashboard.bookings
                : dashboard.bookings.filter((b) => b.status === statusFilter);
            const pendingBookings = filtered.filter((b) => b.status === 'pending');
            const otherBookings = filtered.filter((b) => b.status !== 'pending');
            return (
              <>
                {pendingBookings.length > 0 && (
                  <>
                    <h3 className="font-semibold text-primary-800">Pending requests (accept/decline)</h3>
                    {pendingBookings.map((b) => (
                      <Card key={b.id} className="border-primary-200">
                        <CardContent className="p-6">
                          <p className="font-semibold text-primary-800">{b.listing_title}</p>
                          <p className="text-sm text-muted-foreground">{b.guest_name} · {formatBookingDateRange(b.check_in, b.check_out)} · {b.guests} guests</p>
                          {b.message && <p className="mt-2 text-sm">{b.message}</p>}
                          <div className="mt-4 flex gap-2">
                            <Button size="sm" className="bg-accent-500 hover:bg-accent-600" onClick={() => handleApprove(b.id)}>Accept</Button>
                            <Button size="sm" variant="destructive" onClick={() => handleDecline(b.id)}>Decline</Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </>
                )}
                {(statusFilter === 'all' ? otherBookings : filtered).length > 0 && (
                  <>
                    {pendingBookings.length > 0 && <h3 className="mt-8 font-semibold text-primary-800">Other bookings</h3>}
                    {(statusFilter === 'all' ? otherBookings : filtered).map((b) => {
                      const nights = Math.ceil(
                        (new Date(b.check_out).getTime() - new Date(b.check_in).getTime()) / (24 * 60 * 60 * 1000)
                      );
                      const pricePerNight = b.listing_price != null ? parseFloat(b.listing_price) : 0;
                      const displayAmount =
                        b.payment_amount != null && (b.status === 'paid' || b.status === 'completed')
                          ? b.payment_amount
                          : nights * pricePerNight;
                      return (
                        <Card key={b.id} className="border-primary-200">
                          <CardContent className="flex flex-wrap items-center justify-between gap-4 p-4">
                            <div>
                              <p className="font-medium text-primary-800">{b.listing_title}</p>
                              <p className="text-sm text-muted-foreground">
                                {b.guest_name} · {formatBookingDateRange(b.check_in, b.check_out)}
                              </p>
                              {nights > 0 && (displayAmount > 0 || b.payment_amount != null) && (
                                <p className="mt-1 text-sm font-medium text-accent-600">
                                  {formatPrice(String(displayAmount))}
                                  {(b.status === 'paid' || b.status === 'completed') && b.payment_amount != null && ' (paid)'}
                                </p>
                              )}
                              <Badge className={`mt-2 ${statusBadgeClass(b.status)}`}>
                                {b.status === 'pending_payment' ? 'Awaiting payment' : b.status === 'partial_paid' ? 'Partial paid' : b.status}
                              </Badge>
                              {(b.status === 'pending_payment' || b.status === 'partial_paid') && (
                                <Button size="sm" className="mt-2 bg-primary hover:bg-primary/90" onClick={() => handleMarkAsPaid(b.id)}>
                                  Mark as paid (guest paid at checkout)
                                </Button>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </>
                )}
                {filtered.length === 0 && (
                  <p className="text-muted-foreground">
                    {statusFilter === 'all' ? 'No bookings yet.' : `No ${statusFilter.replace(/_/g, ' ')} bookings.`}
                  </p>
                )}
              </>
            );
          })()}
        </div>
      )}

      {tab === 'calendar' && (
        <Card className="mt-6 max-w-md border-primary-200">
          <CardHeader className="border-b border-primary-100 bg-primary-50/50">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-accent-500" />
              <h3 className="font-semibold text-primary-800">Block dates</h3>
            </div>
            <p className="text-sm text-muted-foreground">Make dates unavailable for a listing</p>
          </CardHeader>
          <CardContent className="p-6">
            <form onSubmit={handleBlockDates} className="space-y-4">
              <div>
                <Label className="text-primary-800">Listing</Label>
                <select value={blockListingId} onChange={(e) => setBlockListingId(e.target.value)} className="mt-1 w-full rounded-md border border-primary-200 bg-background px-3 py-2 text-sm">
                  <option value="">Select</option>
                  {dashboard.listings.map((l) => <option key={l.id} value={l.id}>{l.title}</option>)}
                </select>
              </div>
              <div>
                <Label className="text-primary-800">Dates (YYYY-MM-DD, comma separated)</Label>
                <Input value={blockDates} onChange={(e) => setBlockDates(e.target.value)} placeholder="2026-02-01, 2026-02-02" className="mt-1 border-primary-200" />
              </div>
              <Button type="submit" className="bg-accent-500 hover:bg-accent-600">Block dates</Button>
            </form>
          </CardContent>
        </Card>
      )}

      {tab === 'reviews' && (
        <div className="mt-6 space-y-6">
          <p className="text-muted-foreground">Guest reviews for your listings ({hostReviewsTotal} total)</p>
          {hostReviews.length === 0 ? (
            <Card className="border-primary-200 p-8 text-center">
              <Star className="mx-auto h-12 w-12 text-primary-300" />
              <h3 className="mt-4 font-semibold text-primary-800">Reviews received</h3>
              <p className="mt-2 text-sm text-muted-foreground">No reviews yet. Guests can leave a review after completing a stay.</p>
            </Card>
          ) : (
            <div className="space-y-4">
              {hostReviews.map((r) => (
                <Card key={r.id} className="border-primary-200">
                  <CardContent className="p-6">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <p className="font-semibold text-primary-800">{r.listing_title}</p>
                        <p className="text-sm text-muted-foreground">{r.reviewer_name}</p>
                        <div className="mt-2 flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star key={s} className={`h-4 w-4 ${s <= r.rating ? 'fill-accent-500 text-accent-500' : 'text-primary-200'}`} />
                          ))}
                          <span className="ml-2 text-sm font-medium text-primary-800">{r.rating}/5</span>
                        </div>
                        {r.title && <p className="mt-2 font-medium text-primary-800">{r.title}</p>}
                        {r.comment && <p className="mt-1 text-sm text-muted-foreground">{r.comment}</p>}
                        <p className="mt-2 text-xs text-muted-foreground">{r.created_at ? new Date(r.created_at).toISOString().slice(0, 10) : ''}</p>
                      </div>
                      <Button variant="outline" size="sm" asChild>
                        <Link to={`/listings/${r.listing_id}`}>View listing</Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'messages' && (
        <div className="mt-6">
          <p className="text-muted-foreground">Conversations about your bookings.</p>
          {conversations.length === 0 ? (
            <Card className="mt-4 border-primary-200 p-8 text-center">
              <MessageSquare className="mx-auto h-12 w-12 text-primary-300" />
              <h3 className="mt-4 font-semibold text-primary-800">Messages</h3>
              <p className="mt-2 text-sm text-muted-foreground">Conversations with guests will appear here once you have bookings.</p>
              <Button className="mt-4 bg-accent-500 hover:bg-accent-600" asChild>
                <Link to="/dashboard/host">Back to overview</Link>
              </Button>
            </Card>
          ) : (
            <div className="mt-4 grid gap-4 lg:grid-cols-3">
              <Card className="border-primary-200 lg:col-span-1">
                <CardContent className="p-0">
                  <div className="max-h-[400px] overflow-y-auto">
                    {conversations.map((c) => (
                      <button
                        key={c.booking_id}
                        type="button"
                        onClick={() => setSelectedConversation({ booking_id: c.booking_id, other_user_id: c.other_user_id, listing_title: c.listing_title, other_name: c.other_name })}
                        className={`w-full border-b border-primary-100 p-4 text-left transition-colors hover:bg-primary-50/50 ${selectedConversation?.booking_id === c.booking_id ? 'bg-accent-50/50' : ''}`}
                      >
                        <p className="font-medium text-primary-800">{c.listing_title}</p>
                        <p className="text-sm text-muted-foreground">{c.other_name}</p>
                        {c.last_message && <p className="mt-1 truncate text-xs text-muted-foreground">{c.last_message}</p>}
                        {c.unread_count > 0 && <span className="mt-1 inline-block rounded-full bg-accent-500 px-2 py-0.5 text-xs text-white">{c.unread_count}</span>}
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>
              <Card className="border-primary-200 lg:col-span-2">
                {!selectedConversation ? (
                  <CardContent className="flex min-h-[300px] items-center justify-center p-8 text-center text-muted-foreground">
                    Select a conversation
                  </CardContent>
                ) : (
                  <>
                    <CardHeader className="border-b border-primary-100 bg-primary-50/30">
                      <p className="font-semibold text-primary-800">{selectedConversation.listing_title}</p>
                      <p className="text-sm text-muted-foreground">With {selectedConversation.other_name}</p>
                    </CardHeader>
                    <CardContent className="p-0">
                      {!selectedCanMessage && (
                        <p className="text-sm text-amber-800 bg-amber-50 border-b border-amber-200 p-3 mx-4 mt-2 rounded-lg">
                          Messaging is only available for active bookings after payment. This conversation is closed.
                        </p>
                      )}
                      <div className="max-h-[320px] overflow-y-auto p-4 space-y-3">
                        {threadMessages.map((m) => (
                          <div key={m.id} className="rounded-lg p-3 bg-primary-50/50">
                            <p className="text-xs font-medium text-primary-700">{m.sender_name}</p>
                            <p className="text-sm text-foreground">{m.message}</p>
                            <p className="mt-1 text-xs text-muted-foreground">{m.created_at ? new Date(m.created_at).toLocaleString() : ''}</p>
                          </div>
                        ))}
                      </div>
                      {selectedCanMessage ? (
                        <form onSubmit={handleSendMessage} className="flex gap-2 border-t border-primary-200 p-4">
                          <Input value={messageText} onChange={(e) => setMessageText(e.target.value)} placeholder="Type a message..." className="flex-1 border-primary-200" disabled={sendingMessage} />
                          <Button type="submit" className="bg-accent-500 hover:bg-accent-600" disabled={sendingMessage || !messageText.trim()}>Send</Button>
                        </form>
                      ) : (
                        <p className="text-muted-foreground text-sm border-t border-primary-200 p-4">You can no longer send messages for this booking.</p>
                      )}
                    </CardContent>
                  </>
                )}
              </Card>
            </div>
          )}
        </div>
      )}

      {tab === 'profile' && (
        <Card className="mt-6 max-w-xl border-primary-200">
          <CardHeader className="border-b border-primary-100 bg-primary-50/50">
            <h3 className="font-semibold text-primary-800">Profile</h3>
            <p className="text-sm text-muted-foreground">Update your host profile (shown on your listings)</p>
          </CardHeader>
          <CardContent className="p-6">
            <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                api
                  .patch('/api/profile', {
                    name: profileForm.name,
                    phone: profileForm.phone,
                    bio: profileForm.bio,
                    brief_intro: profileForm.brief_intro || undefined,
                    superhost: profileForm.superhost,
                    languages_spoken: profileForm.languages_spoken || undefined,
                  })
                  .then(() => toast({ title: 'Saved.' }))
                  .catch(() => toast({ title: 'Failed.', variant: 'destructive' }));
              }}
            >
              <div>
                <Label className="text-primary-800">Name</Label>
                <Input value={profileForm.name} onChange={(e) => setProfileForm((f) => ({ ...f, name: e.target.value }))} className="mt-1 border-primary-200" />
              </div>
              <div>
                <Label className="text-primary-800">Phone</Label>
                <Input value={profileForm.phone} onChange={(e) => setProfileForm((f) => ({ ...f, phone: e.target.value }))} className="mt-1 border-primary-200" />
              </div>
              <div>
                <Label className="text-primary-800">Bio</Label>
                <Textarea value={profileForm.bio} onChange={(e) => setProfileForm((f) => ({ ...f, bio: e.target.value }))} className="mt-1 border-primary-200" rows={3} />
              </div>
              <div>
                <Label className="text-primary-800 flex items-center gap-2">
                  <Languages className="h-4 w-4" />
                  Brief intro (for hosts)
                </Label>
                <Textarea
                  value={profileForm.brief_intro}
                  onChange={(e) => setProfileForm((f) => ({ ...f, brief_intro: e.target.value }))}
                  className="mt-1 border-primary-200"
                  rows={2}
                  placeholder="Short intro shown on your listings"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="superhost"
                  checked={profileForm.superhost}
                  onChange={(e) => setProfileForm((f) => ({ ...f, superhost: e.target.checked }))}
                  className="h-4 w-4 rounded border-primary-300"
                />
                <Label htmlFor="superhost" className="text-primary-800 cursor-pointer">
                  Superhost (display badge on listings)
                </Label>
              </div>
              <div>
                <Label className="text-primary-800">Languages spoken</Label>
                <Input
                  value={profileForm.languages_spoken}
                  onChange={(e) => setProfileForm((f) => ({ ...f, languages_spoken: e.target.value }))}
                  className="mt-1 border-primary-200"
                  placeholder="e.g. Nepali, English, Hindi"
                />
              </div>
              <Button type="submit" className="bg-accent-500 hover:bg-accent-600">Save</Button>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
