import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Star, MapPin, Heart, Bed } from 'lucide-react';
import { useCurrency } from '@/lib/currency';
import { getImageDisplayUrl } from '@/lib/image-url';
import { ListingBadges } from '@/components/ListingBadges';

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

export default function FeaturedHomestays({ listings, loading, error }: Props) {
  const { format: formatPrice } = useCurrency();

  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <h2 className="font-display text-3xl font-bold text-primary-800 md:text-4xl mb-4">
            Featured Homestays
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Hand-picked homestays for an authentic Nepali experience
          </p>
        </motion.div>

        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="rounded-2xl border border-border bg-card overflow-hidden animate-pulse"
              >
                <div className="h-48 bg-muted" />
                <div className="p-4 space-y-3">
                  <div className="h-5 bg-muted rounded w-3/4" />
                  <div className="h-4 bg-muted rounded w-1/2" />
                  <div className="h-4 bg-muted rounded w-1/3" />
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
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            {listings.map((listing) => (
              <motion.div key={listing.id} variants={cardVariants}>
                <Link
                  to={`/listings/${listing.id}`}
                  className="group block rounded-2xl border border-border bg-card overflow-hidden shadow-sm transition-all hover:shadow-lg hover:border-primary/30"
                >
                  <div className="relative aspect-[4/3] overflow-hidden">
                    <img
                      src={
                        listing.image_url
                          ? getImageDisplayUrl(listing.image_url)
                          : ''
                      }
                      alt={listing.title}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
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
                    {listing.badge && (
                      <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                        <ListingBadges badge={listing.badge} badgeLabels={BADGE_LABELS} compact />
                      </div>
                    )}
                    <button
                      type="button"
                      className="absolute top-3 right-3 rounded-full bg-background/80 p-2 backdrop-blur-sm transition-colors hover:bg-background"
                      aria-label="Add to wishlist"
                      onClick={(e) => e.preventDefault()}
                    >
                      <Heart className="h-5 w-5 text-muted-foreground" />
                    </button>
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-primary-800 group-hover:text-primary line-clamp-2">
                      {listing.title}
                    </h3>
                    <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4 shrink-0" />
                      <span className="line-clamp-1">{listing.location}</span>
                    </p>
                    <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
                      {listing.review_count != null && listing.review_count > 0 && (
                        <span className="flex items-center gap-1">
                          <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                          {Number(listing.average_rating ?? 0).toFixed(1)} ({listing.review_count})
                        </span>
                      )}
                      <span className="flex items-center gap-1 text-muted-foreground">
                        <Bed className="h-4 w-4" />
                        {listing.max_guests} guest{listing.max_guests !== 1 ? 's' : ''}
                      </span>
                    </div>
                    <p className="mt-3 font-semibold text-primary">
                      {formatPrice(listing.price_per_night)}
                      <span className="text-muted-foreground font-normal"> / night</span>
                    </p>
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
      </div>
    </section>
  );
}
