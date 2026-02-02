import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CreditCard, Heart, Star } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { api } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { useCurrency } from '@/lib/currency';

type Booking = {
  id: number;
  listing_id: number;
  listing_title: string;
  listing_location: string;
  listing_price?: string;
  check_in: string;
  check_out: string;
  status: string;
};

type Profile = {
  name: string;
  email: string;
  phone: string | null;
  bio: string | null;
};

const GUEST_TABS = ['profile', 'bookings', 'wishlist', 'messages', 'payment-history'] as const;
type GuestTabType = (typeof GUEST_TABS)[number];

const BOOKING_STATUSES = ['all', 'upcoming', 'pending', 'pending_payment', 'approved', 'paid', 'completed', 'declined', 'cancelled'] as const;

function formatBookingDateRange(checkIn: string, checkOut: string): string {
  const fmt = (d: string) => {
    const date = new Date(d);
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  };
  return `${fmt(checkIn)} – ${fmt(checkOut)}`;
}

function statusBadgeClass(status: string): string {
  switch (status) {
    case 'pending_payment':
      return 'bg-amber-100 text-amber-800';
    case 'paid':
    case 'completed':
      return 'bg-primary-100 text-primary-800';
    case 'approved':
      return 'bg-accent-100 text-accent-800';
    case 'declined':
    case 'cancelled':
      return 'bg-destructive/10 text-destructive';
    default:
      return 'bg-primary-100 text-primary-700';
  }
}

