import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

const stripePk = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '';

type BookingInfo = {
  id: number;
  listing_title: string;
  check_in: string;
  check_out: string;
  status: string;
};

function PaymentForm({ returnUrl }: { returnUrl: string }) {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    setLoading(true);
    try {
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: returnUrl,
          receipt_email: undefined,
        },
      });
      if (error) {
        toast({ title: error.message || 'Payment failed', variant: 'destructive' });
      }
    } catch (err) {
      toast({ title: 'Payment failed', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement />
      <Button type="submit" className="w-full bg-accent-500 hover:bg-accent-600" disabled={!stripe || !elements || loading}>
        {loading ? 'Processing…' : 'Pay now'}
      </Button>
      <Button asChild variant="outline" className="w-full">
        <Link to="/dashboard/guest">Back to dashboard</Link>
      </Button>
    </form>
  );
}

export default function PayBookingPage() {
  const { id } = useParams<{ id: string }>();
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [booking, setBooking] = useState<BookingInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!stripePk) {
      setError('Payment is not configured.');
      setLoading(false);
      return;
    }
    const bookingId = Number(id);
    if (!bookingId) {
      setError('Invalid booking.');
      setLoading(false);
      return;
    }
    (async () => {
      try {
        const bookingsRes = await api.get<{ bookings: BookingInfo[] }>('/api/bookings');
        const b = bookingsRes.data.bookings?.find((x) => x.id === bookingId);
        if (!b) {
          setError('Booking not found.');
          return;
        }
        if (b.status !== 'approved') {
          setError('This booking is not approved for payment.');
          return;
        }
        setBooking(b);
        const payRes = await api.post<{ client_secret: string; payment_id: number }>('/api/payments', {
          booking_id: bookingId,
        });
        if (payRes.data?.client_secret) setClientSecret(payRes.data.client_secret);
      } catch (err: unknown) {
        const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
        setError(msg || 'Failed to start payment.');
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const returnUrl = `${window.location.origin}/bookings/${id}/confirmation`;

  if (!stripePk) {
    return (
      <div className="mx-auto max-w-md">
        <Card className="border-primary-200">
          <CardHeader className="border-b border-primary-100 bg-primary-50/50">
            <h1 className="text-xl font-semibold text-primary-800">Pay for booking</h1>
            <p className="text-sm text-muted-foreground">Payment is not configured. Please contact support.</p>
          </CardHeader>
          <CardContent className="p-6">
            <Button className="bg-accent-500 hover:bg-accent-600" asChild><Link to="/dashboard/guest">Back to dashboard</Link></Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-md">
        <Card className="border-primary-200">
          <CardContent className="py-12 text-center text-muted-foreground">Loading…</CardContent>
        </Card>
      </div>
    );
  }

  if (error || !clientSecret) {
    return (
      <div className="mx-auto max-w-md">
        <Card className="border-primary-200">
          <CardHeader className="border-b border-primary-100 bg-primary-50/50">
            <h1 className="text-xl font-semibold text-primary-800">Pay for booking</h1>
            <p className="text-sm text-destructive">{error || 'Could not start payment.'}</p>
          </CardHeader>
          <CardContent className="p-6">
            <Button className="bg-accent-500 hover:bg-accent-600" asChild><Link to="/dashboard/guest">Back to dashboard</Link></Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const stripePromise = loadStripe(stripePk);
  const options = {
    clientSecret,
    appearance: { theme: 'stripe' as const },
  };

  return (
    <div className="mx-auto max-w-md">
      <Card className="border-primary-200">
        <CardHeader className="border-b border-primary-100 bg-primary-50/50">
          <h1 className="text-xl font-semibold text-primary-800">Pay for booking</h1>
          {booking && (
            <p className="text-sm text-muted-foreground">
              {booking.listing_title} · {booking.check_in} to {booking.check_out}
            </p>
          )}
        </CardHeader>
        <CardContent className="p-6">
          <Elements stripe={stripePromise} options={options}>
            <PaymentForm returnUrl={returnUrl} />
          </Elements>
        </CardContent>
      </Card>
    </div>
  );
}
