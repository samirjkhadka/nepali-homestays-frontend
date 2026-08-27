import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { SingleDatePicker } from '@/components/SingleDatePicker';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';
import { useCurrency } from '@/lib/currency';

interface Availability {
  max_participants: number | null;
  booked: number;
  /** Null means the host stated no limit — not that none are left. */
  remaining: number | null;
  is_available: boolean;
}

interface ExperienceBookingPanelProps {
  experienceId: number;
  price: number;
  unit: string;
  minParticipants: number;
  maxParticipants: number | null;
}

/**
 * The earliest bookable day, in Nepal's calendar rather than the browser's.
 * A guest booking from London at 21:00 is already on tomorrow in Nepal, and the
 * picker should not offer them a day the API will reject as past.
 */
function nepalToday(): Date {
  const iso = new Date(Date.now() + 5.75 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function ExperienceBookingPanel({
  experienceId, price, unit, minParticipants, maxParticipants,
}: ExperienceBookingPanelProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const { format: formatPrice } = useCurrency();

  const [date, setDate] = useState('');
  const [participants, setParticipants] = useState(Math.max(1, minParticipants));
  const [availability, setAvailability] = useState<Availability | null>(null);
  const [checking, setChecking] = useState(false);
  const [booking, setBooking] = useState(false);

  useEffect(() => {
    if (!date) { setAvailability(null); return; }
    let live = true;
    setChecking(true);
    api
      .get<Availability>(`/api/experiences/${experienceId}/availability`, { params: { date } })
      .then((res) => { if (live) setAvailability(res.data); })
      .catch(() => { if (live) setAvailability(null); })
      .finally(() => { if (live) setChecking(false); });
    return () => { live = false; };
  }, [experienceId, date]);

  // per_person multiplies; per_group and fixed are one price however many come.
  const perPerson = unit === 'per_person';
  const total = perPerson ? price * participants : price;

  const remaining = availability?.remaining ?? null;
  const overCapacity = remaining !== null && participants > remaining;
  const soldOut = availability !== null && !availability.is_available;
  const belowMinimum = participants < minParticipants;
  const canBook = Boolean(date) && !overCapacity && !soldOut && !belowMinimum && !checking;

  const book = () => {
    if (!user) {
      toast({ title: 'Sign in to book this experience.' });
      navigate('/login');
      return;
    }
    setBooking(true);
    api
      .post(`/api/experiences/${experienceId}/book`, { date, participants })
      .then((res) => {
        const d = res.data as { reservation_without_payment?: boolean; redirect_url?: string; confirmation_message?: string };
        if (d.redirect_url) { window.location.href = d.redirect_url; return; }
        toast({ title: d.confirmation_message || 'Your place is reserved.' });
        navigate('/dashboard?tab=trips');
      })
      .catch((err) => toast({ title: err.response?.data?.message || 'Could not book that.', variant: 'destructive' }))
      .finally(() => setBooking(false));
  };

  return (
    <Card className="sticky top-24">
      <CardContent className="space-y-4 p-5">
        <div>
          <p className="text-2xl font-semibold">{formatPrice(String(price))}</p>
          <p className="text-sm text-muted-foreground">
            {perPerson ? 'per person' : unit === 'per_group' ? 'for the group' : 'total'}
          </p>
        </div>

        <div>
          <Label>Date</Label>
          <SingleDatePicker value={date} onChange={setDate} minDate={nepalToday()} className="mt-1" />
        </div>

        <div>
          <Label>How many people</Label>
          <Input
            type="number"
            min={minParticipants}
            max={maxParticipants ?? undefined}
            value={participants}
            onChange={(e) => setParticipants(Math.max(1, Number(e.target.value) || 1))}
            className="mt-1"
          />
          {minParticipants > 1 && (
            <p className="mt-1 text-xs text-muted-foreground">This experience needs at least {minParticipants} people.</p>
          )}
        </div>

        {date && checking && <p className="text-sm text-muted-foreground">Checking that date…</p>}

        {date && !checking && availability && (
          <div className="rounded-md bg-muted/60 p-3 text-sm">
            {soldOut ? (
              <p className="flex items-start gap-1.5 text-destructive">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> Fully booked on that date.
              </p>
            ) : remaining === null ? (
              <p className="flex items-center gap-1.5 text-muted-foreground">
                <Users className="h-4 w-4" /> Places available.
              </p>
            ) : (
              <p className={`flex items-center gap-1.5 ${overCapacity ? 'text-destructive' : 'text-muted-foreground'}`}>
                <Users className="h-4 w-4" />
                {remaining} {remaining === 1 ? 'place' : 'places'} left
                {overCapacity && ` — that is fewer than the ${participants} you asked for.`}
              </p>
            )}
          </div>
        )}

        {belowMinimum && (
          <p className="text-sm text-destructive">At least {minParticipants} people have to come.</p>
        )}

        <div className="flex items-baseline justify-between border-t pt-3">
          <span className="text-sm text-muted-foreground">
            {perPerson ? `${formatPrice(String(price))} × ${participants}` : 'Total'}
          </span>
          <span className="text-lg font-semibold tabular-nums">{formatPrice(String(total))}</span>
        </div>

        <Button className="w-full" disabled={!canBook || booking} onClick={book}>
          {booking ? 'Booking…' : date ? 'Book this experience' : 'Choose a date'}
        </Button>

        <p className="text-center text-xs text-muted-foreground">
          You are booking the experience only — no overnight stay.
        </p>
      </CardContent>
    </Card>
  );
}
