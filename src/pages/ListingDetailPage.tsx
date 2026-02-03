import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams, useLocation, Link } from 'react-router-dom';
import { MapPin, Users, Heart, Star, Award, ArrowLeft, Share, MessageCircle, Calendar, Languages, BadgeCheck } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import { getImageDisplayUrl } from '@/lib/image-url';
import { useToast } from '@/hooks/use-toast';
import { useCurrency } from '@/lib/currency';
import { ListingMap } from '@/components/ListingMap';
import { PhotoGallery } from '@/components/PhotoGallery';
import { BookingCard } from '@/components/BookingCard';
import { ReviewsSection } from '@/components/ReviewsSection';
import { AmenitiesList } from '@/components/AmenitiesList';

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
  badge?: string | null;
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

/** Listing display settings from API (badge labels, section labels, highlights, trust badges, empty fallbacks) */
type ListingDisplaySettings = {
  badge_labels: Record<string, string>;
  section_labels: Record<string, string>;
  highlights: {
    free_cancellation_title: string;
    free_cancellation_description: string;
    great_communication_title: string;
    great_communication_description: string;
    superhost_title: string;
    superhost_description: string;
  };
  trust_badges: string[];
  empty_fallbacks: { no_description: string; default_host_name: string; no_directions: string };
};

const DEFAULT_LISTING_DISPLAY: ListingDisplaySettings = {
  badge_labels: { recommended: 'Recommended', featured: 'Featured', new: 'New' },
  section_labels: { owners_story: "Homestay owner's story", history: 'History', about_us: 'About us', their_community: 'Their community', whats_included_in_price: "What's included in the price", place_history: 'Place history', attractions: 'Attractions', homestay_highlights: 'Homestay highlights', things_to_do_nearby: 'Things to do near the homestay', impact_in_community: 'Impact in the community', how_to_get_there: 'How to get there', nearby_homestays: 'Nearby homestays', faqs: 'FAQs' },
  highlights: {
    free_cancellation_title: 'Free cancellation for 48 hours',
    free_cancellation_description: 'Get a full refund if you change your mind within 48 hours of booking.',
    great_communication_title: 'Great communication',
    great_communication_description: 'Our hosts are committed to responding quickly and helping you plan your stay.',
    superhost_title: '{hostName} is a Superhost',
    superhost_description: 'Superhosts are experienced, highly rated hosts committed to providing great stays.',
  },
  trust_badges: ['Free cancellation for 48 hours', 'Verified homestay host', 'Secure payment process'],
  empty_fallbacks: { no_description: 'No description provided.', default_host_name: 'Host', no_directions: 'Directions not provided.' },
};

type ReviewRow = {
  id: number;
  rating: number;
  title: string | null;
  comment: string | null;
  reviewer_name?: string;
  created_at: string;
};

