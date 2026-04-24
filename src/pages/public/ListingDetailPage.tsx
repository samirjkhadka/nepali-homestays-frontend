import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams, useLocation, Link } from 'react-router-dom';
import { MapPin, Users, Heart, Star, Award, ArrowLeft, Share, MessageCircle, Calendar, Languages, BadgeCheck, BedDouble, Bath, Landmark, Leaf } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import { getImageDisplayUrl } from '@/lib/image-url';
import { assets } from '@/lib/design-tokens';
import { useToast } from '@/hooks/use-toast';
import { useCurrency } from '@/lib/currency';
import { ListingMap } from '@/components/ListingMap';
import { PhotoGallery } from '@/components/PhotoGallery';
import { BookingCard } from '@/components/BookingCard';
import { ReviewsSection } from '@/components/ReviewsSection';
import { AmenitiesList } from '@/components/AmenitiesList';
import { ListingBadges } from '@/components/ListingBadges';
import { SafeHtml } from '@/components/SafeHtml';

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
  /** Listing owner; used to block self-booking. */
  host_id?: number;
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
  extra_services?: { id: number; name: string; price_npr: number; unit: string; description?: string | null }[];
  host?: { name: string; avatar_url: string | null; bio: string | null };
  hosts?: HostProfile[];
  sections?: Record<string, string>;
  bedrooms?: number | null;
  bathrooms?: number | null;
};
type NearbyListing = {
  id: number;
  title: string;
  location: string;
  image_url?: string | null;
  price_per_night: string | number;
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
  section_labels: { owners_story: "Homestay owner's story", history: 'History', about_us: 'About us', their_community: 'Their community', whats_included_in_price: "What's included in the price", place_history: 'Place history', attractions: 'Attractions', homestay_highlights: 'Homestay highlights', things_to_do_nearby: 'Things to do near the homestay', impact_in_community: 'Impact in the community', how_to_get_there: 'How to get there', nearby_homestays: 'Nearby homestays', faqs: 'FAQs', itinerary: 'What to Expect', host_video_intro: 'Host video introduction', local_experiences: 'Local experiences', meet_the_community: 'Meet the community', price_transparency: 'Price transparency', weather_best_time: 'Best time to visit', village_stories: 'Stories from the village', guest_photo_wall: 'Guest photo wall' },
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
  const [selectedExtraServices, setSelectedExtraServices] = useState<{ extra_service_id: number; quantity: number }[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);
  const [reviewForm, setReviewForm] = useState({ rating: 5, title: '', comment: '' });
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviews, setReviews] = useState<ReviewRow[]>([]);
  const [reviewsTotal, setReviewsTotal] = useState(0);
  const [bookingFee, setBookingFee] = useState<{ type: 'service_charge' | 'discount'; kind: 'percent' | 'fixed'; value: number } | null>(null);
  const [partialPaymentMinPercent, setPartialPaymentMinPercent] = useState(25);
  const [paymentGatewayEnabled, setPaymentGatewayEnabled] = useState(true);
  const [paymentType, setPaymentType] = useState<'full' | 'partial'>('full');
  const [partialPercent, setPartialPercent] = useState(25);
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [rejectRemarks, setRejectRemarks] = useState('');
  const [adminActionLoading, setAdminActionLoading] = useState(false);
  const [listingDisplay, setListingDisplay] = useState<ListingDisplaySettings>(DEFAULT_LISTING_DISPLAY);
  const [nearbyListings, setNearbyListings] = useState<NearbyListing[]>([]);

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
    if (!id) return;
    api
      .get<{
        booking_fee: { type: 'service_charge' | 'discount'; kind: 'percent' | 'fixed'; value: number } | null;
        partial_payment_min_percent?: number;
        payment_gateway_enabled?: boolean;
      }>(`/api/listings/${id}/booking-fee`)
      .then((res) => {
        setBookingFee(res.data.booking_fee ?? null);
        const min = res.data.partial_payment_min_percent;
        if (typeof min === 'number' && min >= 1 && min <= 100) {
          setPartialPaymentMinPercent(min);
          setPartialPercent(min);
        }
        setPaymentGatewayEnabled(res.data.payment_gateway_enabled !== false);
      })
      .catch(() => setBookingFee(null));
  }, [id]);

  useEffect(() => {
    if (!paymentGatewayEnabled) setPaymentType('full');
  }, [paymentGatewayEnabled]);

  useEffect(() => {
    if (!listing?.id || !listing.location?.trim()) {
      setNearbyListings([]);
      return;
    }
    api
      .get<{ listings: NearbyListing[] }>('/api/listings', {
        params: { location: listing.location.trim(), limit: 8, page: 1 },
      })
      .then((res) => {
        const rows = Array.isArray(res.data.listings) ? res.data.listings : [];
        setNearbyListings(rows.filter((x) => x.id !== listing.id).slice(0, 4));
      })
      .catch(() => setNearbyListings([]));
  }, [listing?.id, listing?.location]);

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
      .then((res) => {
        const raw = res.data?.blocked_dates ?? [];
        setBlockedDates(raw.map((d) => (typeof d === 'string' ? d : String(d)).slice(0, 10)));
      })
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
    const payload = {
      listing_id: listing.id,
      check_in: checkIn,
      check_out: checkOut,
      guests,
      message: message || undefined,
      payment_type: paymentType,
      ...(paymentType === 'partial' ? { partial_percent: Math.max(partialPaymentMinPercent, Math.min(99, partialPercent)) } : {}),
      ...(selectedExtraServices.length > 0 ? { extra_services: selectedExtraServices } : {}),
    };
    api
      .post<{
        redirect_url?: string;
        redirect_form?: { action: string; method: string; fields: Record<string, string> };
        booking_id: number;
        payment_id: number;
        reference: string;
        reservation_without_payment?: boolean;
        confirmation_message?: string;
      }>('/api/bookings/initiate-payment', payload)
      .then((res) => {
        if (res.data?.reservation_without_payment) {
          const msg = res.data.confirmation_message || 'Your reservation has been received.';
          toast({ title: 'Reservation received', description: msg });
          navigate('/dashboard/guest');
          setSubmitting(false);
          return;
        }
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
        <h2 className="font-display text-xl font-semibold text-foreground">Listing not found</h2>
        <p className="mt-2 text-muted-foreground">
          This homestay may have been removed or is not available.
        </p>
        <Button className="mt-4" onClick={() => navigate(backTo)}>
          Browse homestays
        </Button>
      </div>
    );

  const listingData = listing as Listing;
  const images = listingData.images?.length
    ? listingData.images.map((i) => i.url).filter((u) => Boolean(u && String(u).trim()))
    : [];
  const imageUrl = (url: string) => getImageDisplayUrl(url);
  const primaryHost =
    (listingData.hosts?.length && listingData.hosts.find((h) => h.is_primary)) ||
    listingData.hosts?.[0] ||
    null;
  const hostName =
    primaryHost?.name ||
    listingData.host?.name ||
    listingDisplay.empty_fallbacks.default_host_name;
  const primaryHostAvatarUrl =
    primaryHost?.avatar_url?.trim() ? getImageDisplayUrl(primaryHost.avatar_url) : '';
  const hostBio = primaryHost?.brief_intro || primaryHost?.bio || null;
  const hostLanguages = primaryHost?.languages_spoken?.trim() || null;
  const isSuperhost = listingData.hosts?.some((h) => h.superhost) ?? false;
  const isCulturalExpert = listingData.hosts?.some((h) => h.local_expert) ?? false;
  const averageRating =
    reviews.length > 0 ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;
  const experienceBadges = (listingData.sections?.experience_badges || 'cultural-heritage,eco-certified')
    .split(',')
    .map((x) => x.trim().toLowerCase())
    .filter(Boolean);
  const hasCultural = experienceBadges.includes('cultural-heritage');
  const hasEco = experienceBadges.includes('eco-certified');
  const isHostViewingOwnListing = Boolean(
    user &&
    ((listingData.host_id != null && user.id === Number(listingData.host_id)) ||
      (listingData.hosts?.some((h) => h.id === user.id) ?? false))
  );

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({ title: listingData.title, url: window.location.href }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast({ title: 'Link copied to clipboard.' });
    }
  };

  return (
    <div className="w-full min-h-screen bg-background pb-16">
      <div className="section-container pt-4">
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
            <div className="flex items-center gap-1 font-semibold text-primary">
              {formatPrice(listingData.price_per_night)}
              <span className="text-muted-foreground font-normal"> / night</span>
            </div>
            {(averageRating > 0 || reviewsTotal > 0) && (
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4 fill-primary text-primary" />
                <span className="font-medium">{averageRating.toFixed(1)}</span>
                <span className="text-muted-foreground">({reviewsTotal} reviews)</span>
              </div>
            )}
            {listingData.badge && (
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 shrink-0 text-primary" />
                <ListingBadges badge={listingData.badge} badgeLabels={listingDisplay.badge_labels} />
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
            {(hasCultural || hasEco) && (
              <div className="mt-4 flex flex-wrap gap-2">
                {hasCultural && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-accent/50 bg-accent/20 px-2.5 py-1 text-xs font-medium text-accent-foreground">
                    <Landmark className="w-3.5 h-3.5" />
                    Cultural Heritage
                  </span>
                )}
                {hasEco && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/40 bg-emerald-500/15 px-2.5 py-1 text-xs font-medium text-emerald-700 dark:text-emerald-200">
                    <Leaf className="w-3.5 h-3.5" />
                    Eco-certified
                  </span>
                )}
              </div>
            )}
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
                {primaryHostAvatarUrl ? (
                  <img
                    src={primaryHostAvatarUrl}
                    alt=""
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = assets.logo;
                      e.currentTarget.className = 'w-full h-full object-contain p-1.5 bg-card';
                    }}
                  />
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
                  {typeof listingData.bedrooms === 'number' && listingData.bedrooms > 0 && (
                    <span className="flex items-center gap-1">
                      <BedDouble className="w-4 h-4" />
                      {listingData.bedrooms} bedroom{listingData.bedrooms > 1 ? 's' : ''}
                    </span>
                  )}
                  {typeof listingData.bathrooms === 'number' && listingData.bathrooms > 0 && (
                    <span className="flex items-center gap-1">
                      <Bath className="w-4 h-4" />
                      {listingData.bathrooms} bathroom{listingData.bathrooms > 1 ? 's' : ''}
                    </span>
                  )}
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

            {/* Co-hosts */}
            {listingData.hosts && listingData.hosts.filter((h) => !h.is_primary).length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="space-y-4 pb-8 border-b border-border"
              >
                <h3 className="font-display text-lg font-semibold text-foreground mb-3">Co-hosts</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Other hosts who help manage this homestay.
                </p>
                <div className="space-y-4">
                  {[...listingData.hosts.filter((h) => !h.is_primary)].sort((a, b) => a.sort_order - b.sort_order).map((cohost) => {
                    const cohostAvatarUrl = cohost.avatar_url?.trim() ? getImageDisplayUrl(cohost.avatar_url) : '';
                    return (
                    <div key={cohost.id} className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-full overflow-hidden bg-primary/20 flex-shrink-0 flex items-center justify-center text-primary font-display font-semibold text-lg">
                        {cohostAvatarUrl ? (
                          <img
                            src={cohostAvatarUrl}
                            alt=""
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.onerror = null;
                              e.currentTarget.src = assets.logo;
                              e.currentTarget.className = 'w-full h-full object-contain p-1.5 bg-card';
                            }}
                          />
                        ) : (
                          (cohost.name || '?').charAt(0)
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-foreground">{cohost.name}</p>
                        {cohost.languages_spoken?.trim() && (
                          <p className="text-sm text-muted-foreground flex items-center gap-1 mt-0.5">
                            <Languages className="w-3.5 h-3.5" />
                            {cohost.languages_spoken.trim()}
                          </p>
                        )}
                        {(cohost.brief_intro || cohost.bio) && (
                          <p className="text-sm text-foreground/80 leading-relaxed mt-1">
                            {cohost.brief_intro || cohost.bio}
                          </p>
                        )}
                      </div>
                    </div>
                    );
                  })}
                </div>
              </motion.div>
            )}

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
              <SafeHtml html={listingData.description || listingDisplay.empty_fallbacks.no_description} className="text-foreground/80" />
            </motion.div>

            {/* Reference-style rich sections from host/admin-configurable listing sections */}
            {listingData.sections?.itinerary?.trim() && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.33 }} className="pb-8 border-b border-border">
                <h3 className="font-display text-2xl font-semibold text-foreground mb-4">
                  {listingDisplay.section_labels.itinerary ?? 'What to Expect'}
                </h3>
                <SafeHtml html={listingData.sections.itinerary} className="text-foreground/80" />
              </motion.div>
            )}

            {listingData.sections?.host_video_intro?.trim() && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.34 }} className="pb-8 border-b border-border">
                <h3 className="font-display text-2xl font-semibold text-foreground mb-4">
                  {listingDisplay.section_labels.host_video_intro ?? 'Host video introduction'}
                </h3>
                <SafeHtml html={listingData.sections.host_video_intro} className="text-foreground/80" />
              </motion.div>
            )}

            {listingData.sections?.local_experiences?.trim() && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className="pb-8 border-b border-border">
                <h3 className="font-display text-2xl font-semibold text-foreground mb-4">
                  {listingDisplay.section_labels.local_experiences ?? 'Local experiences'}
                </h3>
                <SafeHtml html={listingData.sections.local_experiences} className="text-foreground/80" />
              </motion.div>
            )}

            {listingData.sections?.meet_the_community?.trim() && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.36 }} className="pb-8 border-b border-border">
                <h3 className="font-display text-2xl font-semibold text-foreground mb-4">
                  {listingDisplay.section_labels.meet_the_community ?? 'Meet the community'}
                </h3>
                <SafeHtml html={listingData.sections.meet_the_community} className="text-foreground/80" />
              </motion.div>
            )}

            {listingData.sections?.price_transparency?.trim() && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.37 }} className="pb-8 border-b border-border">
                <h3 className="font-display text-2xl font-semibold text-foreground mb-4">
                  {listingDisplay.section_labels.price_transparency ?? 'Price transparency'}
                </h3>
                <SafeHtml html={listingData.sections.price_transparency} className="text-foreground/80" />
              </motion.div>
            )}

            {listingData.sections?.weather_best_time?.trim() && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.38 }} className="pb-8 border-b border-border">
                <h3 className="font-display text-2xl font-semibold text-foreground mb-4">
                  {listingDisplay.section_labels.weather_best_time ?? 'Best time to visit'}
                </h3>
                <SafeHtml html={listingData.sections.weather_best_time} className="text-foreground/80" />
              </motion.div>
            )}

            {listingData.sections?.village_stories?.trim() && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.39 }} className="pb-8 border-b border-border">
                <h3 className="font-display text-2xl font-semibold text-foreground mb-4">
                  {listingDisplay.section_labels.village_stories ?? 'Stories from the village'}
                </h3>
                <SafeHtml html={listingData.sections.village_stories} className="text-foreground/80" />
              </motion.div>
            )}

            {listingData.sections?.guest_photo_wall?.trim() && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="pb-8 border-b border-border">
                <h3 className="font-display text-2xl font-semibold text-foreground mb-4">
                  {listingDisplay.section_labels.guest_photo_wall ?? 'Guest photo wall'}
                </h3>
                <SafeHtml html={listingData.sections.guest_photo_wall} className="text-foreground/80" />
              </motion.div>
            )}

            {/* Dynamic sections (except special handled and facility_* keys) */}
            {listingData.sections &&
              Object.entries(listingData.sections).map(([key, content]) => {
                if (
                  key === 'how_to_get_there' ||
                  key === 'itinerary' ||
                  key === 'host_video_intro' ||
                  key === 'local_experiences' ||
                  key === 'meet_the_community' ||
                  key === 'price_transparency' ||
                  key === 'weather_best_time' ||
                  key === 'village_stories' ||
                  key === 'guest_photo_wall' ||
                  key === 'experience_badges' ||
                  key.startsWith('facility_') ||
                  !content?.trim()
                ) return null;
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
                        <SafeHtml html={content} className="text-foreground/80" />
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
                    <SafeHtml html={content} className="text-foreground/80" />
                  </motion.div>
                );
              })}

            {/* Amenities */}
            <AmenitiesList amenities={listingData.amenities || []} sections={listingData.sections} />

            {/* Extra services (paid add-ons) */}
            {listingData.extra_services && listingData.extra_services.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="py-8 border-t border-border"
              >
                <h3 className="font-display text-2xl font-semibold text-foreground mb-4">Extra services</h3>
                <p className="text-muted-foreground text-sm mb-4">Optional paid add-ons you can select when booking.</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {listingData.extra_services.map((s) => (
                    <div key={s.id} className="p-4 rounded-xl bg-muted/50 border border-border">
                      <p className="font-medium text-foreground">{s.name}</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        NPR {Number(s.price_npr).toLocaleString()}
                        {s.unit === 'per_person' && ' per person'}
                        {s.unit === 'per_group' && ' per group'}
                        {s.unit === 'fixed' && ' (fixed)'}
                      </p>
                      {s.description && <p className="text-sm text-foreground/80 mt-2">{s.description}</p>}
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

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
                latitude={listingData.latitude != null ? Number(listingData.latitude) : undefined}
                longitude={listingData.longitude != null ? Number(listingData.longitude) : undefined}
                title={listingData.title}
                className="mb-4 rounded-xl overflow-hidden"
              />
              {(listingData.way_to_get_there || listingData.sections?.how_to_get_there) ? (
                <SafeHtml html={listingData.sections?.how_to_get_there?.trim() || listingData.way_to_get_there || ''} className="text-foreground/80" />
              ) : (
                <p className="text-muted-foreground">{listingDisplay.empty_fallbacks.no_directions}</p>
              )}
            </motion.div>

            {nearbyListings.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }} className="pb-8 border-t border-border pt-8">
                <h3 className="font-display text-2xl font-semibold text-foreground mb-4">
                  {listingDisplay.section_labels.nearby_homestays ?? 'Nearby homestays'}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {nearbyListings.map((n) => (
                    <Link key={n.id} to={`/listings/${n.id}`} className="group rounded-xl border border-border bg-card overflow-hidden hover:shadow-lg transition-shadow">
                      <div className="aspect-[16/10] overflow-hidden">
                        <img src={getImageDisplayUrl(n.image_url || '')} alt={n.title} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      </div>
                      <div className="p-3">
                        <p className="font-medium text-foreground line-clamp-1">{n.title}</p>
                        <p className="text-xs text-muted-foreground mt-1">{n.location}</p>
                        <p className="text-sm text-primary font-semibold mt-2">{formatPrice(n.price_per_night)}<span className="text-muted-foreground font-normal"> / night</span></p>
                      </div>
                    </Link>
                  ))}
                </div>
              </motion.div>
            )}
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
            ) : isHostViewingOwnListing ? (
              <Card className="border-border shadow-lg">
                <CardHeader>
                  <h3 className="font-semibold text-foreground">Your homestay</h3>
                  <p className="text-sm text-muted-foreground">
                    You can’t book or reserve a stay at your own listing. Open the host dashboard to manage
                    this homestay, calendar, and guest bookings.
                  </p>
                </CardHeader>
                <CardContent>
                  <Button asChild className="w-full">
                    <Link to="/dashboard/host?tab=listings">Go to host dashboard</Link>
                  </Button>
                </CardContent>
              </Card>
            ) : (
              user?.role !== 'admin' && (
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
                  submitLabel={
                    paymentGatewayEnabled ? "You won't be charged yet" : 'We will confirm your stay by phone or email.'
                  }
                  bookingFee={bookingFee}
                  trustBadges={listingDisplay.trust_badges}
                  paymentGatewayEnabled={paymentGatewayEnabled}
                  paymentType={paymentType}
                  partialPercent={partialPercent}
                  partialPaymentMinPercent={partialPaymentMinPercent}
                  onPaymentTypeChange={setPaymentType}
                  onPartialPercentChange={setPartialPercent}
                  extraServices={listingData.extra_services}
                  selectedExtraServices={selectedExtraServices}
                  onExtraServicesChange={setSelectedExtraServices}
                />
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