export default function GuestDashboard() {
  const { toast } = useToast();
  const { format: formatPrice } = useCurrency();
  const [searchParams, setSearchParams] = useSearchParams();
  const tabFromUrl = searchParams.get('tab') as GuestTabType | null;
  const [tab, setTab] = useState<GuestTabType>(GUEST_TABS.includes(tabFromUrl as GuestTabType) ? tabFromUrl! : 'profile');
  const [profile, setProfile] = useState<Profile | null>(null);
  const [form, setForm] = useState({ name: '', phone: '', bio: '' });
  const [saving, setSaving] = useState(false);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [favorites, setFavorites] = useState<{ id: number; listing_id: number; listing_title: string; listing_location: string; image_url?: string | null }[]>([]);
  const [conversations, setConversations] = useState<{ booking_id: number; listing_title: string; other_name: string; other_user_id: number; last_message: string | null; last_message_at: string | null; unread_count: number }[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<{ booking_id: number; other_user_id: number; listing_title: string; other_name: string } | null>(null);
  const [threadMessages, setThreadMessages] = useState<{ id: number; sender_id: number; message: string; sender_name: string; created_at: string }[]>([]);
  const [messageText, setMessageText] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    const t = searchParams.get('tab') as GuestTabType | null;
    if (t && GUEST_TABS.includes(t)) setTab(t);
  }, [searchParams]);

  useEffect(() => {
    if (searchParams.get('payment') === 'success') {
      toast({ title: 'Payment successful! Your booking is confirmed.' });
      setSearchParams((p) => { p.delete('payment'); p.set('tab', 'bookings'); return p; }, { replace: true });
      setTab('bookings');
      api.get<{ bookings: Booking[] }>('/api/bookings').then((res) => setBookings(res.data.bookings || []));
    }
    if (searchParams.get('payment') === 'failed') {
      toast({ title: 'Payment was not completed.', variant: 'destructive' });
      setSearchParams((p) => { p.delete('payment'); return p; }, { replace: true });
    }
  }, [searchParams, setSearchParams, toast]);

  useEffect(() => {
    api.get<Profile>('/api/profile').then((res) => {
      setProfile(res.data);
      setForm({ name: res.data.name, phone: res.data.phone || '', bio: res.data.bio || '' });
    }).catch(() => setProfile(null));
    api.get<{ bookings: Booking[] }>('/api/bookings').then((res) => setBookings(res.data.bookings || [])).catch(() => setBookings([]));
    api.get<{ favorites?: { id: number; listing_id: number; listing_title: string; listing_location: string; image_url?: string | null }[] }>('/api/favorites').then((res) => setFavorites(res.data.favorites || [])).catch(() => setFavorites([]));
  }, []);

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

  const handleRemoveFavorite = (listingId: number) => {
    api.delete(`/api/favorites/${listingId}`).then(() => {
      setFavorites((prev) => prev.filter((f) => f.listing_id !== listingId));
      toast({ title: 'Removed from wishlist.' });
    }).catch(() => toast({ title: 'Failed to remove.', variant: 'destructive' }));
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    api.patch('/api/profile', form).then(() => {
      toast({ title: 'Profile updated.' });
      setProfile((p) => p ? { ...p, ...form } : null);
    }).catch(() => toast({ title: 'Failed to update.', variant: 'destructive' })).finally(() => setSaving(false));
  };

  const filteredBookings =
    statusFilter === 'all'
      ? bookings
      : statusFilter === 'upcoming'
        ? bookings.filter((b) => ['pending', 'pending_payment', 'approved', 'paid'].includes(b.status))
        : bookings.filter((b) => b.status === statusFilter);
  const upcomingCount = bookings.filter((b) => ['pending', 'pending_payment', 'approved', 'paid'].includes(b.status)).length;
  const paidBookings = bookings.filter((b) => b.status === 'paid' || b.status === 'completed');

  return (
    <div>
      <h1 className="text-3xl font-bold text-primary-800">My dashboard</h1>
      <p className="mt-1 text-muted-foreground">Manage your profile and bookings</p>
      <div className="mt-6 flex flex-wrap gap-2 border-b border-primary-200">
        {GUEST_TABS.map((t) => (
          <button
            key={t}
            type="button"
            className={`px-4 py-2 font-medium transition-colors capitalize ${tab === t ? 'border-b-2 border-accent-500 text-accent-600' : 'text-muted-foreground hover:text-primary-700'}`}
            onClick={() => {
              setTab(t);
              setSearchParams((p) => { p.set('tab', t); return p; }, { replace: true });
            }}
          >
            {t === 'payment-history' ? 'Payment history' : t}
          </button>
        ))}
      </div>

      {tab === 'profile' && (
        <Card className="mt-6 max-w-xl border-primary-200">
          <CardHeader className="border-b border-primary-100 bg-primary-50/50">
            <h2 className="font-semibold text-primary-800">Profile</h2>
            <p className="text-sm text-muted-foreground">{profile ? `Signed in as ${profile.email}` : 'Update your personal information'}</p>
          </CardHeader>
          <CardContent className="p-6">
            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div>
                <Label className="text-primary-800">Name</Label>
                <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className="mt-1 border-primary-200" />
              </div>
              <div>
                <Label className="text-primary-800">Phone</Label>
                <Input value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} className="mt-1 border-primary-200" />
              </div>
              <div>
                <Label className="text-primary-800">Bio</Label>
                <Textarea value={form.bio} onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))} className="mt-1 border-primary-200" rows={3} />
              </div>
              <Button type="submit" disabled={saving} className="bg-accent-500 hover:bg-accent-600">
                {saving ? 'Saving…' : 'Save'}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {tab === 'bookings' && (
        <div className="mt-6 space-y-6">
          <div className="flex flex-wrap gap-4">
            <Card className={`border-primary-200 ${statusFilter === 'all' ? 'ring-2 ring-accent-400' : ''}`}>
              <button type="button" className="block w-full text-left p-4" onClick={() => setStatusFilter('all')}>
                <p className="text-2xl font-bold text-primary-800">{bookings.length}</p>
                <p className="text-sm text-muted-foreground">Total bookings</p>
              </button>
            </Card>
            <Card className={`border-primary-200 ${statusFilter === 'upcoming' ? 'ring-2 ring-accent-400' : ''}`}>
              <button type="button" className="block w-full text-left p-4" onClick={() => setStatusFilter('upcoming')}>
                <p className="text-2xl font-bold text-primary-800">{upcomingCount}</p>
                <p className="text-sm text-muted-foreground">Upcoming / active</p>
              </button>
            </Card>
          </div>
          <div>
            <Label className="text-primary-800">Filter by status</Label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="mt-1 flex h-9 w-full max-w-xs rounded-md border border-primary-200 bg-background px-3 py-1 text-sm"
            >
              {BOOKING_STATUSES.map((s) => (
                <option key={s} value={s}>{s === 'all' ? 'All' : s === 'upcoming' ? 'Upcoming / active' : s.replace(/_/g, ' ')}</option>
              ))}
            </select>
          </div>
          {filteredBookings.length === 0 ? (
            <p className="text-muted-foreground">{statusFilter === 'all' ? 'No bookings yet.' : statusFilter === 'upcoming' ? 'No upcoming or active bookings.' : `No ${statusFilter} bookings.`}</p>
          ) : (
            <div className="grid gap-4">
              {filteredBookings.map((b) => {
                const checkIn = new Date(b.check_in);
                const checkOut = new Date(b.check_out);
                const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (24 * 60 * 60 * 1000));
                const total = b.listing_price != null ? nights * parseFloat(b.listing_price) : 0;
                return (
                  <Card key={b.id} className="border-primary-200">
                    <CardContent className="p-4">
                      <div>
                        <p className="font-semibold text-primary-800">{b.listing_title}</p>
                        <p className="text-sm text-muted-foreground">{b.listing_location} · {formatBookingDateRange(b.check_in, b.check_out)}</p>
                        {nights > 0 && b.listing_price != null && (
                          <p className="mt-1 text-sm font-medium text-accent-600">
                            {nights} night{nights !== 1 ? 's' : ''} · Total: {formatPrice(String(total))}
                          </p>
                        )}
                        <Badge className={`mt-2 ${statusBadgeClass(b.status)}`}>
                          {b.status === 'pending_payment' ? 'Awaiting payment' : b.status}
                        </Badge>
                      </div>
                      <div className="mt-4 flex flex-wrap gap-2">
                        {b.status === 'pending_payment' && (
                          <Button
                            size="sm"
                            className="bg-accent-500 hover:bg-accent-600"
                            onClick={() => {
                              api.get<{ redirect_url?: string; redirect_form?: { action: string; method: string; fields: Record<string, string> } }>(`/api/bookings/${b.id}/resume-payment`).then((res) => {
                                if (res.data?.redirect_url) {
                                  window.location.href = res.data.redirect_url;
                                  return;
                                }
                                if (res.data?.redirect_form) {
                                  const form = document.createElement('form');
                                  form.method = res.data.redirect_form.method;
                                  form.action = res.data.redirect_form.action;
                                  Object.entries(res.data.redirect_form.fields).forEach(([name, value]) => {
                                    const input = document.createElement('input');
                                    input.type = 'hidden';
                                    input.name = name;
                                    input.value = value;
                                    form.appendChild(input);
                                  });
                                  document.body.appendChild(form);
                                  form.submit();
                                  return;
                                }
                                toast({ title: 'Could not resume payment.', variant: 'destructive' });
                              }).catch(() => toast({ title: 'Could not resume payment.', variant: 'destructive' }));
                            }}
                          >
                            <CreditCard className="mr-1 h-4 w-4" />
                            Complete payment
                          </Button>
                        )}
                        {b.status === 'approved' && (
                          <Button size="sm" className="bg-accent-500 hover:bg-accent-600" asChild>
                            <Link to={`/bookings/${b.id}/pay`}>
                              <CreditCard className="mr-1 h-4 w-4" />
                              Pay now
                            </Link>
                          </Button>
                        )}
                        {b.status === 'completed' && (
                          <Button size="sm" variant="outline" className="border-accent-300 text-accent-700" asChild>
                            <Link to={`/listings/${b.listing_id}?review=${b.id}`}>
                              <Star className="mr-1 h-4 w-4" />
                              Write review
                            </Link>
                          </Button>
                        )}
                        <Button variant="outline" size="sm" asChild>
                          <Link to={`/listings/${b.listing_id}`}>View listing</Link>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {tab === 'wishlist' && (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {favorites.length === 0 ? (
            <p className="text-muted-foreground col-span-full">No saved listings yet.</p>
          ) : (
            favorites.map((f) => (
              <Card key={f.id} className="border-primary-200 overflow-hidden">
                <CardContent className="p-0">
                  {f.image_url ? (
                    <img src={f.image_url.startsWith('http') ? f.image_url : (import.meta.env.VITE_API_URL || '') + f.image_url} alt="" className="h-40 w-full object-cover" />
                  ) : (
                    <div className="flex h-40 w-full items-center justify-center bg-primary-100">
                      <Heart className="h-12 w-12 text-primary-300" />
                    </div>
                  )}
                  <div className="p-4">
                    <p className="font-semibold text-primary-800">{f.listing_title}</p>
                    <p className="text-sm text-muted-foreground">{f.listing_location}</p>
                    <div className="mt-3 flex gap-2">
                      <Button size="sm" variant="outline" asChild>
                        <Link to={`/listings/${f.listing_id}`}>View</Link>
                      </Button>
                      <Button size="sm" variant="ghost" className="text-destructive" onClick={() => handleRemoveFavorite(f.listing_id)}>
                        Remove
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      {tab === 'messages' && (
        <div className="mt-6 grid gap-4 lg:grid-cols-3">
          <Card className="border-primary-200 lg:col-span-1">
            <CardHeader className="border-b border-primary-100">
              <h3 className="font-semibold text-primary-800">Conversations</h3>
            </CardHeader>
            <CardContent className="p-0">
              {conversations.length === 0 ? (
                <p className="p-4 text-sm text-muted-foreground">No conversations yet.</p>
              ) : (
                <ul className="divide-y divide-primary-100">
                  {conversations.map((c) => (
                    <li key={c.booking_id}>
                      <button
                        type="button"
                        className={`flex w-full flex-col items-start gap-1 p-4 text-left hover:bg-primary-50 ${selectedConversation?.booking_id === c.booking_id ? 'bg-accent-50' : ''}`}
                        onClick={() => setSelectedConversation({ booking_id: c.booking_id, other_user_id: c.other_user_id, listing_title: c.listing_title, other_name: c.other_name })}
                      >
                        <span className="font-medium text-primary-800">{c.other_name}</span>
                        <span className="text-sm text-muted-foreground">{c.listing_title}</span>
                        {c.unread_count > 0 && (
                          <Badge className="bg-accent-500 text-white">{c.unread_count}</Badge>
                        )}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
          <Card className="border-primary-200 lg:col-span-2">
            <CardHeader className="border-b border-primary-100">
              <h3 className="font-semibold text-primary-800">{selectedConversation ? selectedConversation.listing_title : 'Messages'}</h3>
              {selectedConversation && <p className="text-sm text-muted-foreground">With {selectedConversation.other_name}</p>}
            </CardHeader>
            <CardContent className="p-4">
              {!selectedConversation ? (
                <p className="text-muted-foreground">Select a conversation.</p>
              ) : (
                <>
                  <div className="mb-4 max-h-80 space-y-3 overflow-y-auto">
                    {threadMessages.map((m) => (
                      <div key={m.id} className={`rounded-lg p-3 ${m.sender_id === selectedConversation.other_user_id ? 'bg-primary-100 ml-0 mr-8' : 'bg-accent-100 ml-8 mr-0'}`}>
                        <p className="text-xs font-medium text-muted-foreground">{m.sender_name}</p>
                        <p className="text-primary-800">{m.message}</p>
                        <p className="text-xs text-muted-foreground mt-1">{new Date(m.created_at).toLocaleString()}</p>
                      </div>
                    ))}
                  </div>
                  <form onSubmit={handleSendMessage} className="flex gap-2">
                    <Input value={messageText} onChange={(e) => setMessageText(e.target.value)} placeholder="Type a message..." className="flex-1" />
                    <Button type="submit" disabled={sendingMessage || !messageText.trim()}>Send</Button>
                  </form>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {tab === 'payment-history' && (
        <div className="mt-6">
          {paidBookings.length === 0 ? (
            <p className="text-muted-foreground">No payment history yet.</p>
          ) : (
            <div className="space-y-4">
              {paidBookings.map((b) => {
                const checkIn = new Date(b.check_in);
                const checkOut = new Date(b.check_out);
                const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (24 * 60 * 60 * 1000));
                const total = b.listing_price != null ? nights * parseFloat(b.listing_price) : 0;
                return (
                  <Card key={b.id} className="border-primary-200">
                    <CardContent className="p-4 flex flex-wrap items-center justify-between gap-4">
                      <div>
                        <p className="font-semibold text-primary-800">{b.listing_title}</p>
                        <p className="text-sm text-muted-foreground">{formatBookingDateRange(b.check_in, b.check_out)}</p>
                        <p className="mt-1 text-sm font-medium text-accent-600">{formatPrice(String(total))}</p>
                        <Badge className="mt-2 bg-primary-100 text-primary-800">{b.status}</Badge>
                      </div>
                      <Button variant="outline" size="sm" asChild>
                        <Link to={`/listings/${b.listing_id}`}>View listing</Link>
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