export default function ListingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const backTo = (location.state as { from?: string } | null)?.from === 'admin' ? '/admin/dashboard?tab=listings' : '/search';
  const { toast } = useToast();
  const { format: formatPrice } = useCurrency();
  const reviewBookingId = searchParams.get('review');
  const [listing, setListing] = useState<Listing | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [blockedDates, setBlockedDates] = useState<string[]>([]);
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [guests, setGuests] = useState(1);
  const [message] = useState('');
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
  const [listingDisplay, setListingDisplay] = useState<ListingDisplaySettings>(DEFAULT_LISTING_DISPLAY);

  useEffect(() => {
    api.get<ListingDisplaySettings>('/api/settings/listing-display')
      .then((res) => setListingDisplay(res.data))
      .catch(() => {});
  }, []);

  const refetchListing = () => {
    if (!id) return;
    const url = user?.role?.toLowerCase() === 'admin' ? `/api/admin/listings/${id}` : `/api/listings/${id}`;
    api.get<Listing>(url).then((res) => setListing(res.data)).catch(() => setListing(null));
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

  const listingUrl = user?.role?.toLowerCase() === 'admin' ? `/api/admin/listings/${id}` : `/api/listings/${id}`;
  useEffect(() => {
    if (!id) return;
    setLoaded(false);
    api
      .get<Listing>(listingUrl)
      .then((res) => setListing(res.data))
      .catch(() => setListing(null))
      .finally(() => setLoaded(true));
    api
      .get<{ blocked_dates: string[] }>(`/api/listings/${id}/blocked-dates`)
      .then((res) => setBlockedDates(res.data.blocked_dates || []))
      .catch(() => setBlockedDates([]));
  }, [id, listingUrl]);

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
    if (!id) return;
    api
      .get<{ reviews: ReviewRow[]; total: number }>(`/api/listings/${id}/reviews`, { params: { limit: 50 } })
      .then((res) => {
        setReviews(res.data.reviews || []);
        setReviewsTotal(res.data.total ?? 0);
      })
      .catch(() => { setReviews([]); setReviewsTotal(0); });
  }, [id]);

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
        <Button className="mt-4" onClick={() => navigate(backTo)}>
          Browse homestays
        </Button>
      </div>
    );

  const listingData = listing as Listing;
  const images = listingData.images?.length ? listingData.images.map((i) => i.url) : [];
  const imageUrl = (url: string) => getImageDisplayUrl(url);
  const primaryHost =
    (listingData.hosts?.length && listingData.hosts.find((h) => h.is_primary)) ||
    listingData.hosts?.[0] ||
    null;
  const hostName =
    primaryHost?.name ||
    listingData.host?.name ||
    listingDisplay.empty_fallbacks.default_host_name;
  const hostBio = primaryHost?.brief_intro || primaryHost?.bio || null;
  const hostLanguages = primaryHost?.languages_spoken?.trim() || null;
  const isSuperhost = listingData.hosts?.some((h) => h.superhost) ?? false;
  const isCulturalExpert = listingData.hosts?.some((h) => h.local_expert) ?? false;
  const averageRating =
    reviews.length > 0 ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({ title: listingData.title, url: window.location.href }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast({ title: 'Link copied to clipboard.' });
    }
  };

  return (
    <main className="pt-6 pb-16 min-h-screen bg-background">
      <div className="container mx-auto px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <Link
            to={backTo}
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to homestays
          </Link>

          <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-2">
            {listingData.title}
          </h1>

          <div className="flex flex-wrap items-center gap-4 text-sm">
            {(averageRating > 0 || reviewsTotal > 0) && (
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 fill-accent text-accent" />
                <span className="font-medium">{averageRating.toFixed(1)}</span>
                <span className="text-muted-foreground">({reviewsTotal} reviews)</span>
              </div>
            )}
            {listingData.badge && listingDisplay.badge_labels[listingData.badge] && (
              <div className="flex items-center gap-1 text-primary">
                <Award className="w-4 h-4" />
                <span>{listingDisplay.badge_labels[listingData.badge]}</span>
              </div>
            )}
            <div className="flex items-center gap-1 text-muted-foreground">
              <MapPin className="w-4 h-4" />
              <span>{listingData.location}</span>
            </div>

            <div className="flex items-center gap-3 ml-auto">
              <button
                type="button"
                onClick={handleShare}
                className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-muted transition-colors"
              >
                <Share className="w-4 h-4" />
                <span className="hidden sm:inline">Share</span>
              </button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className={`flex items-center gap-2 ${isFavorite ? 'text-accent' : ''}`}
                onClick={handleToggleFavorite}
                disabled={favoriteLoading}
              >
                <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
                <span className="hidden sm:inline">{user ? (isFavorite ? 'Saved' : 'Save') : 'Save'}</span>
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Photo Gallery */}
        <div className="relative mb-10">
          <PhotoGallery images={images} title={listingData.title} resolveUrl={imageUrl} />
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Left Column - Details */}
          <div className="lg:col-span-2 space-y-8">
            {/* Host Info */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="flex items-start gap-4 pb-8 border-b border-border"
            >
              <div className="w-14 h-14 rounded-full overflow-hidden bg-primary/20 flex-shrink-0 flex items-center justify-center text-primary font-display font-bold text-xl">
                {primaryHost?.avatar_url ? (
                  <img src={getImageDisplayUrl(primaryHost.avatar_url)} alt="" className="w-full h-full object-cover" />
                ) : (
                  hostName.charAt(0)
                )}
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="font-display text-xl font-semibold text-foreground mb-1">
                  Entire homestay hosted by {hostName}
                </h2>
                <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground mb-2">
                  <span className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    {listingData.max_guests} guests
                  </span>
                  {hostLanguages && (
                    <span className="flex items-center gap-1">
                      <Languages className="w-4 h-4" />
                      {hostLanguages}
                    </span>
                  )}
                </div>
                {(isSuperhost || isCulturalExpert) && (
                  <div className="flex flex-wrap gap-2 mb-2">
                    {isSuperhost && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                        <Award className="w-3.5 h-3.5" />
                        Superhost
                      </span>
                    )}
                    {isCulturalExpert && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-accent/20 px-2.5 py-0.5 text-xs font-medium text-accent-foreground">
                        <BadgeCheck className="w-3.5 h-3.5" />
                        Cultural expert
                      </span>
                    )}
                  </div>
                )}
                {hostBio && (
                  <p className="text-sm text-foreground/80 leading-relaxed">
                    {hostBio}
                  </p>
                )}
              </div>
            </motion.div>

            {/* Highlights */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="space-y-4 pb-8 border-b border-border"
            >
              {isSuperhost && (
                <div className="flex gap-4">
                  <Award className="w-6 h-6 text-primary flex-shrink-0" />
                  <div>
                    <h3 className="font-medium text-foreground">
                      {listingDisplay.highlights.superhost_title.replace('{hostName}', hostName)}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {listingDisplay.highlights.superhost_description}
                    </p>
                  </div>
                </div>
              )}
              <div className="flex gap-4">
                <Calendar className="w-6 h-6 text-primary flex-shrink-0" />
                <div>
                  <h3 className="font-medium text-foreground">{listingDisplay.highlights.free_cancellation_title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {listingDisplay.highlights.free_cancellation_description}
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <MessageCircle className="w-6 h-6 text-primary flex-shrink-0" />
                <div>
                  <h3 className="font-medium text-foreground">{listingDisplay.highlights.great_communication_title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {listingDisplay.highlights.great_communication_description}
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Description */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="pb-8 border-b border-border"
            >
              <h3 className="font-display text-2xl font-semibold text-foreground mb-4">
                About this place
              </h3>
              <div className="text-foreground/80 leading-relaxed whitespace-pre-line">
                {listingData.description || listingDisplay.empty_fallbacks.no_description}
              </div>
            </motion.div>

            {/* Dynamic sections (except how_to_get_there) */}
            {listingData.sections &&
              Object.entries(listingData.sections).map(([key, content]) => {
                if (key === 'how_to_get_there' || !content?.trim()) return null;
                const label = listingDisplay.section_labels[key] ?? key.replace(/_/g, ' ');
                if (key === 'faqs') {
                  try {
                    const faqs = JSON.parse(content) as { q?: string; a?: string }[];
                    if (!Array.isArray(faqs) || faqs.length === 0) return null;
                    return (
                      <motion.div
                        key={key}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.35 }}
                        className="pb-8 border-b border-border"
                      >
                        <h3 className="font-display text-2xl font-semibold text-foreground mb-4">{label}</h3>
                        <dl className="space-y-3">
                          {faqs.map((faq, i) => (
                            <div key={i} className="border-b border-border/50 pb-3 last:border-0 last:pb-0">
                              <dt className="font-medium text-foreground">{faq.q}</dt>
                              <dd className="mt-1 text-sm text-muted-foreground">{faq.a}</dd>
                            </div>
                          ))}
                        </dl>
                      </motion.div>
                    );
                  } catch {
                    return (
                      <motion.div key={key} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className="pb-8 border-b border-border">
                        <h3 className="font-display text-2xl font-semibold text-foreground mb-4">{label}</h3>
                        <p className="text-foreground/80 whitespace-pre-line">{content}</p>
                      </motion.div>
                    );
                  }
                }
                return (
                  <motion.div
                    key={key}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.35 }}
                    className="pb-8 border-b border-border"
                  >
                    <h3 className="font-display text-2xl font-semibold text-foreground mb-4">{label}</h3>
                    <p className="text-foreground/80 whitespace-pre-line">{content}</p>
                  </motion.div>
                );
              })}

            {/* Amenities */}
            <AmenitiesList amenities={listingData.amenities || []} sections={listingData.sections} />

            {/* Write review (when ?review=bookingId) */}
            {user && reviewBookingId && (
              <Card className="border-border bg-card">
                <CardHeader className="border-b border-border">
                  <div className="flex items-center gap-2">
                    <Star className="h-5 w-5 text-accent" />
                    <h3 className="font-semibold text-foreground">Write a review</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">Share your experience at {listingData.title}</p>
                </CardHeader>
                <CardContent className="p-6">
                  <form onSubmit={handleSubmitReview} className="space-y-4">
                    <div>
                      <Label>Rating (1–5 stars)</Label>
                      <select
                        value={reviewForm.rating}
                        onChange={(e) => setReviewForm((f) => ({ ...f, rating: Number(e.target.value) }))}
                        className="mt-1 flex h-9 w-full max-w-[8rem] rounded-md border border-border bg-background px-3 py-1 text-sm"
                      >
                        {[5, 4, 3, 2, 1].map((r) => (
                          <option key={r} value={r}>{r} star{r !== 1 ? 's' : ''}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <Label>Title (optional)</Label>
                      <Input
                        value={reviewForm.title}
                        onChange={(e) => setReviewForm((f) => ({ ...f, title: e.target.value }))}
                        placeholder="Summary of your stay"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label>Comment (optional)</Label>
                      <Textarea
                        value={reviewForm.comment}
                        onChange={(e) => setReviewForm((f) => ({ ...f, comment: e.target.value }))}
                        placeholder="Tell others about your experience..."
                        className="mt-1"
                        rows={4}
                      />
                    </div>
                    <Button type="submit" className="bg-primary hover:bg-primary/90" disabled={reviewSubmitting}>
                      {reviewSubmitting ? 'Submitting…' : 'Submit review'}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            )}

            {/* Reviews */}
            <ReviewsSection
              reviews={reviews}
              averageRating={averageRating}
              totalReviews={reviewsTotal}
            />

            {/* Location & directions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="pb-8 border-t border-border pt-8"
            >
              <h3 className="font-display text-2xl font-semibold text-foreground mb-4">Location & directions</h3>
              <ListingMap
                latitude={listingData.latitude}
                longitude={listingData.longitude}
                title={listingData.title}
                className="mb-4 rounded-xl overflow-hidden"
              />
              {(listingData.way_to_get_there || listingData.sections?.how_to_get_there) ? (
                <p className="text-foreground/80 whitespace-pre-line">
                  {listingData.sections?.how_to_get_there?.trim() || listingData.way_to_get_there || ''}
                </p>
              ) : (
                <p className="text-muted-foreground">{listingDisplay.empty_fallbacks.no_directions}</p>
              )}
            </motion.div>
          </div>

          {/* Right Column - Booking Card or Admin */}
          <div className="lg:col-span-1">
            {user?.role === 'admin' && listingData.status === 'pending' ? (
              <Card className="border-border shadow-lg">
                <CardHeader className="border-b border-border bg-muted/30">
                  <h3 className="font-semibold text-foreground">Moderate listing</h3>
                  <p className="text-sm text-muted-foreground">Approve or reject this pending listing</p>
                </CardHeader>
                <CardContent className="p-4 space-y-4">
                  <div className="flex gap-2">
                    <Button className="flex-1 bg-primary hover:bg-primary/90" onClick={handleAdminApprove} disabled={adminActionLoading}>
                      Approve
                    </Button>
                    <Button variant="destructive" className="flex-1" onClick={() => setShowRejectForm((v) => !v)} disabled={adminActionLoading}>
                      Reject
                    </Button>
                  </div>
                  {showRejectForm && (
                    <div className="space-y-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3">
                      <Label>Remarks (optional)</Label>
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
              <BookingCard
                pricePerNight={listingData.price_per_night}
                priceFormatted={formatPrice(listingData.price_per_night)}
                rating={averageRating || undefined}
                totalReviews={reviewsTotal}
                maxGuests={listingData.max_guests}
                checkIn={checkIn}
                checkOut={checkOut}
                onCheckInChange={setCheckIn}
                onCheckOutChange={setCheckOut}
                guests={guests}
                onGuestsChange={setGuests}
                blockedDates={blockedDates}
                onSubmit={handleMakePayment}
                submitting={submitting}
                submitLabel="You won't be charged yet"
                bookingFee={bookingFee}
                trustBadges={listingDisplay.trust_badges}
              />
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
