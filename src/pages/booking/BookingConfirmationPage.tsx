import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { CheckCircle, Calendar, MapPin } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';

type Booking = {
  id: number;
  listing_id: number;
  listing_title: string;
  listing_location: string;
  check_in: string;
  check_out: string;
  status: string;
};

export default function BookingConfirmationPage() {
  const { id } = useParams<{ id: string }>();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const bookingId = Number(id);
    if (!bookingId) {
      setLoading(false);
      return;
    }
    api
      .get<{ bookings: Booking[] }>('/api/bookings')
      .then((res) => {
        const b = res.data.bookings?.find((x) => x.id === bookingId);
        setBooking(b || null);
      })
      .catch(() => setBooking(null))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="mx-auto max-w-lg">
        <Card className="border-primary-200">
          <CardContent className="py-12 text-center text-muted-foreground">Loading…</CardContent>
        </Card>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="mx-auto max-w-lg">
        <Card className="border-primary-200">
          <CardHeader className="border-b border-primary-100 bg-primary-50/50">
            <h1 className="text-xl font-semibold text-primary-800">Booking</h1>
            <p className="text-sm text-muted-foreground">Booking not found.</p>
          </CardHeader>
          <CardContent className="p-6">
            <Button className="bg-accent-500 hover:bg-accent-600" asChild>
              <Link to="/dashboard/guest">Go to dashboard</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg">
      <Card className="border-primary-200">
        <CardHeader className="border-b border-primary-100 bg-primary-50/50 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary-100">
            <CheckCircle className="h-10 w-10 text-primary-600" />
          </div>
          <h1 className="mt-4 text-2xl font-semibold text-primary-800">Booking confirmed</h1>
          <p className="text-sm text-muted-foreground">Your payment was successful. You’re all set!</p>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <div className="flex items-start gap-3 rounded-lg border border-primary-200 p-4">
            <Calendar className="mt-0.5 h-5 w-5 text-accent-500" />
            <div>
              <p className="font-semibold text-primary-800">{booking.listing_title}</p>
              <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                <MapPin className="h-4 w-4" /> {booking.listing_location}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {booking.check_in} – {booking.check_out}
              </p>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            Check your email for confirmation details. Your host may send pre-arrival instructions closer to the date.
          </p>
          <div className="flex flex-wrap gap-3 pt-2">
            <Button className="bg-accent-500 hover:bg-accent-600" asChild>
              <Link to="/dashboard/guest">My dashboard</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to={`/listings/${booking.listing_id}`}>View listing</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
