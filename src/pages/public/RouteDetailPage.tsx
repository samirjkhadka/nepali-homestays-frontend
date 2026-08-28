import { useCallback, useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Mountain, Check, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { SingleDatePicker } from '@/components/SingleDatePicker';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';
import { useCurrency } from '@/lib/currency';

interface Option {
  listing_id: number;
  title: string | null;
  location: string | null;
  price_per_night: string | number;
  max_guests: number;
  image_url: string | null;
  is_available: boolean;
  subtotal: string | number;
}

interface Stop {
  stop_id: number;
  day_number: number;
  village_name: string;
  altitude_m: number | null;
  nights: number;
  notes: string | null;
  check_in: string;
  check_out: string;
  options: Option[];
  any_available: boolean;
}

interface Plan {
  stops: Stop[];
  walkable: boolean;
  total_nights: number;
}

function nepalToday(): Date {
  const iso = new Date(Date.now() + 5.75 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function formatDay(iso: string): string {
  return new Date(iso + 'T12:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

/**
 * Planning and booking a whole trek.
 *
 * The dates come from the server, computed from each stop's night count, so an
 * acclimatisation stop shifts everything after it and the plan on screen is the
 * plan that gets booked. Doing that arithmetic here as well would eventually
 * disagree with the booking, which is the failure this design exists to avoid.
 */
export default function RouteDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const { format: formatPrice } = useCurrency();

  const [start, setStart] = useState('');
  const [guests, setGuests] = useState(2);
  const [plan, setPlan] = useState<Plan | null>(null);
  const [chosen, setChosen] = useState<Record<number, number>>({});
  const [loading, setLoading] = useState(false);
  const [booking, setBooking] = useState(false);

  const loadPlan = useCallback(() => {
    if (!id || !start) { setPlan(null); return; }
    setLoading(true);
    api
      .get<Plan>(`/api/routes/${id}/plan`, { params: { start, guests } })
      .then((res) => {
        const p = res.data;
        setPlan(p);
        // Pre-select the first available option for each night, so the page
        // opens on a workable plan rather than an empty form.
        const picks: Record<number, number> = {};
        for (const s of p.stops ?? []) {
          const first = s.options.find((o) => o.is_available);
          if (first) picks[s.day_number] = first.listing_id;
        }
        setChosen(picks);
      })
      .catch((err) => {
        setPlan(null);
        toast({ title: err.response?.data?.message || 'Could not plan that trek.', variant: 'destructive' });
      })
      .finally(() => setLoading(false));
  }, [id, start, guests, toast]);

  useEffect(loadPlan, [loadPlan]);

  const total = (plan?.stops ?? []).reduce((sum, s) => {
    const pick = s.options.find((o) => o.listing_id === chosen[s.day_number]);
    return sum + (pick ? Number(pick.subtotal) : 0);
  }, 0);

  const everyNightChosen = (plan?.stops ?? []).every((s) => chosen[s.day_number] != null);

  const book = () => {
    if (!user) {
      toast({ title: 'Sign in to book this trek.' });
      navigate('/login');
      return;
    }
    setBooking(true);
    api
      .post(`/api/routes/${id}/book`, {
        start,
        guests,
        nights: Object.entries(chosen).map(([day, listing_id]) => ({
          day_number: Number(day),
          listing_id,
        })),
      })
      .then((res) => {
        const d = res.data as { itinerary_id: number; nights_booked: number };
        toast({ title: `Trek reserved — ${d.nights_booked} nights booked.` });
        // Every night is an ordinary booking, so they already appear in the
        // guest's list. A dedicated itinerary page is worth having and is not
        // built yet; sending them somewhere real beats a dead link.
        navigate('/dashboard?tab=bookings');
      })
      .catch((err) =>
        // The server rolls the whole chain back on any failure, so nothing was
        // booked. Re-planning shows which village filled up.
        toast({
          title: err.response?.data?.message || 'Could not book that trek.',
          variant: 'destructive',
        }))
      .finally(() => { setBooking(false); loadPlan(); });
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <Link to="/treks" className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Treks
      </Link>

      <div className="grid gap-8 lg:grid-cols-[1fr_18rem]">
        <div>
          <h1 className="font-display text-3xl font-semibold text-foreground">Plan your trek</h1>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <Label>Start date</Label>
              <SingleDatePicker value={start} onChange={setStart} minDate={nepalToday()} className="mt-1" />
            </div>
            <div>
              <Label>How many walking</Label>
              <Input
                type="number" min={1} max={40} value={guests}
                onChange={(e) => setGuests(Math.max(1, Number(e.target.value) || 1))}
                className="mt-1"
              />
            </div>
          </div>

          {!start && (
            <p className="mt-6 text-muted-foreground">Choose a start date to see the nights.</p>
          )}

          {loading && <p className="mt-6 text-muted-foreground">Working out the route…</p>}

          {plan && !loading && (
            <>
              {!plan.walkable && (
                <p className="mt-6 flex items-start gap-2 rounded-md bg-destructive/5 p-3 text-sm text-destructive">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  One of the villages has nowhere free on those dates. Try starting a day or two later.
                </p>
              )}

              <ol className="mt-6 space-y-4">
                {plan.stops.map((s) => (
                  <li key={s.stop_id} className="border-l-2 border-primary-200 pl-4">
                    <div className="flex flex-wrap items-baseline gap-x-3">
                      <span className="font-semibold text-primary-800">
                        Night {s.day_number} · {s.village_name}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {formatDay(s.check_in)} – {formatDay(s.check_out)}
                        {s.nights > 1 && ` · ${s.nights} nights`}
                      </span>
                      {s.altitude_m && (
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Mountain className="h-3 w-3" />{s.altitude_m} m
                        </span>
                      )}
                    </div>

                    {s.notes && <p className="mt-0.5 text-sm text-muted-foreground">{s.notes}</p>}

                    <div className="mt-2 space-y-2">
                      {s.options.map((o) => {
                        const picked = chosen[s.day_number] === o.listing_id;
                        return (
                          <button
                            key={o.listing_id}
                            type="button"
                            disabled={!o.is_available}
                            onClick={() => setChosen((c) => ({ ...c, [s.day_number]: o.listing_id }))}
                            className={`flex w-full items-center justify-between gap-3 rounded-md border p-3 text-left transition-colors ${
                              picked ? 'border-primary bg-primary-50'
                                : o.is_available ? 'border-border hover:bg-muted'
                                : 'cursor-not-allowed border-dashed opacity-60'
                            }`}
                          >
                            <span className="min-w-0">
                              <span className="flex items-center gap-2 font-medium">
                                {picked && <Check className="h-4 w-4 shrink-0 text-primary" />}
                                {o.title}
                              </span>
                              {!o.is_available && (
                                <span className="mt-0.5 block text-sm text-muted-foreground">
                                  Full on those dates
                                </span>
                              )}
                            </span>
                            <span className="shrink-0 text-right">
                              <span className="block font-semibold tabular-nums">{formatPrice(String(o.subtotal))}</span>
                              <span className="block text-xs text-muted-foreground">
                                {formatPrice(String(o.price_per_night))} pp/night
                              </span>
                            </span>
                          </button>
                        );
                      })}

                      {s.options.length === 0 && (
                        <p className="text-sm text-muted-foreground">No host in this village yet.</p>
                      )}
                    </div>
                  </li>
                ))}
              </ol>
            </>
          )}
        </div>

        {plan && !loading && (
          <Card className="sticky top-24 h-fit">
            <CardContent className="space-y-4 p-5">
              <div>
                <p className="text-sm text-muted-foreground">{plan.total_nights} nights · {guests} walking</p>
                <p className="mt-1 text-2xl font-semibold tabular-nums">{formatPrice(String(total))}</p>
              </div>

              <p className="text-xs text-muted-foreground">
                Every night is booked together. If one village turns out to be full, nothing is booked and nothing is
                charged.
              </p>

              <Button
                className="w-full"
                disabled={!plan.walkable || !everyNightChosen || booking}
                onClick={book}
              >
                {booking ? 'Booking…' : 'Book the whole trek'}
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
