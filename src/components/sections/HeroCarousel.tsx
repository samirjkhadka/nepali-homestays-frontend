import { useState, useEffect, useRef, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, ChevronDown, MapPin, Star, Compass, Users, Eye, User } from 'lucide-react';

import { useCurrency } from '@/lib/currency';
import { getImageDisplayUrl } from '@/lib/image-url';
import { getHomeDisplayRating, getHomeDisplayReviewCountLabel } from '@/lib/home-listing-ratings';

const FALLBACK_SLIDES = [
  { image: '/hero-1.jpg', title: 'Experience Authentic Nepal', subtitle: 'Stay with local families in the heart of the Himalayas' },
  { image: '/hero-2.jpg', title: 'Discover Mountain Villages', subtitle: 'Immerse yourself in rich cultural traditions' },
  { image: '/hero-3.jpg', title: 'Warm Nepali Hospitality', subtitle: 'Feel at home in traditional homestays' },
];

type Listing = {
  id: number;
  title: string;
  location: string;
  price_per_night: string | number;
  max_guests: number;
  image_url?: string | null;
  average_rating: number | null;
  review_count: number;
  badge?: string | null;
  /** Optional: returned when the API extends hero payloads. */
  description?: string | null;
  /** Optional: future API. */
  bedrooms?: number | null;
  bathrooms?: number | null;
  host_name?: string | null;
  hosting_since?: string | null;
};

type Props = { listings: Listing[]; heroLoaded?: boolean };

function listingImageUrl(url: string | null | undefined): string {
  if (!url) return '';
  return getImageDisplayUrl(url);
}

function locationRegionLabel(location: string): string | null {
  const parts = location.split(',').map((s) => s.trim()).filter(Boolean);
  if (parts.length < 2) return null;
  return parts[parts.length - 1] ?? null;
}

function isSuperhostBadge(badge: string | null | undefined): boolean {
  if (!badge) return false;
  return badge
    .split(/[,|]/)
    .map((s) => s.trim().toLowerCase())
    .some((s) => s === 'superhost' || s.includes('superhost'));
}

function plainTextExcerpt(text: string | null | undefined, maxLen = 220): string {
  if (!text) return '';
  const noTags = text.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  if (noTags.length <= maxLen) return noTags;
  return `${noTags.slice(0, maxLen).trim()}…`;
}

