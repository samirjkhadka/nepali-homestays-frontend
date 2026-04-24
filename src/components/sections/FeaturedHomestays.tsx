import { Link } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Star, MapPin, Heart, Scale, Landmark, Leaf } from 'lucide-react';
import { useCurrency } from '@/lib/currency';
import { getImageDisplayUrl } from '@/lib/image-url';
import { getHomeDisplayRating, getHomeDisplayReviewCountLabel } from '@/lib/home-listing-ratings';
import { ListingBadges } from '@/components/ListingBadges';
import { useToast } from '@/hooks/use-toast';

type Listing = {
  id: number;
  title: string;
  location: string;
  price_per_night: string | number;
  max_guests: number;
  image_url?: string | null;
  badge?: string | null;
  average_rating?: number | null;
  review_count?: number;
};

const BADGE_LABELS: Record<string, string> = {
  recommended: 'Recommended',
  featured: 'Featured',
  new: 'New',
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

type Props = {
  listings: Listing[];
  loading: boolean;
  error: string | null;
};

const FEATURED_MAX = 6;
const COMPARE_MAX = 4;
const WISHLIST_STORAGE_KEY = 'nh-local-wishlist-listing-ids-v1';
const COMPARE_STORAGE_KEY = 'nh-local-compare-listing-ids-v1';
const COMPARE_UPDATED_EVENT = 'nh-compare-updated';
const EXPERIENCE_CHIPS = [
  { key: 'cultural-heritage', label: 'Cultural Heritage', icon: Landmark },
  { key: 'eco-certified', label: 'Eco-certified', icon: Leaf },
];

export default function FeaturedHomestays({ listings, loading, error }: Props) {
  const { format: formatPrice } = useCurrency();
  const { toast } = useToast();
  const displayListings = listings.slice(0, FEATURED_MAX);
  const [wishlistIds, setWishlistIds] = useState<number[]>([]);
  const [compareIds, setCompareIds] = useState<number[]>([]);

  useEffect(() => {
    try {
      const rawWishlist = localStorage.getItem(WISHLIST_STORAGE_KEY);
      if (rawWishlist) {
        const parsed = JSON.parse(rawWishlist) as unknown;
        if (Array.isArray(parsed)) {
          setWishlistIds(parsed.filter((x) => Number.isInteger(x)).map((x) => Number(x)));
        }
      }
      const rawCompare = localStorage.getItem(COMPARE_STORAGE_KEY);
      if (rawCompare) {
        const parsed = JSON.parse(rawCompare) as unknown;
        if (Array.isArray(parsed)) {
          setCompareIds(parsed.filter((x) => Number.isInteger(x)).map((x) => Number(x)).slice(0, COMPARE_MAX));
        }
      }
    } catch {
      setWishlistIds([]);
      setCompareIds([]);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(wishlistIds));
  }, [wishlistIds]);
  useEffect(() => {
    localStorage.setItem(COMPARE_STORAGE_KEY, JSON.stringify(compareIds));
    window.dispatchEvent(new Event(COMPARE_UPDATED_EVENT));
  }, [compareIds]);

  const compareSet = useMemo(() => new Set(compareIds), [compareIds]);
  const wishlistSet = useMemo(() => new Set(wishlistIds), [wishlistIds]);

  const toggleWishlist = (listingId: number) => {
    setWishlistIds((prev) => {
      const exists = prev.includes(listingId);
      const next = exists ? prev.filter((id) => id !== listingId) : [...prev, listingId];
      toast({ title: exists ? 'Removed from wishlist' : 'Saved to wishlist' });
      return next;
    });
  };

  const toggleCompare = (listingId: number) => {
    setCompareIds((prev) => {
      if (prev.includes(listingId)) {
        toast({ title: 'Removed from compare' });
        return prev.filter((id) => id !== listingId);
      }
      if (prev.length >= COMPARE_MAX) {
        toast({ title: `You can compare up to ${COMPARE_MAX} homestays.` });
        return prev;
      }
      toast({ title: 'Added to compare' });
      return [...prev, listingId];
    });
  };

  return (
    <section className="py-20 bg-background">
      <div className="section-container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <span className="text-primary font-medium text-sm uppercase tracking-wider">
            Handpicked for You
          </span>
          <h2 className="font-display text-4xl md:text-5xl font-bold text-foreground mt-2 mb-4">
            Featured Homestays
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Discover our most loved homestays, carefully selected for their authentic experiences and warm hospitality
          </p>
        </motion.div>

        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="rounded-2xl border border-border bg-card overflow-hidden animate-pulse"
              >
                <div className="aspect-[4/3] bg-muted" />
                <div className="p-4 space-y-3">
                  <div className="h-4 bg-muted rounded w-2/3" />
                  <div className="h-6 bg-muted rounded w-4/5" />
                  <div className="h-4 bg-muted rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        )}

        {error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="rounded-xl border border-destructive/50 bg-destructive/10 px-4 py-3 text-center text-destructive"
          >
            {error}
          </motion.div>
        )}

        {!loading && !error && listings.length > 0 && (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch"
          >
            {displayListings.map((listing, index) => (
              <motion.div key={listing.id} variants={cardVariants} whileHover={{ y: -8 }} className="h-full">
                <Link
                  to={`/listings/${listing.id}`}
                  className="group flex flex-col h-full rounded-2xl border border-border bg-card overflow-hidden shadow-soft hover:shadow-elevated hover:ring-2 hover:ring-primary/30 transition-all duration-300"
                >
                  <div className="relative aspect-[4/3] overflow-hidden shrink-0">
                    <img
                      src={
                        listing.image_url
                          ? getImageDisplayUrl(listing.image_url)
                          : ''
                      }
                      alt={listing.title}
                      className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        target.nextElementSibling?.classList.remove('hidden');
                      }}
                    />
                    <div
                      className="hidden absolute inset-0 bg-muted flex items-center justify-center text-muted-foreground"
                      aria-hidden
                    >
                      <span className="text-sm">No image</span>
                    </div>
                    <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                      {index === 0 && (
                        <div className="px-3 py-1 bg-gradient-to-r from-primary to-primary-700 text-primary-foreground text-[10px] font-bold rounded-full shadow-md uppercase tracking-wider">
                          Featured
                        </div>
                      )}
                      {listing.badge && (
                        <ListingBadges badge={listing.badge} badgeLabels={BADGE_LABELS} compact />
                      )}
                    </div>
                    <div className="absolute top-3 right-3 flex gap-1.5">
                      <button
                        type="button"
                        className="p-2 rounded-full bg-card/80 hover:bg-card transition-colors"
                        aria-label="Save to wishlist"
                        onClick={(e) => {
                          e.preventDefault();
                          toggleWishlist(listing.id);
                        }}
                      >
                        <Heart className={`w-4 h-4 ${wishlistSet.has(listing.id) ? 'fill-primary text-primary' : 'text-foreground'}`} />
                      </button>
                      <button
                        type="button"
                        className={`p-2 rounded-full transition-colors ${compareSet.has(listing.id) ? 'bg-primary text-primary-foreground' : 'bg-card/80 hover:bg-card text-foreground'}`}
                        aria-label="Compare homestay"
                        onClick={(e) => {
                          e.preventDefault();
                          toggleCompare(listing.id);
                        }}
                      >
                        <Scale className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="absolute bottom-2 left-2 right-2 flex flex-wrap gap-1.5">
                      {EXPERIENCE_CHIPS.map((chip) => {
                        const Icon = chip.icon;
                        return (
                          <span
                            key={`${listing.id}-${chip.key}`}
                            className="inline-flex items-center gap-1 rounded-full border border-white/35 bg-black/40 px-2 py-0.5 text-[10px] font-medium text-white backdrop-blur-sm"
                          >
                            <Icon className="h-3 w-3" />
                            {chip.label}
                          </span>
                        );
                      })}
                    </div>
                    {listing.badge && (
                      <div className="absolute bottom-2 right-2 rounded-full bg-primary/90 px-2 py-0.5 text-[10px] font-semibold text-primary-foreground">
                        {BADGE_LABELS[String(listing.badge).split(',')[0]?.trim()] || 'Featured'}
                      </div>
                    )}
                  </div>

                  <div className="p-4">
                    <div className="flex items-center gap-1 text-sm text-muted-foreground mb-2">
                      <MapPin className="h-4 w-4 shrink-0" />
                      <span className="line-clamp-1">{listing.location}</span>
                    </div>
                    <h3 className="font-display text-lg font-semibold text-foreground mb-2 group-hover:text-primary transition-colors line-clamp-2">
                      {listing.title}
                    </h3>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1 text-sm">
                        <Star className="w-4 h-4 fill-accent text-accent" />
                        <span className="font-medium">
                          {getHomeDisplayRating(listing.id, listing.average_rating, listing.review_count ?? 0)}
                        </span>
                        <span className="text-muted-foreground">
                          ({getHomeDisplayReviewCountLabel(listing.review_count ?? 0)})
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="font-semibold text-primary">{formatPrice(listing.price_per_night)}</span>
                        <span className="text-muted-foreground text-sm">/night</span>
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        )}

        {!loading && !error && listings.length === 0 && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center text-muted-foreground py-12"
          >
            No featured homestays at the moment. Check back soon.
          </motion.p>
        )}

        {!loading && !error && listings.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mt-12"
          >
            <Link to="/search">
              <button className="px-8 py-3 border-2 border-primary text-primary font-semibold rounded-full hover:bg-primary hover:text-primary-foreground transition-all">
                View All Homestays
              </button>
            </Link>
          </motion.div>
        )}
      </div>
    </section>
  );
}
