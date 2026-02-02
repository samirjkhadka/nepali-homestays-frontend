import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import * as Dialog from '@radix-ui/react-dialog';
import { jsPDF } from 'jspdf';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, FileCheck, Calendar, CreditCard, BarChart3, FileText, Settings, Youtube, X, Download } from 'lucide-react';
import { api } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

type Listing = { id: number; title: string; host_id: number; status: string; created_at: string };
type User = { id: number; name: string; email: string; phone: string | null; role: string };
type AdminBooking = { id: number; listing_id: number; listing_title: string; guest_name: string; guest_email: string; check_in: string; check_out: string; guests: number; status: string; created_at: string };
type AdminPayment = { id: number; booking_id: number; amount: number; status: string; created_at: string; listing_title: string; guest_name: string };

const ADMIN_TABS = ['overview', 'listings', 'users', 'bookings', 'payments', 'reports', 'content', 'settings'] as const;
type AdminTab = (typeof ADMIN_TABS)[number];

function formatDateOnly(iso: string): string {
  if (!iso) return '—';
  const d = new Date(iso);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function bookingStatusColor(s: string): string {
  if (s === 'paid' || s === 'completed') return 'bg-green-100 text-green-800';
  if (s === 'declined' || s === 'cancelled') return 'bg-red-100 text-red-800';
  return 'bg-yellow-100 text-yellow-800';
}

export default function AdminDashboard() {
  const { toast } = useToast();
  const [tab, setTab] = useState<AdminTab>('overview');
  const [pendingListings, setPendingListings] = useState<Listing[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<{ total_users?: number; total_listings?: number; total_bookings?: number; total_revenue?: number }>({});
  const [adminBookings, setAdminBookings] = useState<AdminBooking[]>([]);
  const [adminBookingsTotal, setAdminBookingsTotal] = useState(0);
  const [adminBookingsStatus, setAdminBookingsStatus] = useState<string>('');
  const [adminPayments, setAdminPayments] = useState<AdminPayment[]>([]);
  const [adminPaymentsTotal, setAdminPaymentsTotal] = useState(0);
  const [landingYoutubeUrl, setLandingYoutubeUrl] = useState('');
  const [landingYoutubeSaving, setLandingYoutubeSaving] = useState(false);
  const [bookingFee, setBookingFee] = useState<{ type: 'service_charge' | 'discount'; kind: 'percent' | 'fixed'; value: number } | null>(null);
  const [bookingFeeSaving, setBookingFeeSaving] = useState(false);
  const [bookingFeeForm, setBookingFeeForm] = useState({ type: 'service_charge' as 'service_charge' | 'discount', kind: 'percent' as 'percent' | 'fixed', value: '' });
  const [selectedBooking, setSelectedBooking] = useState<AdminBooking | null>(null);
  const [selectedPayment, setSelectedPayment] = useState<AdminPayment | null>(null);

  useEffect(() => {
    api.get<{
      pending_listings?: Listing[]; listings?: Listing[]; users?: User[];
      total_users?: number; total_listings?: number; total_bookings?: number; total_revenue?: number;
    }>('/api/admin/dashboard').then((res) => {
      setPendingListings(res.data.pending_listings || res.data.listings || []);
      setUsers(res.data.users || []);
      setStats({
        total_users: res.data.total_users,
        total_listings: res.data.total_listings,
        total_bookings: res.data.total_bookings,
        total_revenue: res.data.total_revenue,
      });
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (tab !== 'bookings' && tab !== 'reports') return;
    const params = new URLSearchParams();
    if (tab === 'bookings' && adminBookingsStatus) params.set('status', adminBookingsStatus);
    api.get<{ bookings: AdminBooking[]; total: number }>(`/api/admin/bookings?${params}`).then((res) => {
      setAdminBookings(res.data.bookings || []);
      setAdminBookingsTotal(res.data.total ?? 0);
    }).catch(() => { setAdminBookings([]); setAdminBookingsTotal(0); });
  }, [tab, adminBookingsStatus]);

  useEffect(() => {
    if (tab !== 'payments') return;
    api.get<{ payments: AdminPayment[]; total: number }>('/api/admin/payments').then((res) => {
      setAdminPayments(res.data.payments || []);
      setAdminPaymentsTotal(res.data.total ?? 0);
    }).catch(() => { setAdminPayments([]); setAdminPaymentsTotal(0); });
  }, [tab]);

  useEffect(() => {
    if (tab !== 'content') return;
    api.get<{ landing_youtube_url?: string | null }>('/api/admin/settings').then((res) => {
      setLandingYoutubeUrl(res.data.landing_youtube_url || '');
    }).catch(() => setLandingYoutubeUrl(''));
  }, [tab]);

  useEffect(() => {
    if (tab !== 'settings') return;
    api.get<{ booking_fee?: { type: 'service_charge' | 'discount'; kind: 'percent' | 'fixed'; value: number } | null }>('/api/admin/settings').then((res) => {
      const bf = res.data.booking_fee ?? null;
      setBookingFee(bf);
      setBookingFeeForm(bf ? { type: bf.type, kind: bf.kind, value: String(bf.value) } : { type: 'service_charge', kind: 'percent', value: '' });
    }).catch(() => { setBookingFee(null); setBookingFeeForm({ type: 'service_charge', kind: 'percent', value: '' }); });
  }, [tab]);

  const handleSaveLandingYoutube = (e: React.FormEvent) => {
    e.preventDefault();
    setLandingYoutubeSaving(true);
    api.patch('/api/admin/settings', { landing_youtube_url: landingYoutubeUrl.trim() || null })
      .then((res) => {
        setLandingYoutubeUrl(res.data.landing_youtube_url || '');
        toast({ title: 'Settings saved.' });
      })
      .catch(() => toast({ title: 'Failed to save.', variant: 'destructive' }))
      .finally(() => setLandingYoutubeSaving(false));
  };

  const handleApprove = (id: number) => {
    api.patch(`/api/admin/listings/${id}/approve`).then(() => {
      toast({ title: 'Listing approved.' });
      setPendingListings((list) => list.filter((l) => l.id !== id));
    }).catch(() => toast({ title: 'Failed.', variant: 'destructive' }));
  };

  const handleReject = (id: number) => {
    api.patch(`/api/admin/listings/${id}/reject`).then(() => {
      toast({ title: 'Listing rejected.' });
      setPendingListings((list) => list.filter((l) => l.id !== id));
    }).catch(() => toast({ title: 'Failed.', variant: 'destructive' }));
  };

  const handleRoleChange = (userId: number, role: string) => {
    api.patch(`/api/admin/users/${userId}`, { role }).then(() => {
      toast({ title: 'User updated.' });
      setUsers((list) => list.map((u) => u.id === userId ? { ...u, role } : u));
    }).catch(() => toast({ title: 'Failed.', variant: 'destructive' }));
  };

  return (
    <div>
      <h1 className="text-3xl font-bold text-primary-800">Admin dashboard</h1>
      <p className="mt-1 text-muted-foreground">Moderate listings and manage users</p>
      <div className="mt-6 flex flex-wrap gap-2 border-b border-primary-200">
        {ADMIN_TABS.map((t) => (
          <button
            key={t}
            type="button"
            className={`px-4 py-2 font-medium capitalize transition-colors ${tab === t ? 'border-b-2 border-accent-500 text-accent-600' : 'text-muted-foreground hover:text-primary-700'}`}
            onClick={() => setTab(t)}
          >
            {t === 'listings' ? 'Pending listings' : t}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <div className="mt-6 space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="cursor-pointer border-primary-200 transition-shadow hover:shadow-md" onClick={() => setTab('listings')}>
              <CardContent className="flex items-center gap-4 p-6">
                <div className="rounded-full bg-accent-100 p-3">
                  <FileCheck className="h-8 w-8 text-accent-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-primary-800">{pendingListings.length}</p>
                  <p className="text-sm text-muted-foreground">Pending listings</p>
                </div>
              </CardContent>
            </Card>
            <Card className="cursor-pointer border-primary-200 transition-shadow hover:shadow-md" onClick={() => setTab('users')}>
              <CardContent className="flex items-center gap-4 p-6">
                <div className="rounded-full bg-primary-100 p-3">
                  <Users className="h-8 w-8 text-primary-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-primary-800">{stats.total_users ?? users.length}</p>
                  <p className="text-sm text-muted-foreground">Users</p>
                </div>
              </CardContent>
            </Card>
            <Card className="cursor-pointer border-primary-200 transition-shadow hover:shadow-md" onClick={() => setTab('bookings')}>
              <CardContent className="flex items-center gap-4 p-6">
                <div className="rounded-full bg-primary-100 p-3">
                  <Calendar className="h-8 w-8 text-primary-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-primary-800">{stats.total_bookings ?? '—'}</p>
                  <p className="text-sm text-muted-foreground">Bookings</p>
                </div>
              </CardContent>
            </Card>
            <Card className="cursor-pointer border-primary-200 transition-shadow hover:shadow-md" onClick={() => setTab('payments')}>
              <CardContent className="flex items-center gap-4 p-6">
                <div className="rounded-full bg-accent-100 p-3">
                  <CreditCard className="h-8 w-8 text-accent-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-primary-800">NPR {Number(stats.total_revenue ?? 0).toLocaleString()}</p>
                  <p className="text-sm text-muted-foreground">Revenue</p>
                </div>
              </CardContent>
            </Card>
          </div>
          <Card className="border-primary-200">
            <CardHeader className="border-b border-primary-100 bg-primary-50/50">
              <h2 className="font-semibold text-primary-800">Quick actions</h2>
              <p className="text-sm text-muted-foreground">Moderate listings and manage users from the tabs above</p>
            </CardHeader>
            <CardContent className="p-6">
              <div className="flex flex-wrap gap-3">
                <Button size="sm" className="bg-accent-500 hover:bg-accent-600" onClick={() => setTab('listings')}>Review pending listings</Button>
                <Button size="sm" variant="outline" onClick={() => setTab('users')}>Manage users</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {tab === 'listings' && (
        <Card className="mt-6 border-primary-200">
          <CardHeader className="border-b border-primary-100 bg-primary-50/50">
            <div className="flex items-center gap-2">
              <FileCheck className="h-5 w-5 text-accent-500" />
              <h2 className="font-semibold text-primary-800">Pending listings</h2>
            </div>
            <p className="text-sm text-muted-foreground">Approve or reject new homestay listings</p>
          </CardHeader>
          <CardContent className="p-6">
            {pendingListings.length === 0 ? (
              <p className="text-muted-foreground">No pending listings.</p>
            ) : (
              <div className="space-y-4">
                {pendingListings.map((l) => (
                  <div key={l.id} className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-primary-200 p-4">
                    <div>
                      <p className="font-medium text-primary-800">{l.title}</p>
                      <p className="text-sm text-muted-foreground">ID: {l.id}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" className="bg-accent-500 hover:bg-accent-600" onClick={() => handleApprove(l.id)}>Approve</Button>
                      <Button size="sm" variant="destructive" onClick={() => handleReject(l.id)}>Reject</Button>
                      <Button variant="outline" size="sm" asChild>
                        <Link to={`/listings/${l.id}`}>View</Link>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {tab === 'users' && (
        <Card className="mt-6 border-primary-200">
          <CardHeader className="border-b border-primary-100 bg-primary-50/50">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary-600" />
              <h2 className="font-semibold text-primary-800">Users</h2>
            </div>
            <p className="text-sm text-muted-foreground">Change user roles</p>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-primary-200 bg-primary-50/50">
                    <th className="p-3 text-left text-sm font-medium text-primary-800">ID</th>
                    <th className="p-3 text-left text-sm font-medium text-primary-800">Name</th>
                    <th className="p-3 text-left text-sm font-medium text-primary-800">Email</th>
                    <th className="p-3 text-left text-sm font-medium text-primary-800">Role</th>
                    <th className="p-3 text-left text-sm font-medium text-primary-800">Change role</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id} className="border-b border-primary-100">
                      <td className="p-3 text-sm">{u.id}</td>
                      <td className="p-3 font-medium text-primary-800">{u.name}</td>
                      <td className="p-3 text-sm text-muted-foreground">{u.email}</td>
                      <td className="p-3">
                        <span className={`rounded-full px-2 py-1 text-xs font-medium ${u.role === 'admin' ? 'bg-accent-100 text-accent-800' : u.role === 'host' ? 'bg-primary-100 text-primary-800' : 'bg-secondary-200 text-secondary-800'}`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="p-3">
                        <select
                          value={u.role}
                          onChange={(e) => handleRoleChange(u.id, e.target.value)}
                          className="rounded-md border border-primary-200 bg-background px-2 py-1.5 text-sm"
                        >
                          <option value="guest">guest</option>
                          <option value="host">host</option>
                          <option value="admin">admin</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {tab === 'bookings' && (
        <Card className="mt-6 border-primary-200">
          <CardHeader className="border-b border-primary-100 bg-primary-50/50">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-accent-500" />
                  <h2 className="font-semibold text-primary-800">Booking oversight</h2>
                </div>
                <p className="text-sm text-muted-foreground">View all bookings ({adminBookingsTotal} total)</p>
              </div>
              <select
                value={adminBookingsStatus}
                onChange={(e) => setAdminBookingsStatus(e.target.value)}
                className="rounded-md border border-primary-200 bg-background px-3 py-2 text-sm"
              >
                <option value="">All statuses</option>
                <option value="pending">Pending</option>
                <option value="pending_payment">Pending payment</option>
                <option value="approved">Approved</option>
                <option value="paid">Paid</option>
                <option value="completed">Completed</option>
                <option value="declined">Declined</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              {adminBookings.length === 0 ? (
                <p className="p-8 text-center text-muted-foreground">No bookings found.</p>
              ) : (
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b border-primary-200 bg-primary-50/50">
                      <th className="p-3 text-left text-sm font-medium text-primary-800">ID</th>
                      <th className="p-3 text-left text-sm font-medium text-primary-800">Listing</th>
                      <th className="p-3 text-left text-sm font-medium text-primary-800">Guest</th>
                      <th className="p-3 text-left text-sm font-medium text-primary-800">Dates</th>
                      <th className="p-3 text-left text-sm font-medium text-primary-800">Status</th>
                      <th className="p-3 text-left text-sm font-medium text-primary-800">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {adminBookings.map((b) => (
                      <tr key={b.id} className="border-b border-primary-100">
                        <td className="p-3 text-sm">{b.id}</td>
                        <td className="p-3 font-medium text-primary-800">{b.listing_title}</td>
                        <td className="p-3 text-sm">{b.guest_name}</td>
                        <td className="p-3 text-sm text-muted-foreground">{formatDateOnly(b.check_in)} – {formatDateOnly(b.check_out)}</td>
                        <td className="p-3">
                          <span className={`rounded-full px-2 py-1 text-xs font-medium ${bookingStatusColor(b.status)}`}>{b.status}</span>
                        </td>
                        <td className="p-3">
                          <Button variant="outline" size="sm" onClick={() => setSelectedBooking(b)}>View booking details</Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {tab === 'payments' && (
        <Card className="mt-6 border-primary-200">
          <CardHeader className="border-b border-primary-100 bg-primary-50/50">
            <div className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-accent-500" />
              <h2 className="font-semibold text-primary-800">Payment management</h2>
            </div>
            <p className="text-sm text-muted-foreground">Track payments and reconciliation ({adminPaymentsTotal} total)</p>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              {adminPayments.length === 0 ? (
                <p className="p-8 text-center text-muted-foreground">No payments yet.</p>
              ) : (
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b border-primary-200 bg-primary-50/50">
                      <th className="p-3 text-left text-sm font-medium text-primary-800">ID</th>
                      <th className="p-3 text-left text-sm font-medium text-primary-800">Booking</th>
                      <th className="p-3 text-left text-sm font-medium text-primary-800">Listing</th>
                      <th className="p-3 text-left text-sm font-medium text-primary-800">Guest</th>
                      <th className="p-3 text-left text-sm font-medium text-primary-800">Amount</th>
                      <th className="p-3 text-left text-sm font-medium text-primary-800">Status</th>
                      <th className="p-3 text-left text-sm font-medium text-primary-800">Date</th>
                      <th className="p-3 text-left text-sm font-medium text-primary-800">Receipt</th>
                    </tr>
                  </thead>
                  <tbody>
                    {adminPayments.map((p) => (
                      <tr key={p.id} className="border-b border-primary-100">
                        <td className="p-3 text-sm">{p.id}</td>
                        <td className="p-3 text-sm">{p.booking_id}</td>
                        <td className="p-3 font-medium text-primary-800">{p.listing_title}</td>
                        <td className="p-3 text-sm">{p.guest_name}</td>
                        <td className="p-3 font-medium text-accent-600">NPR {Number(p.amount).toLocaleString()}</td>
                        <td className="p-3">
                          <span className={`rounded-full px-2 py-1 text-xs font-medium ${p.status === 'succeeded' ? 'bg-green-100 text-green-800' : 'bg-secondary-200 text-secondary-800'}`}>{p.status}</span>
                        </td>
                        <td className="p-3 text-sm text-muted-foreground">{formatDateOnly(p.created_at)}</td>
                        <td className="p-3">
                          <Button variant="outline" size="sm" onClick={() => setSelectedPayment(p)}>View transaction receipt</Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {tab === 'reports' && (
        <Card className="mt-6 border-primary-200">
          <CardHeader className="border-b border-primary-100 bg-primary-50/50">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-accent-500" />
              <h2 className="font-semibold text-primary-800">Reports & analytics</h2>
            </div>
            <p className="text-sm text-muted-foreground">Booking and payment details</p>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              {adminBookings.length === 0 ? (
                <p className="p-8 text-center text-muted-foreground">No booking records. Switch to Bookings tab to load data, or data will load when you open Reports.</p>
              ) : (
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b border-primary-200 bg-primary-50/50">
                      <th className="p-3 text-left text-sm font-medium text-primary-800">Booking ID</th>
                      <th className="p-3 text-left text-sm font-medium text-primary-800">Listing</th>
                      <th className="p-3 text-left text-sm font-medium text-primary-800">Guest</th>
                      <th className="p-3 text-left text-sm font-medium text-primary-800">Check-in</th>
                      <th className="p-3 text-left text-sm font-medium text-primary-800">Check-out</th>
                      <th className="p-3 text-left text-sm font-medium text-primary-800">Guests</th>
                      <th className="p-3 text-left text-sm font-medium text-primary-800">Status</th>
                      <th className="p-3 text-left text-sm font-medium text-primary-800">Created</th>
                    </tr>
                  </thead>
                  <tbody>
                    {adminBookings.map((b) => (
                      <tr key={b.id} className="border-b border-primary-100">
                        <td className="p-3 text-sm font-medium text-primary-800">{b.id}</td>
                        <td className="p-3 text-sm">{b.listing_title}</td>
                        <td className="p-3 text-sm">{b.guest_name}</td>
                        <td className="p-3 text-sm text-muted-foreground">{formatDateOnly(b.check_in)}</td>
                        <td className="p-3 text-sm text-muted-foreground">{formatDateOnly(b.check_out)}</td>
                        <td className="p-3 text-sm">{b.guests}</td>
                        <td className="p-3">
                          <span className={`rounded-full px-2 py-1 text-xs font-medium ${bookingStatusColor(b.status)}`}>{b.status}</span>
                        </td>
                        <td className="p-3 text-sm text-muted-foreground">{formatDateOnly(b.created_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
            <p className="p-4 text-sm text-muted-foreground border-t border-primary-100">Payment amounts and transaction receipts are in the Payments tab.</p>
          </CardContent>
        </Card>
      )}

      {tab === 'content' && (
        <div className="mt-6 space-y-6">
          <Card className="border-primary-200">
            <CardHeader className="border-b border-primary-100 bg-primary-50/50">
              <div className="flex items-center gap-2">
                <Youtube className="h-5 w-5 text-accent-500" />
                <h2 className="font-semibold text-primary-800">Landing page video</h2>
              </div>
              <p className="text-sm text-muted-foreground">YouTube video URL shown on the homepage. Leave empty to hide the video section.</p>
            </CardHeader>
            <CardContent className="p-6">
              <form onSubmit={handleSaveLandingYoutube} className="space-y-4 max-w-xl">
                <div>
                  <label htmlFor="landing-youtube" className="block text-sm font-medium text-primary-800">YouTube video URL</label>
                  <input
                    id="landing-youtube"
                    type="url"
                    value={landingYoutubeUrl}
                    onChange={(e) => setLandingYoutubeUrl(e.target.value)}
                    placeholder="https://www.youtube.com/watch?v=..."
                    className="mt-1 w-full rounded-md border border-primary-200 bg-background px-3 py-2 text-sm"
                  />
                </div>
                <Button type="submit" size="sm" className="bg-accent-500 hover:bg-accent-600" disabled={landingYoutubeSaving}>
                  {landingYoutubeSaving ? 'Saving…' : 'Save'}
                </Button>
              </form>
            </CardContent>
          </Card>
          <Card className="border-primary-200">
            <CardHeader className="border-b border-primary-100 bg-primary-50/50">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-accent-500" />
                <h2 className="font-semibold text-primary-800">Static content</h2>
              </div>
              <p className="text-sm text-muted-foreground">Static pages, FAQs, and blog can be added here later.</p>
            </CardHeader>
            <CardContent className="p-8 text-center text-muted-foreground">
              CMS for static pages and FAQs will appear here.
            </CardContent>
          </Card>
        </div>
      )}

      {tab === 'settings' && (
        <div className="mt-6 space-y-6">
          <Card className="border-primary-200">
            <CardHeader className="border-b border-primary-100 bg-primary-50/50">
              <div className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-accent-500" />
                <h2 className="font-semibold text-primary-800">Booking fee (service charge or discount)</h2>
              </div>
              <p className="text-sm text-muted-foreground">Add a service charge (e.g. 5%) or discount (e.g. 10% or fixed amount) applied to all bookings. Leave value empty to have no fee.</p>
            </CardHeader>
            <CardContent className="p-6">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const value = bookingFeeForm.value.trim();
                  setBookingFeeSaving(true);
                  const payload = value === '' || isNaN(Number(value)) || Number(value) < 0
                    ? null
                    : { type: bookingFeeForm.type, kind: bookingFeeForm.kind, value: Number(value) };
                  api.patch('/api/admin/settings', { booking_fee: payload })
                    .then((res) => {
                      setBookingFee(res.data.booking_fee ?? null);
                      setBookingFeeForm(res.data.booking_fee ? { type: res.data.booking_fee.type, kind: res.data.booking_fee.kind, value: String(res.data.booking_fee.value) } : { type: 'service_charge', kind: 'percent', value: '' });
                      toast({ title: 'Booking fee saved.' });
                    })
                    .catch(() => toast({ title: 'Failed to save.', variant: 'destructive' }))
                    .finally(() => setBookingFeeSaving(false));
                }}
                className="max-w-md space-y-4"
              >
                <div>
                  <label className="mb-1 block text-sm font-medium text-primary-800">Type</label>
                  <select
                    value={bookingFeeForm.type}
                    onChange={(e) => setBookingFeeForm((f) => ({ ...f, type: e.target.value as 'service_charge' | 'discount' }))}
                    className="flex h-9 w-full rounded-md border border-primary-200 bg-background px-3 py-1 text-sm"
                  >
                    <option value="service_charge">Service charge (add to total)</option>
                    <option value="discount">Discount (subtract from total)</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-primary-800">Kind</label>
                  <select
                    value={bookingFeeForm.kind}
                    onChange={(e) => setBookingFeeForm((f) => ({ ...f, kind: e.target.value as 'percent' | 'fixed' }))}
                    className="flex h-9 w-full rounded-md border border-primary-200 bg-background px-3 py-1 text-sm"
                  >
                    <option value="percent">Percent (%)</option>
                    <option value="fixed">Fixed amount (NPR)</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-primary-800">Value</label>
                  <input
                    type={bookingFeeForm.kind === 'percent' ? 'number' : 'number'}
                    min={0}
                    step={bookingFeeForm.kind === 'percent' ? 0.5 : 1}
                    value={bookingFeeForm.value}
                    onChange={(e) => setBookingFeeForm((f) => ({ ...f, value: e.target.value }))}
                    placeholder={bookingFeeForm.kind === 'percent' ? 'e.g. 5' : 'e.g. 50'}
                    className="flex h-9 w-full rounded-md border border-primary-200 bg-background px-3 py-1 text-sm"
                  />
                  <p className="mt-1 text-xs text-muted-foreground">
                    {bookingFeeForm.kind === 'percent' ? 'Percentage of subtotal (e.g. 5 for 5%).' : 'Fixed amount in NPR.'} Leave empty for no fee.
                  </p>
                </div>
                <Button type="submit" disabled={bookingFeeSaving} className="bg-accent-500 hover:bg-accent-600">
                  {bookingFeeSaving ? 'Saving…' : 'Save booking fee'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Booking details dialog */}
      <Dialog.Root open={!!selectedBooking} onOpenChange={(open) => !open && setSelectedBooking(null)}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50" />
          <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-lg border border-primary-200 bg-background p-6 shadow-lg">
            {selectedBooking && (
              <>
                <div className="flex items-center justify-between border-b border-primary-100 pb-3">
                  <Dialog.Title className="font-semibold text-primary-800">Booking details</Dialog.Title>
                  <Dialog.Close asChild>
                    <button type="button" className="rounded p-1 hover:bg-primary-100" aria-label="Close">
                      <X className="h-5 w-5" />
                    </button>
                  </Dialog.Close>
                </div>
                <dl className="mt-4 space-y-2 text-sm">
                  <div><dt className="font-medium text-muted-foreground">Booking ID</dt><dd className="font-medium text-primary-800">{selectedBooking.id}</dd></div>
                  <div><dt className="font-medium text-muted-foreground">Listing</dt><dd className="text-primary-800">{selectedBooking.listing_title}</dd></div>
                  <div><dt className="font-medium text-muted-foreground">Guest</dt><dd className="text-primary-800">{selectedBooking.guest_name} ({selectedBooking.guest_email})</dd></div>
                  <div><dt className="font-medium text-muted-foreground">Check-in</dt><dd className="text-primary-800">{formatDateOnly(selectedBooking.check_in)}</dd></div>
                  <div><dt className="font-medium text-muted-foreground">Check-out</dt><dd className="text-primary-800">{formatDateOnly(selectedBooking.check_out)}</dd></div>
                  <div><dt className="font-medium text-muted-foreground">Guests</dt><dd className="text-primary-800">{selectedBooking.guests}</dd></div>
                  <div><dt className="font-medium text-muted-foreground">Status</dt><dd><span className={`rounded-full px-2 py-1 text-xs font-medium ${bookingStatusColor(selectedBooking.status)}`}>{selectedBooking.status}</span></dd></div>
                  <div><dt className="font-medium text-muted-foreground">Created</dt><dd className="text-primary-800">{formatDateOnly(selectedBooking.created_at)}</dd></div>
                </dl>
                <div className="mt-4 flex justify-end">
                  <Button variant="outline" size="sm" asChild>
                    <Link to={`/listings/${selectedBooking.listing_id}`} onClick={() => setSelectedBooking(null)}>View listing</Link>
                  </Button>
                </div>
              </>
            )}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* Transaction receipt dialog */}
      <Dialog.Root open={!!selectedPayment} onOpenChange={(open) => !open && setSelectedPayment(null)}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50" />
          <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-lg border border-primary-200 bg-background p-6 shadow-lg">
            {selectedPayment && (() => {
              const p = selectedPayment;
              const downloadReceiptPdf = () => {
                const doc = new jsPDF();
                doc.setFontSize(18);
                doc.text('Transaction Receipt', 20, 20);
                doc.setFontSize(11);
                let y = 36;
                doc.text(`Payment ID: ${p.id}`, 20, y); y += 8;
                doc.text(`Booking ID: ${p.booking_id}`, 20, y); y += 8;
                doc.text(`Listing: ${p.listing_title}`, 20, y); y += 8;
                doc.text(`Guest: ${p.guest_name}`, 20, y); y += 8;
                doc.text(`Amount: NPR ${Number(p.amount).toLocaleString()}`, 20, y); y += 8;
                doc.text(`Status: ${p.status}`, 20, y); y += 8;
                doc.text(`Date: ${formatDateOnly(p.created_at)}`, 20, y);
                doc.save(`receipt-${p.id}.pdf`);
                toast({ title: 'Receipt downloaded.' });
              };
              return (
                <>
                  <div className="flex items-center justify-between border-b border-primary-100 pb-3">
                    <Dialog.Title className="font-semibold text-primary-800">Transaction receipt</Dialog.Title>
                    <Dialog.Close asChild>
                      <button type="button" className="rounded p-1 hover:bg-primary-100" aria-label="Close">
                        <X className="h-5 w-5" />
                      </button>
                    </Dialog.Close>
                  </div>
                  <dl className="mt-4 space-y-2 text-sm">
                    <div><dt className="font-medium text-muted-foreground">Payment ID</dt><dd className="font-medium text-primary-800">{p.id}</dd></div>
                    <div><dt className="font-medium text-muted-foreground">Booking ID</dt><dd className="text-primary-800">{p.booking_id}</dd></div>
                    <div><dt className="font-medium text-muted-foreground">Listing</dt><dd className="text-primary-800">{p.listing_title}</dd></div>
                    <div><dt className="font-medium text-muted-foreground">Guest</dt><dd className="text-primary-800">{p.guest_name}</dd></div>
                    <div><dt className="font-medium text-muted-foreground">Amount</dt><dd className="font-semibold text-accent-600">NPR {Number(p.amount).toLocaleString()}</dd></div>
                    <div><dt className="font-medium text-muted-foreground">Status</dt><dd className="text-primary-800">{p.status}</dd></div>
                    <div><dt className="font-medium text-muted-foreground">Date</dt><dd className="text-primary-800">{formatDateOnly(p.created_at)}</dd></div>
                  </dl>
                  <div className="mt-6 flex gap-2 justify-end">
                    <Button variant="outline" size="sm" onClick={downloadReceiptPdf}>
                      <Download className="mr-1.5 h-4 w-4" />
                      Download PDF
                    </Button>
                    <Dialog.Close asChild>
                      <Button size="sm">Close</Button>
                    </Dialog.Close>
                  </div>
                </>
              );
            })()}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