export default function HeroCarousel({ listings, heroLoaded = true }: Props) {
  const { format: formatPrice } = useCurrency();
  const [index, setIndex] = useState(0);
  const [viewportHeight, setViewportHeight] = useState<number | null>(null);
  const sectionRef = useRef<HTMLElement | null>(null);

  const useListings = listings.length > 0;
  const waitingForHeroData = !heroLoaded && listings.length === 0;
  const slides = useListings
    ? listings.map((l) => ({
        kind: 'listing' as const,
        id: l.id,
        image: listingImageUrl(l.image_url) || FALLBACK_SLIDES[0].image,
        name: l.title,
        location: l.location,
        pricePerNight: l.price_per_night,
        maxGuests: l.max_guests,
        averageRating: l.average_rating,
        reviewCount: Number(l.review_count) || 0,
        badge: l.badge ?? null,
        description: l.description,
        bedrooms: l.bedrooms,
        bathrooms: l.bathrooms,
        hostName: l.host_name,
        hostSince: l.hosting_since,
        province: locationRegionLabel(l.location),
        isSuperhost: isSuperhostBadge(l.badge),
      }))
    : FALLBACK_SLIDES.map((s) => ({
        kind: 'fallback' as const,
        image: s.image,
        name: s.title,
        location: s.subtitle,
        blurb: s.subtitle,
      }));
  const count = slides.length;
  const hasMultiple = count > 1;
  const s = slides[index];
  const slideKey = s.kind === 'listing' ? `listing-${s.id}` : `fallback-${index}`;

  const imageUrlsToPreload = useMemo(() => {
    if (listings.length > 0) {
      return listings.map((l) => listingImageUrl(l.image_url) || FALLBACK_SLIDES[0].image);
    }
    return FALLBACK_SLIDES.map((s) => s.image);
  }, [listings]);

  useEffect(() => {
    for (const url of imageUrlsToPreload) {
      if (!url) continue;
      const im = new Image();
      im.src = url;
    }
  }, [imageUrlsToPreload]);

  useEffect(() => {
    if (!hasMultiple) return;
    const timer = setInterval(() => setIndex((i) => (i + 1) % count), 7000);
    return () => clearInterval(timer);
  }, [count, hasMultiple]);

  const nextSlide = () => setIndex((i) => (i + 1) % count);
  const prevSlide = () => setIndex((i) => (i - 1 + count) % count);

  const isListing = s.kind === 'listing';

  const descriptionText = (() => {
    if (isListing) {
      return s.description ? plainTextExcerpt(s.description) : '';
    }
    return plainTextExcerpt(s.blurb, 200);
  })();

  useEffect(() => {
    const updateViewportHeight = () => {
      const top = sectionRef.current?.getBoundingClientRect().top ?? 0;
      const next = Math.max(520, Math.floor(window.innerHeight - Math.max(0, top)));
      setViewportHeight(next);
    };
    updateViewportHeight();
    window.addEventListener('resize', updateViewportHeight);
    window.addEventListener('orientationchange', updateViewportHeight);
    return () => {
      window.removeEventListener('resize', updateViewportHeight);
      window.removeEventListener('orientationchange', updateViewportHeight);
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative min-h-[520px] overflow-hidden"
      style={viewportHeight ? { height: `${viewportHeight}px` } : undefined}
      aria-label="Homestays carousel"
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={slideKey}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
          className="absolute inset-0"
        >
          <img
            src={s.image}
            alt={s.name}
            className="w-full h-full object-cover animate-ken-burns"
            loading="eager"
            fetchPriority="high"
            decoding="async"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-black/45" aria-hidden />
          <div className="absolute inset-0 bg-gradient-to-r from-black/45 to-transparent" aria-hidden />
        </motion.div>
      </AnimatePresence>

      <motion.div
        animate={{ y: [0, 8, 0] }}
        transition={{ repeat: Infinity, duration: 1.8, ease: 'easeInOut' }}
        className="absolute bottom-2 left-1/2 -translate-x-1/2 z-10 text-white/70 hidden md:flex flex-col items-center gap-1 text-[10px] uppercase tracking-widest"
      >
        Scroll
        <ChevronDown className="w-4 h-4" />
      </motion.div>

      <div className="relative z-10 h-full flex flex-col justify-end pb-8 md:pb-12">
        <div className="section-container w-full space-y-6 md:space-y-8">
          {waitingForHeroData && (
            <div className="h-[260px] md:h-[320px] rounded-2xl bg-black/20 border border-white/10 backdrop-blur-sm animate-pulse" />
          )}
          <AnimatePresence mode="wait">
            {!waitingForHeroData && (
            <motion.div
              key={slideKey}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.35 }}
            >
              {isListing && (
                <div className="flex flex-wrap items-center gap-2 mb-3 md:mb-4">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md border border-white/20">
                    <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" aria-hidden />
                    <span className="text-white text-xs font-semibold">
                      {getHomeDisplayRating(s.id, s.averageRating, s.reviewCount)}
                    </span>
                    <span className="text-white/60 text-xs">
                      ({getHomeDisplayReviewCountLabel(s.reviewCount)})
                    </span>
                  </div>
                  {s.isSuperhost && (
                    <span className="text-xs bg-accent/90 text-accent-foreground px-3 py-1 rounded-full font-semibold">★ Superhost</span>
                  )}
                  {s.province && (
                    <span className="text-xs bg-secondary/80 text-secondary-foreground px-3 py-1 rounded-full font-medium">
                      {s.province}
                    </span>
                  )}
                </div>
              )}

              <h1
                className="font-display text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold text-white mb-2 md:mb-3 leading-tight text-shadow-hero"
              >
                {s.name}
              </h1>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-white/80 mb-3 md:mb-4">
                <span className="flex items-center gap-1.5 text-sm md:text-base">
                  <MapPin className="w-4 h-4 shrink-0" aria-hidden />
                  {s.location}
                </span>
                {isListing && (
                  <>
                    <span className="hidden sm:inline text-white/40">•</span>
                    <span className="flex items-center gap-1.5 text-sm md:text-base">
                      <Users className="w-4 h-4 shrink-0" aria-hidden />
                      {s.maxGuests} guest{s.maxGuests !== 1 ? 's' : ''}
                      {typeof s.bedrooms === 'number' && typeof s.bathrooms === 'number' && (
                        <>
                          {' '}
                          · {s.bedrooms} bed · {s.bathrooms} bath
                        </>
                      )}
                    </span>
                  </>
                )}
              </div>

              {descriptionText && (
                <p className="text-sm md:text-base text-white/70 mb-4 md:mb-5 max-w-xl line-clamp-2">{descriptionText}</p>
              )}

              <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
                {isListing && s.hostName && (
                  <>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-white/20 backdrop-blur-sm border-2 border-white/30 flex items-center justify-center">
                        <User className="w-5 h-5 md:w-6 md:h-6 text-white" />
                      </div>
                      <div>
                        <p className="text-white text-sm font-semibold">{s.hostName}</p>
                        {s.hostSince && <p className="text-white/50 text-xs">Hosting since {s.hostSince}</p>}
                      </div>
                    </div>
                    <div className="hidden sm:block w-px h-10 bg-white/20" />
                  </>
                )}

                {isListing && (
                  <div>
                    <span className="text-white text-xl md:text-2xl font-bold">{formatPrice(s.pricePerNight)}</span>
                    <span className="text-white/50 text-sm"> / night</span>
                  </div>
                )}

                {isListing ? (
                  <Link
                    to={`/listings/${s.id}`}
                    className="btn-cta inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-warm text-primary-foreground rounded-xl font-semibold text-sm md:text-base sm:ml-auto tap-target"
                  >
                    <Eye className="w-4 h-4" />
                    View &amp; Book
                  </Link>
                ) : (
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:ml-auto w-full sm:w-auto">
                    <Link
                      to="/search"
                      className="btn-cta inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-warm text-primary-foreground rounded-xl font-semibold text-sm md:text-base w-full sm:w-auto tap-target"
                    >
                      <Compass className="w-4 h-4" />
                      Explore Homestays
                    </Link>
                  </div>
                )}
              </div>
            </motion.div>
            )}
          </AnimatePresence>

          <div className="flex items-center justify-between">
              <div className="flex gap-2">
                {slides.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setIndex(i)}
                    className={`transition-all duration-300 rounded-full h-2 ${
                      i === index ? 'w-8 bg-white' : 'w-2 bg-white/40 hover:bg-white/60'
                    }`}
                    aria-label={`Go to slide ${i + 1}`}
                  />
                ))}
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={prevSlide}
                  disabled={!hasMultiple}
                  className={`p-2 rounded-full border border-white/10 transition-colors ${
                    hasMultiple ? 'bg-white/10 backdrop-blur-sm hover:bg-white/20' : 'bg-white/5 text-white/40 cursor-not-allowed'
                  }`}
                  aria-label="Previous slide"
                >
                  <ChevronLeft className="w-4 h-4 text-white" />
                </button>
                <button
                  type="button"
                  onClick={nextSlide}
                  disabled={!hasMultiple}
                  className={`p-2 rounded-full border border-white/10 transition-colors ${
                    hasMultiple ? 'bg-white/10 backdrop-blur-sm hover:bg-white/20' : 'bg-white/5 text-white/40 cursor-not-allowed'
                  }`}
                  aria-label="Next slide"
                >
                  <ChevronRight className="w-4 h-4 text-white" />
                </button>
              </div>
            </div>
        </div>
      </div>
    </section>
  );
}
