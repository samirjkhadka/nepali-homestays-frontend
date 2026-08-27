import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { useCurrency } from '@/lib/currency';

interface RefundQuote {
  refund_amount: number;
  host_retains: number;
  refund_percent: number;
  within_grace_window: boolean;
  policy_name: string;
  basis: string;
}

interface CancelBookingButtonProps {
  bookingId: number;
  onCancelled: () => void;
}

/**
 * Cancelling, with the refund shown before the guest commits.
 *
 * The amount comes from the same server-side calculation that will be recorded
 * when they confirm, rather than being worked out again in the browser — a
 * figure shown here that turns out differently afterwards is worse than showing
 * nothing at all.
 */
export function CancelBookingButton({ bookingId, onCancelled }: CancelBookingButtonProps) {
  const { toast } = useToast();
  const { format: formatPrice } = useCurrency();
  const [quote, setQuote] = useState<RefundQuote | null>(null);
  const [loading, setLoading] = useState(false);
  const [confirming, setConfirming] = useState(false);

  const openConfirm = () => {
    setLoading(true);
    api
      .get<RefundQuote>(`/api/bookings/${bookingId}/refund-quote`)
      .then((res) => { setQuote(res.data); setConfirming(true); })
      .catch((err) =>
        toast({ title: err.response?.data?.message || 'Could not work out your refund.', variant: 'destructive' }))
      .finally(() => setLoading(false));
  };

  const confirm = () => {
    setLoading(true);
    api
      .post<{ message: string; refund_amount: number }>(`/api/bookings/${bookingId}/cancel`)
      .then((res) => {
        toast({ title: res.data?.message || 'Booking cancelled.' });
        setConfirming(false);
        onCancelled();
      })
      .catch((err) => toast({ title: err.response?.data?.message || 'Could not cancel.', variant: 'destructive' }))
      .finally(() => setLoading(false));
  };

  if (!confirming) {
    return (
      <Button
        size="sm" variant="outline" disabled={loading}
        className="border-destructive/50 text-destructive hover:bg-destructive/10"
        onClick={openConfirm}
      >
        {loading ? 'Checking…' : 'Cancel booking'}
      </Button>
    );
  }

  const refund = quote?.refund_amount ?? 0;

  return (
    <div className="w-full rounded-md border border-destructive/30 bg-destructive/5 p-4">
      <p className="font-medium">Cancel this reservation?</p>

      <p className="mt-2 text-2xl font-semibold tabular-nums">
        {refund > 0 ? formatPrice(String(refund)) : 'No refund'}
      </p>
      <p className="text-sm text-muted-foreground">
        {refund > 0 ? 'comes back to you' : 'for this cancellation'}
        {quote?.within_grace_window && ' — you are still inside the free cancellation window'}
      </p>

      {quote?.basis && <p className="mt-2 text-xs text-muted-foreground">{quote.basis}</p>}

      <p className="mt-2 text-xs text-muted-foreground">
        This cannot be undone. Your dates are released for other guests straight away.
      </p>

      <div className="mt-4 flex gap-2">
        <Button size="sm" variant="destructive" onClick={confirm} disabled={loading}>
          {loading ? 'Cancelling…' : 'Yes, cancel'}
        </Button>
        <Button size="sm" variant="outline" onClick={() => setConfirming(false)} disabled={loading}>
          Keep my booking
        </Button>
      </div>
    </div>
  );
}
