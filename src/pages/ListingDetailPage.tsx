import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Bed, MapPin, Users, User, Route, Heart, Star, Award, Languages } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { useCurrency } from '@/lib/currency';
import { ListingMap } from '@/components/ListingMap';

type HostProfile = {
  id: number;
  name: string;
  avatar_url: string | null;
  bio: string | null;
  brief_intro: string | null;
  superhost: boolean;
  local_expert: boolean;
  languages_spoken: string | null;
  is_primary: boolean;
  sort_order: number;
};

type Listing = {
  id: number;
  title: string;
  type: string;
  status?: string;
  category?: string | null;
  location: string;
  price_per_night: string;
  max_guests: number;
  description: string | null;
  way_to_get_there: string | null;
  latitude?: number | null;
  longitude?: number | null;
  images: { url: string }[];
  amenities: string[];
  host?: { name: string; avatar_url: string | null; bio: string | null };
  hosts?: HostProfile[];
  sections?: Record<string, string>;
};

const SECTION_LABELS: Record<string, string> = {
  owners_story: "Homestay owner's story",
  history: 'History',
  about_us: 'About us',
  their_community: 'Their community',
  whats_included_in_price: "What's included in the price",
  place_history: 'Place history',
  attractions: 'Attractions',
  homestay_highlights: 'Homestay highlights',
  things_to_do_nearby: 'Things to do near the homestay',
  impact_in_community: 'Impact in the community',
  how_to_get_there: 'How to get there',
  nearby_homestays: 'Nearby homestays',
  faqs: 'FAQs',
};

type TabId = 'overview' | 'amenities' | 'host' | 'location' | 'reviews';

type ReviewRow = {
  id: number;
  rating: number;
  title: string | null;
  comment: string | null;
  reviewer_name?: string;
  created_at: string;
};

const TABS: { id: TabId; label: string; icon: typeof Bed }[] = [
  { id: 'overview', label: 'Overview', icon: Bed },
  { id: 'amenities', label: 'Amenities', icon: Users },
  { id: 'host', label: 'Host', icon: User },
  { id: 'location', label: 'Location & directions', icon: Route },
  { id: 'reviews', label: 'Reviews', icon: Star },
];

