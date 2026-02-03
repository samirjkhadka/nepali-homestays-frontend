import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, MapPin, Star, Home, Compass } from 'lucide-react';

import { useCurrency } from '@/lib/currency';
import { getImageDisplayUrl } from '@/lib/image-url';

// Hero images are in public/ and served at root (no JS import for public assets in Vite)
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
};

type Props = { listings: Listing[] };

function listingImageUrl(url: string | null | undefined): string {
  if (!url) return '';
  return getImageDisplayUrl(url);
}

export default function HeroCarousel({ listings }: Props) {
  const navigate = useNavigate();
  const { format: formatPrice } = useCurrency();
  const [index, setIndex] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const useListings = listings.length > 0;
  const slides = useListings
    ? listings.map((l) => ({
        type: 'listing' as const,
        id: l.id,
        image: listingImageUrl(l.image_url) || FALLBACK_SLIDES[0].image,
        title: l.title,
        subtitle: l.location,
        price: l.price_per_night,
        average_rating: l.average_rating,
        review_count: l.review_count,
      }))
    : FALLBACK_SLIDES.map((s) => ({ type: 'fallback' as const, ...s }));
  const count = slides.length;
  const hasMultiple = count > 1;

  useEffect(() => {
    if (!hasMultiple) return;
    intervalRef.current = setInterval(() => {
      setIndex((i) => (i + 1) % count);
    }, 5000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [count, hasMultiple]);

  const nextSlide = () => setIndex((i) => (i + 1) % count);
  const prevSlide = () => setIndex((i) => (i - 1 + count) % count);

  const current = slides[index];
  const isListing = useListings && 'id' in current;

  return (
    <section className="relative h-screen overflow-hidden" aria-label="Homestays carousel">
      {slides.map((slide, i) => (
        <div
          key={'id' in slide ? `listing-${slide.id}` : `fallback-${i}`}
          className={`absolute inset-0 transition-opacity duration-1000 ${
            i === index ? 'z-0 opacity-100' : 'z-0 opacity-0'
          }`}
          aria-hidden={i !== index}
        >
          <img
            src={String(slide.image)}
            alt={slide.title}
            className="h-full w-full object-cover"
            loading={i === index ? 'eager' : 'lazy'}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-black/60" aria-hidden />
        </div>
      ))}

      <div className="relative z-10 flex h-full items-center justify-center text-center">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h1 className="mb-6 text-5xl font-bold text-white drop-shadow-lg md:text-7xl font-serif">
              {current.title}
            </h1>
            <p className="mb-4 flex items-center justify-center gap-2 text-xl text-white/90 drop-shadow-md md:text-2xl">
              <MapPin className="h-5 w-5 shrink-0" aria-hidden />
              {current.subtitle}
            </p>
            {useListings && 'price' in current && (
              <div className="mb-6 flex flex-wrap items-center justify-center gap-4 text-lg text-white/95 drop-shadow-md">
                <span className="font-semibold">{formatPrice(current.price)}</span>
                <span className="text-white/80">/night</span>
                {'review_count' in current && (
                  <span className="flex items-center gap-1">
                    <Star className="h-5 w-5 fill-amber-400 text-amber-400" aria-hidden />
                    {current.review_count === 0
                      ? 'No reviews yet'
                      : `${Number(current.average_rating ?? 0).toFixed(1)} (${current.review_count} ${current.review_count === 1 ? 'review' : 'reviews'})`}
                  </span>
                )}
              </div>
            )}
            <div className="flex flex-wrap items-center justify-center gap-4">
              {isListing && 'id' in current ? (
                <button
                  type="button"
                  onClick={() => navigate(`/listings/${current.id}`)}
                  className="rounded-full bg-primary px-8 py-4 text-lg font-semibold text-primary-foreground shadow-lg transition-all hover:scale-105 hover:bg-primary/90 flex items-center justify-center gap-2"
                >
                  <Home className="w-5 h-5" aria-hidden />
                  View homestay
                </button>
              ) : null}
              <button
                type="button"
                onClick={() => navigate('/search')}
                className="rounded-full bg-white/20 px-8 py-4 text-lg font-semibold text-white backdrop-blur-sm transition-all hover:scale-105 hover:bg-white/30 flex items-center justify-center gap-2"
              >
                <Compass className="w-5 h-5" aria-hidden />
                Explore Homestays
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation arrows */}
      {hasMultiple && (
        <>
          <button
            type="button"
            onClick={prevSlide}
            className="absolute left-4 top-1/2 z-20 -translate-y-1/2 rounded-full bg-white/20 p-3 backdrop-blur-sm transition-colors hover:bg-white/30 md:left-8"
            aria-label="Previous slide"
          >
            <ChevronLeft className="h-6 w-6 text-white" />
          </button>
          <button
            type="button"
            onClick={nextSlide}
            className="absolute right-4 top-1/2 z-20 -translate-y-1/2 rounded-full bg-white/20 p-3 backdrop-blur-sm transition-colors hover:bg-white/30 md:right-8"
            aria-label="Next slide"
          >
            <ChevronRight className="h-6 w-6 text-white" />
          </button>
        </>
      )}

      {/* Slide indicators */}
      {hasMultiple && (
        <div className="absolute bottom-8 left-1/2 z-20 flex -translate-x-1/2 gap-3">
          {slides.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setIndex(i)}
              className={`h-3 rounded-full transition-all ${
                i === index ? 'w-8 bg-white' : 'w-3 bg-white/50 hover:bg-white/70'
              }`}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>
      )}

      {/* Scroll indicator */}
      <div
        className="absolute bottom-24 left-1/2 z-20 -translate-x-1/2 animate-bounce"
        aria-hidden
      >
        <div className="flex h-10 w-6 flex-col items-center justify-start rounded-full border-2 border-white/50 pt-2">
          <div className="h-3 w-1 rounded-full bg-white/70" />
        </div>
      </div>
    </section>
  );
}
