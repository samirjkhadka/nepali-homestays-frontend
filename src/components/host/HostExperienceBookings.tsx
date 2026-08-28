import { useEffect, useMemo, useState } from 'react';
import { Users, Calendar } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { api } from '@/lib/api';
import { useCurrency } from '@/lib/currency';

interface HostExperienceBooking {
  id: number;
  experience_id: number;
  experience_name: string;
  experience_time: string | null;
  date: string;
  participants: number;
  status: string;
  total_amount: string | number | null;
  guest_name: string | null;
  guest_email: string | null;
  listing_title: string | null;
}

function statusBadgeClass(status: string): string {
  switch (status) {
    case 'pending_payment':
    case 'partial_paid':
      return 'bg-amber-100 text-amber-800';
    case 'paid':
    case 'completed':
      return 'bg-primary-100 text-primary-800';
    case 'approved':
      return 'bg-accent-100 text-accent-800';
    case 'no_show':
      return 'bg-orange-100 text-orange-800';
    case 'cancelled':
    case 'declined':
      return 'bg-destructive/10 text-destructive';
    default:
      return 'bg-primary-100 text-primary-700';
  }
}

function formatLabel(s: string): string {
  if (s === 'pending_payment') return 'Awaiting payment';
  if (s === 'partial_paid') return 'Partly paid';
  if (s === 'no_show') return 'Did not attend';
  return s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function todayIso(): string {
  return new Date(Date.now() + 5.75 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

/**
 * Who is coming, and when.
 *
 * Grouped by day rather than listed flat: a host preparing for Saturday needs to
 * know how many people are arriving that morning, which a chronological list of
 * individual bookings does not answer without mental arithmetic.
 */
export function HostExperienceBookings() {
  const { format: formatPrice } = useCurrency();
  const [bookings, setBookings] = useState<HostExperienceBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPast, setShowPast] = useState(false);

  useEffect(() => {
    api
      .get<{ bookings: HostExperienceBooking[] }>('/api/experiences/bookings/hosting')
      .then((res) => setBookings(res.data?.bookings ?? []))
      .catch(() => setBookings([]))
      .finally(() => setLoading(false));
  }, []);

  const today = todayIso();

  const grouped = useMemo(() => {
    const live = bookings.filter((b) => b.status !== 'cancelled');
    const inScope = showPast ? live : live.filter((b) => b.date.slice(0, 10) >= today);
    const byDay = new Map<string, HostExperienceBooking[]>();
    for (const b of inScope) {
      const day = b.date.slice(0, 10);
      byDay.set(day, [...(byDay.get(day) ?? []), b]);
    }
    return [...byDay.entries()].sort((a, b) => (showPast ? b[0].localeCompare(a[0]) : a[0].localeCompare(b[0])));
  }, [bookings, showPast, today]);

  if (loading) return <p className="text-sm text-muted-foreground">Loading…</p>;

  return (
    <div className="mt-6 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-semibold text-primary-800">Experience bookings</h2>
          <p className="text-sm text-muted-foreground">People coming for an activity, without staying the night.</p>
        </div>
        <label className="flex cursor-pointer items-center gap-2 text-sm">
          <input type="checkbox" checked={showPast} onChange={(e) => setShowPast(e.target.checked)} />
          Include past dates
        </label>
      </div>

      {grouped.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="font-medium">Nobody booked yet</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Experiences only reach day visitors once you tick “day visitors can book this” on the listing.
            </p>
          </CardContent>
        </Card>
      ) : (
        grouped.map(([day, dayBookings]) => {
          const heads = dayBookings.reduce((n, b) => n + b.participants, 0);
          return (
            <div key={day}>
              <div className="mb-2 flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-accent-500" />
                <span className="font-medium text-primary-800">
                  {new Date(day + 'T12:00:00').toLocaleDateString('en-GB', {
                    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
                  })}
                </span>
                <span className="text-muted-foreground">
                  · {heads} {heads === 1 ? 'person' : 'people'} across{' '}
                  {dayBookings.length} {dayBookings.length === 1 ? 'booking' : 'bookings'}
                </span>
              </div>

              <div className="space-y-2">
                {dayBookings.map((b) => (
                  <Card key={b.id}>
                    <CardContent className="flex flex-wrap items-start justify-between gap-4 p-4">
                      <div className="min-w-0">
                        <p className="font-medium">{b.experience_name}</p>
                        <p className="mt-0.5 text-sm text-muted-foreground">
                          {b.guest_name || 'Guest'}
                          {b.guest_email && <span className="ml-1">· {b.guest_email}</span>}
                        </p>
                        <p className="mt-1 flex flex-wrap items-center gap-x-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1.5">
                            <Users className="h-3.5 w-3.5" />
                            {b.participants} {b.participants === 1 ? 'person' : 'people'}
                          </span>
                          {b.experience_time && <span>{b.experience_time}</span>}
                          {b.listing_title && <span className="truncate">{b.listing_title}</span>}
                        </p>
                      </div>
                      <div className="shrink-0 text-right">
                        <Badge className={statusBadgeClass(b.status)}>{formatLabel(b.status)}</Badge>
                        {b.total_amount != null && (
                          <p className="mt-2 font-semibold tabular-nums">{formatPrice(String(b.total_amount))}</p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
