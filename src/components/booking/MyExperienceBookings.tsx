import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Clock, Users, MapPin } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { api } from '@/lib/api';
import { useCurrency } from '@/lib/currency';

interface ExperienceBooking {
  id: number;
  listing_id: number;
  experience_id: number;
  experience_name: string;
  experience_time: string | null;
  date: string;
  participants: number;
  status: string;
  total_amount: string | number | null;
  amount_paid: string | number | null;
  listing_title: string | null;
  listing_location: string | null;
  category_name: string | null;
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

/**
 * Experience bookings, listed apart from stays.
 *
 * They are a different kind of thing — one day, a head count, no nights — and
 * folding them into the stays list would mean every row there carrying columns
 * that are blank for most of them.
 */
export function MyExperienceBookings() {
  const { format: formatPrice } = useCurrency();
  const [bookings, setBookings] = useState<ExperienceBooking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<{ bookings: ExperienceBooking[] }>('/api/experiences/bookings/mine')
      .then((res) => setBookings(res.data?.bookings ?? []))
      .catch(() => setBookings([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-sm text-muted-foreground">Loading your experiences…</p>;

  // Nothing at all is not worth a placeholder card in a tab that already has
  // stays in it — it would read as something being broken.
  if (bookings.length === 0) return null;

  return (
    <section className="mt-8">
      <h2 className="mb-1 font-semibold text-primary-800">Experiences</h2>
      <p className="mb-3 text-sm text-muted-foreground">Things you have booked without an overnight stay.</p>

      <div className="space-y-3">
        {bookings.map((b) => (
          <Card key={b.id}>
            <CardContent className="flex flex-wrap items-start justify-between gap-4 p-4">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <Link to={`/things-to-do/${b.experience_id}`} className="font-semibold hover:underline">
                    {b.experience_name}
                  </Link>
                  {b.category_name && (
                    <span className="rounded-full bg-accent-100 px-2 py-0.5 text-xs text-accent-800">
                      {b.category_name}
                    </span>
                  )}
                </div>

                <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                  <MapPin className="h-3.5 w-3.5 shrink-0" />
                  <Link to={`/listings/${b.listing_id}`} className="truncate hover:underline">
                    {b.listing_title || b.listing_location}
                  </Link>
                </p>

                <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5" />
                    {new Date(b.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                    {b.experience_time && ` · ${b.experience_time}`}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Users className="h-3.5 w-3.5" />
                    {b.participants} {b.participants === 1 ? 'person' : 'people'}
                  </span>
                </div>
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
    </section>
  );
}