export default function ListingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const { format: formatPrice } = useCurrency();
  const reviewBookingId = searchParams.get('review');
  const [listing, setListing] = useState<Listing | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [blockedDates, setBlockedDates] = useState<string[]>([]);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [guests, setGuests] = useState(1);
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);
  const [reviewForm, setReviewForm] = useState({ rating: 5, title: '', comment: '' });
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviews, setReviews] = useState<ReviewRow[]>([]);
  const [reviewsTotal, setReviewsTotal] = useState(0);
  const [bookingFee, setBookingFee] = useState<{ type: 'service_charge' | 'discount'; kind: 'percent' | 'fixed'; value: number } | null>(null);
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [rejectRemarks, setRejectRemarks] = useState('');
  const [adminActionLoading, setAdminActionLoading] = useState(false);

  const refetchListing = () => {
    if (!id) return;
    api.get<Listing>(`/api/listings/${id}`).then((res) => setListing(res.data)).catch(() => setListing(null));
  };

  const handleAdminApprove = () => {
    if (!id) return;
    setAdminActionLoading(true);
    api.patch(`/api/admin/listings/${id}/approve`)
      .then(() => {
        toast({ title: 'Listing approved.' });
        refetchListing();
      })
      .catch(() => toast({ title: 'Failed to approve.', variant: 'destructive' }))
      .finally(() => setAdminActionLoading(false));
  };

  const handleAdminReject = () => {
    if (!id) return;
    setAdminActionLoading(true);
    api.patch(`/api/admin/listings/${id}/reject`, { remarks: rejectRemarks.trim() || undefined })
      .then(() => {
        toast({ title: 'Listing rejected.' });
        setShowRejectForm(false);
        setRejectRemarks('');
        refetchListing();
      })
      .catch(() => toast({ title: 'Failed to reject.', variant: 'destructive' }))
      .finally(() => setAdminActionLoading(false));
  };

  useEffect(() => {
    api.get<{ booking_fee: { type: 'service_charge' | 'discount'; kind: 'percent' | 'fixed'; value: number } | null }>('/api/settings/booking-fee')
      .then((res) => setBookingFee(res.data.booking_fee ?? null))
      .catch(() => setBookingFee(null));
  }, []);

  useEffect(() => {
    if (!id) return;
    setLoaded(false);
    api
      .get<Listing>(`/api/listings/${id}`)
      .then((res) => setListing(res.data))
      .catch(() => setListing(null))
      .finally(() => setLoaded(true));
    api
      .get<{ blocked_dates: string[] }>(`/api/listings/${id}/blocked-dates`)
      .then((res) => setBlockedDates(res.data.blocked_dates || []))
      .catch(() => setBlockedDates([]));
  }, [id]);

  useEffect(() => {
    if (!user || !id) {
      setIsFavorite(false);
      return;
    }
    api
      .get<{ favorites: { listing_id: number }[] }>('/api/favorites')
      .then((res) => setIsFavorite((res.data.favorites || []).some((f) => f.listing_id === Number(id))))
      .catch(() => setIsFavorite(false));
  }, [user, id]);

  useEffect(() => {
    if (!id || activeTab !== 'reviews') return;
    api
      .get<{ reviews: ReviewRow[]; total: number }>(`/api/listings/${id}/reviews`, { params: { limit: 50 } })
      .then((res) => {
        setReviews(res.data.reviews || []);
        setReviewsTotal(res.data.total ?? 0);
      })
      .catch(() => { setReviews([]); setReviewsTotal(0); });
  }, [id, activeTab]);

  const handleSubmitReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewBookingId || !listingData || !user) return;
    setReviewSubmitting(true);
    api
      .post('/api/reviews', {
        booking_id: Number(reviewBookingId),
        rating: reviewForm.rating,
        title: reviewForm.title || undefined,
        comment: reviewForm.comment || undefined,
      })
      .then(() => {
        toast({ title: 'Thank you! Your review has been submitted.' });
        setSearchParams((p) => { p.delete('review'); return p; }, { replace: true });
      })
      .catch((err) =>
        toast({ title: err.response?.data?.message || 'Failed to submit review', variant: 'destructive' })
      )
      .finally(() => setReviewSubmitting(false));
  };

  const handleToggleFavorite = () => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (!listingData) return;
    setFavoriteLoading(true);
    const listingId = listingData.id;
    if (isFavorite) {
      api
        .delete(`/api/favorites/${listingId}`)
        .then(() => {
          setIsFavorite(false);
          toast({ title: 'Removed from wishlist.' });
        })
        .catch(() => toast({ title: 'Failed to remove.', variant: 'destructive' }))
        .finally(() => setFavoriteLoading(false));
    } else {
      api
        .post('/api/favorites', { listing_id: listingId })
        .then(() => {
          setIsFavorite(true);
          toast({ title: 'Added to wishlist!' });
        })
        .catch(() => toast({ title: 'Failed to add.', variant: 'destructive' }))
        .finally(() => setFavoriteLoading(false));
    }
  };

  const handleInquire = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      navigate('/login');
      return;
    }
    if (!listing || !checkIn || !checkOut) {
      toast({ title: 'Please select check-in and check-out dates.' });
      return;
    }
    setSubmitting(true);
    api
      .post('/api/bookings', {
        listing_id: listing.id,
        check_in: checkIn,
        check_out: checkOut,
        guests,
        message,
      })
      .then(() => {
        toast({ title: 'Inquiry sent!' });
        navigate('/dashboard/guest');
      })
      .catch((err) =>
        toast({
          title: err.response?.data?.message || 'Failed to send inquiry',
          variant: 'destructive',
        })
      )
      .finally(() => setSubmitting(false));
  };

  const handleMakePayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      navigate('/login');
      return;
    }
    if (!listing || !checkIn || !checkOut) {
      toast({ title: 'Please select check-in and check-out dates.' });
      return;
    }
    setSubmitting(true);
    api
      .post<{
        redirect_url?: string;
        redirect_form?: { action: string; method: string; fields: Record<string, string> };
        booking_id: number;
        payment_id: number;
        reference: string;
      }>('/api/bookings/initiate-payment', {
        listing_id: listing.id,
        check_in: checkIn,
        check_out: checkOut,
        guests,
        message: message || undefined,
      })
      .then((res) => {
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
        toast({ title: 'Payment could not be started.', variant: 'destructive' });
        setSubmitting(false);
      })
      .catch((err) => {
        toast({
          title: err.response?.data?.message || 'Failed to start payment',
          variant: 'destructive',
        });
        setSubmitting(false);
      });
  };

  if (!loaded && !listing)
    return (
      <div className="py-12 text-center text-muted-foreground">Loading…</div>
    );
  if (loaded && !listing)
    return (
      <div className="py-12 text-center">
        <h2 className="text-xl font-semibold text-primary-800">Listing not found</h2>
        <p className="mt-2 text-muted-foreground">
          This homestay may have been removed or is not available.
        </p>
        <Button className="mt-4" onClick={() => navigate('/search')}>
          Browse homestays
        </Button>
      </div>
    );

  const listingData = listing as Listing;
  const baseUrl = (import.meta.env.VITE_API_URL || api.defaults.baseURL || '').toString().trim().replace(/\/$/, '');
  const images = listingData.images?.length ? listingData.images : [];
  const imageUrl = (url: string) => {
    if (url.startsWith('http')) return url;
    if (!baseUrl) return url;
    const path = url.startsWith('/') ? url : `/${url}`;
    return baseUrl.replace(/\/$/, '') + path;
  };
  const mainImage = images[selectedImageIndex]?.url
    ? imageUrl(images[selectedImageIndex].url)
    : null;

  return (
    <div className="space-y-8">
      {/* Image gallery */}
      <div className="space-y-3">
        <div className="aspect-video max-h-[420px] w-full overflow-hidden rounded-xl bg-primary-100 shadow-md">
          {mainImage ? (
            <img
              src={mainImage}
              alt={listingData.title}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <Bed className="h-24 w-24 text-primary-300" />
            </div>
          )}
        </div>
        {images.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-1">
            {images.slice(0, 6).map((img, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setSelectedImageIndex(i)}
                className={`h-20 w-28 shrink-0 overflow-hidden rounded-lg border-2 transition-all ${
                  selectedImageIndex === i
                    ? 'border-accent-500 ring-2 ring-accent-200'
                    : 'border-transparent hover:border-primary-300'
                }`}
              >
                <img
                  src={imageUrl(img.url)}
                  alt=""
                  className="h-full w-full object-cover"
                />
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Main content: tabs */}
        <div className="lg:col-span-2 space-y-6">
          <div>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <h1 className="text-3xl font-bold text-primary-800">
                {listingData.title}
              </h1>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className={`shrink-0 border-primary-200 ${isFavorite ? 'bg-accent-50 text-accent-600 border-accent-200' : ''}`}
                onClick={handleToggleFavorite}
                disabled={favoriteLoading}
              >
                <Heart className={`mr-1.5 h-4 w-4 ${isFavorite ? 'fill-current' : ''}`} />
                {user ? (isFavorite ? 'Saved' : 'Save') : 'Log in to save'}
              </Button>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <span className="rounded-full bg-primary-100 px-3 py-1 text-sm font-medium capitalize text-primary-800">
                {listingData.type.replace(/_/g, ' ')} homestay
              </span>
              {listingData.category && (
                <span className="rounded-full bg-accent-100 px-3 py-1 text-sm font-medium capitalize text-accent-800">
                  {listingData.category.replace(/_/g, ' ')}
                </span>
              )}
              <span className="flex items-center gap-1 text-muted-foreground">
                <MapPin className="h-4 w-4 text-accent-500" /> {listingData.location}
              </span>
              <span className="flex items-center gap-1 text-muted-foreground">
                <Users className="h-4 w-4 text-accent-500" /> {listingData.max_guests} guests max
              </span>
            </div>
            <p className="mt-3 text-2xl font-semibold text-accent-600">
              {formatPrice(listingData.price_per_night)}
              <span className="text-base font-normal text-muted-foreground">/night</span>
            </p>
          </div>

          {/* Tab navigation */}
          <div className="border-b border-primary-200">
            <nav className="flex gap-1 overflow-x-auto">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 whitespace-nowrap border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
                    activeTab === tab.id
                      ? 'border-accent-500 text-accent-600'
                      : 'border-transparent text-muted-foreground hover:border-primary-300 hover:text-primary-700'
                  }`}
                >
                  <tab.icon className="h-4 w-4" />
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Write review (when ?review=bookingId) */}
          {user && reviewBookingId && (
            <Card className="border-accent-200 bg-accent-50/30">
              <CardHeader className="border-b border-accent-200">
                <div className="flex items-center gap-2">
                  <Star className="h-5 w-5 text-accent-600" />
                  <h3 className="font-semibold text-primary-800">Write a review</h3>
                </div>
                <p className="text-sm text-muted-foreground">Share your experience at {listingData.title}</p>
              </CardHeader>
              <CardContent className="p-6">
                <form onSubmit={handleSubmitReview} className="space-y-4">
                  <div>
                    <Label className="text-primary-800">Rating (1–5 stars)</Label>
                    <select
                      value={reviewForm.rating}
                      onChange={(e) => setReviewForm((f) => ({ ...f, rating: Number(e.target.value) }))}
                      className="mt-1 flex h-9 w-full max-w-[8rem] rounded-md border border-primary-200 bg-background px-3 py-1 text-sm"
                    >
                      {[5, 4, 3, 2, 1].map((r) => (
                        <option key={r} value={r}>{r} star{r !== 1 ? 's' : ''}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label className="text-primary-800">Title (optional)</Label>
                    <Input
                      value={reviewForm.title}
                      onChange={(e) => setReviewForm((f) => ({ ...f, title: e.target.value }))}
                      placeholder="Summary of your stay"
                      className="mt-1 border-primary-200"
                    />
                  </div>
                  <div>
                    <Label className="text-primary-800">Comment (optional)</Label>
                    <Textarea
                      value={reviewForm.comment}
                      onChange={(e) => setReviewForm((f) => ({ ...f, comment: e.target.value }))}
                      placeholder="Tell others about your experience..."
                      className="mt-1 border-primary-200"
                      rows={4}
                    />
                  </div>
                  <Button type="submit" className="bg-accent-500 hover:bg-accent-600" disabled={reviewSubmitting}>
                    {reviewSubmitting ? 'Submitting…' : 'Submit review'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Tab panels */}
          <Card className="border-primary-100">
            <CardContent className="p-6">
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="font-semibold text-primary-800">About this homestay</h3>
                    <div className="prose prose-primary-800 mt-2 max-w-none">
                      {listingData.description ? (
                        <p className="whitespace-pre-wrap text-foreground">
                          {listingData.description}
                        </p>
                      ) : (
                        <p className="text-muted-foreground">No description provided.</p>
                      )}
                    </div>
                  </div>
                  {/* Dynamic sections (only if filled); how_to_get_there is shown in Location tab */}
                  {listingData.sections &&
                    Object.entries(listingData.sections).map(([key, content]) => {
                      if (key === 'how_to_get_there' || !content?.trim()) return null;
                      const label = SECTION_LABELS[key] ?? key.replace(/_/g, ' ');
                      if (key === 'faqs') {
                        try {
                          const faqs = JSON.parse(content) as { q?: string; a?: string }[];
                          if (!Array.isArray(faqs) || faqs.length === 0) return null;
                          return (
                            <div key={key}>
                              <h3 className="font-semibold text-primary-800">{label}</h3>
                              <dl className="mt-2 space-y-3">
                                {faqs.map((faq, i) => (
                                  <div key={i} className="border-b border-primary-100 pb-3 last:border-0 last:pb-0">
                                    <dt className="font-medium text-primary-800">{faq.q}</dt>
                                    <dd className="mt-1 text-sm text-muted-foreground">{faq.a}</dd>
                                  </div>
                                ))}
                              </dl>
                            </div>
                          );
                        } catch {
                          return (
                            <div key={key}>
                              <h3 className="font-semibold text-primary-800">{label}</h3>
                              <p className="mt-2 whitespace-pre-wrap text-foreground">{content}</p>
                            </div>
                          );
                        }
                      }
                      return (
                        <div key={key}>
                          <h3 className="font-semibold text-primary-800">{label}</h3>
                          <p className="mt-2 whitespace-pre-wrap text-foreground">{content}</p>
                        </div>
                      );
                    })}
                </div>
              )}
              {activeTab === 'amenities' && (
                <div className="space-y-4">
                  <h3 className="font-semibold text-primary-800">What this place offers</h3>
                  {listingData.amenities?.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {listingData.amenities.map((a) => (
                        <span
                          key={a}
                          className="rounded-full bg-primary-100 px-4 py-2 text-sm font-medium text-primary-800"
                        >
                          {a}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">No amenities listed.</p>
                  )}
                </div>
              )}
              {activeTab === 'host' && (
                <div className="space-y-6">
                  <h3 className="font-semibold text-primary-800">Your host{((listingData as Listing).hosts?.length ?? 0) > 1 ? 's' : ''}</h3>
                  {((listingData as Listing).hosts?.length ?? 0) > 0
                    ? (listingData as Listing).hosts!.map((h) => (
                        <div key={h.id} className="flex items-start gap-4 rounded-lg border border-primary-100 p-4">
                          {h.avatar_url ? (
                            <img
                              src={h.avatar_url.startsWith('http') ? h.avatar_url : baseUrl + h.avatar_url}
                              alt={h.name}
                              className="h-16 w-16 rounded-full object-cover"
                            />
                          ) : (
                            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-primary-200">
                              <User className="h-8 w-8 text-primary-600" />
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <h4 className="font-semibold text-primary-800">{h.name}</h4>
                              {h.is_primary && (
                                <span className="rounded bg-primary-100 px-2 py-0.5 text-xs font-medium text-primary-700">Primary host</span>
                              )}
                              {h.superhost && (
                                <span className="inline-flex items-center gap-1 rounded bg-accent-100 px-2 py-0.5 text-xs font-medium text-accent-700">
                                  <Award className="h-3.5 w-3.5" /> Superhost
                                </span>
                              )}
                              {h.local_expert && (
                                <span className="inline-flex items-center gap-1 rounded bg-primary-100 px-2 py-0.5 text-xs font-medium text-primary-700">
                                  <Award className="h-3.5 w-3.5" /> Local expert
                                </span>
                              )}
                            </div>
                            {(h.brief_intro || h.bio) && (
                              <p className="mt-2 text-sm text-muted-foreground">
                                {h.brief_intro?.trim() || h.bio || ''}
                              </p>
                            )}
                            {h.languages_spoken?.trim() && (
                              <p className="mt-2 flex items-center gap-1.5 text-sm text-muted-foreground">
                                <Languages className="h-4 w-4 text-primary-500" />
                                {h.languages_spoken}
                              </p>
                            )}
                          </div>
                        </div>
                      ))
                    : listingData.host ? (
                        <div className="flex items-start gap-4">
                          {listingData.host.avatar_url ? (
                            <img
                              src={
                                listingData.host.avatar_url.startsWith('http')
                                  ? listingData.host.avatar_url
                                  : baseUrl + listingData.host.avatar_url
                              }
                              alt={listingData.host.name}
                              className="h-16 w-16 rounded-full object-cover"
                            />
                          ) : (
                            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary-200">
                              <User className="h-8 w-8 text-primary-600" />
                            </div>
                          )}
                          <div>
                            <h3 className="font-semibold text-primary-800">{listingData.host.name}</h3>
                            {listingData.host.bio && (
                              <p className="mt-2 text-sm text-muted-foreground">{listingData.host.bio}</p>
                            )}
                          </div>
                        </div>
                      ) : (
                        <p className="text-muted-foreground">Host information not available.</p>
                      )}
                </div>
              )}
              {activeTab === 'location' && (
                <div className="space-y-4">
                  <h4 className="font-medium text-primary-800">Map</h4>
                  <ListingMap
                    latitude={listingData.latitude}
                    longitude={listingData.longitude}
                    title={listingData.title}
                    className="mt-4"
                  />
                  <h4 className="pt-4 font-medium text-primary-800">How to get there</h4>
                  {(listingData.way_to_get_there || listingData.sections?.how_to_get_there) ? (
                    <p className="whitespace-pre-wrap text-foreground">
                      {listingData.sections?.how_to_get_there?.trim() || listingData.way_to_get_there || ''}
                    </p>
                  ) : (
                    <p className="text-muted-foreground">Directions not provided.</p>
                  )}
                </div>
              )}
              {activeTab === 'reviews' && (
                <div className="space-y-6">
                  <div className="flex flex-wrap items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Star className="h-6 w-6 fill-accent-500 text-accent-500" />
                      <span className="text-2xl font-semibold text-primary-800">
                        {reviews.length > 0
                          ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
                          : '—'}
                      </span>
                    </div>
                    <span className="text-muted-foreground">
                      {reviewsTotal} review{reviewsTotal !== 1 ? 's' : ''}
                    </span>
                  </div>
                  {reviews.length === 0 ? (
                    <p className="text-muted-foreground">No reviews yet. Be the first to review after your stay!</p>
                  ) : (
                    <ul className="space-y-6 border-t border-primary-100 pt-4">
                      {reviews.map((r) => (
                        <li key={r.id} className="border-b border-primary-50 pb-4 last:border-0 last:pb-0">
                          <div className="flex items-center gap-2">
                            <div className="flex gap-0.5">
                              {[1, 2, 3, 4, 5].map((i) => (
                                <Star
                                  key={i}
                                  className={`h-4 w-4 ${i <= r.rating ? 'fill-accent-500 text-accent-500' : 'text-primary-200'}`}
                                />
                              ))}
                            </div>
                            {r.reviewer_name && (
                              <span className="font-medium text-primary-800">{r.reviewer_name}</span>
                            )}
                            <span className="text-sm text-muted-foreground">
                              {r.created_at ? new Date(r.created_at).toLocaleDateString() : ''}
                            </span>
                          </div>
                          {r.title && <p className="mt-1 font-medium text-primary-800">{r.title}</p>}
                          {r.comment && <p className="mt-1 text-sm text-foreground">{r.comment}</p>}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sticky sidebar: Admin actions (when admin + pending) or Book now (guests/hosts) */}
        <div className="lg:col-span-1">
          <div className="sticky top-24">
            {user?.role === 'admin' && listingData.status === 'pending' ? (
              <Card className="border-primary-200 shadow-lg">
                <CardHeader className="border-b border-primary-100 bg-primary-50/50">
                  <h3 className="font-semibold text-primary-800">Moderate listing</h3>
                  <p className="text-sm text-muted-foreground">Approve or reject this pending listing</p>
                </CardHeader>
                <CardContent className="p-4 space-y-4">
                  <div className="flex gap-2">
                    <Button className="flex-1 bg-accent-500 hover:bg-accent-600" onClick={handleAdminApprove} disabled={adminActionLoading}>
                      Approve
                    </Button>
                    <Button variant="destructive" className="flex-1" onClick={() => setShowRejectForm((v) => !v)} disabled={adminActionLoading}>
                      Reject
                    </Button>
                  </div>
                  {showRejectForm && (
                    <div className="space-y-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3">
                      <Label className="text-primary-800">Remarks (optional)</Label>
                      <Textarea
                        value={rejectRemarks}
                        onChange={(e) => setRejectRemarks(e.target.value)}
                        placeholder="Reason for rejection (e.g. missing documents, unclear photos)..."
                        className="mt-1 min-h-[80px]"
                        rows={3}
                      />
                      <Button variant="destructive" size="sm" onClick={handleAdminReject} disabled={adminActionLoading}>
                        Confirm reject
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : user?.role !== 'admin' && (
              <Card className="border-primary-200 shadow-lg">
                <CardHeader className="border-b border-primary-100 bg-primary-50/50">
                  <h3 className="font-semibold text-primary-800">Book now</h3>
                  <p className="text-sm text-muted-foreground">
                    {formatPrice(listingData.price_per_night)}/night · {listingData.max_guests} guests max
                  </p>
                </CardHeader>
                <CardContent className="p-4">
                  <form onSubmit={handleMakePayment} className="space-y-4">
                    <div>
                      <Label>Check-in</Label>
                      <Input
                        type="date"
                        value={checkIn}
                        onChange={(e) => setCheckIn(e.target.value)}
                        required
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label>Check-out</Label>
                      <Input
                        type="date"
                        value={checkOut}
                        onChange={(e) => setCheckOut(e.target.value)}
                        required
                        className="mt-1"
                      />
                    </div>
                    {blockedDates.length > 0 && (
                      <p className="text-xs text-muted-foreground">
                        Blocked: {blockedDates.slice(0, 8).join(', ')}
                        {blockedDates.length > 8 ? '…' : ''}
                      </p>
                    )}
                    <div>
                      <Label>Guests</Label>
                      <Input
                        type="number"
                        min={1}
                        max={listingData.max_guests}
                        value={guests}
                        onChange={(e) => setGuests(Number(e.target.value))}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label>Message (optional)</Label>
                      <Textarea
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Introduce yourself..."
                        className="mt-1"
                        rows={3}
                      />
                    </div>
                    {checkIn && checkOut && listingData && (() => {
                      const cin = new Date(checkIn);
                      const cout = new Date(checkOut);
                      const nights = Math.ceil((cout.getTime() - cin.getTime()) / (24 * 60 * 60 * 1000));
                      if (nights <= 0) return null;
                      const pricePerNight = parseFloat(String(listingData.price_per_night));
                      const subtotal = Math.round(pricePerNight * nights * 100) / 100;
                      let feeAmount = 0;
                      let feeLabel = '';
                      if (bookingFee && bookingFee.value > 0) {
                        const raw = bookingFee.kind === 'percent' ? (subtotal * bookingFee.value) / 100 : bookingFee.value;
                        feeAmount = Math.round(raw * 100) / 100;
                        if (bookingFee.type === 'discount') feeAmount = -feeAmount;
                        feeLabel = bookingFee.type === 'service_charge'
                          ? `Service charge (${bookingFee.kind === 'percent' ? bookingFee.value + '%' : 'fixed'})`
                          : `Discount (${bookingFee.kind === 'percent' ? bookingFee.value + '%' : 'fixed'})`;
                      }
                      const total = Math.max(0, Math.round((subtotal + feeAmount) * 100) / 100);
                      return (
                        <div className="space-y-2 rounded-lg border border-primary-100 bg-primary-50/30 p-3 text-sm">
                          <div className="flex justify-between text-primary-800">
                            <span>{nights} night{nights !== 1 ? 's' : ''} × {formatPrice(String(pricePerNight))}</span>
                            <span>{formatPrice(String(subtotal))}</span>
                          </div>
                          {feeAmount !== 0 && (
                            <div className={`flex justify-between ${feeAmount > 0 ? 'text-primary-700' : 'text-accent-600'}`}>
                              <span>{feeLabel}</span>
                              <span>{feeAmount > 0 ? '+' : ''}{formatPrice(String(feeAmount))}</span>
                            </div>
                          )}
                          <div className="flex justify-between border-t border-primary-200 pt-2 font-semibold text-primary-800">
                            <span>Total</span>
                            <span>{formatPrice(String(total))}</span>
                          </div>
                        </div>
                      );
                    })()}
                    <Button
                      type="submit"
                      className="w-full bg-accent-500 hover:bg-accent-600"
                      disabled={submitting}
                    >
                      {user ? (submitting ? 'Redirecting to payment…' : 'Make payment') : 'Log in to book'}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
