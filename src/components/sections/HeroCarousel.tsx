import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';

import hero1 from '../../../assets/hero-1.jpg';
import hero2 from '../../../assets/hero-2.jpg';
import hero3 from '../../../assets/hero-3.jpg';

const HERO_SLIDES = [
  {
    image: hero1,
    title: 'Experience Authentic Nepal',
    subtitle: 'Stay with local families in the heart of the Himalayas',
  },
  {
    image: hero2,
    title: 'Discover Mountain Villages',
    subtitle: 'Immerse yourself in rich cultural traditions',
  },
  {
    image: hero3,
    title: 'Warm Nepali Hospitality',
    subtitle: 'Feel at home in traditional homestays',
  },
];

type Listing = {
  id: number;
  title: string;
  location: string;
  price_per_night: string;
  max_guests: number;
  image_url?: string | null;
};

type Props = { listings: Listing[] };

export default function HeroCarousel({ listings }: Props) {
  const navigate = useNavigate();
  const [index, setIndex] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const slides = HERO_SLIDES;
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

  return (
    <section className="relative h-screen overflow-hidden" aria-label="Homestays carousel">
      {/* Background images from assets */}
      {slides.map((slide, i) => (
        <div
          key={slide.image}
          className={`absolute inset-0 transition-opacity duration-1000 ${
            i === index ? 'z-0 opacity-100' : 'z-0 opacity-0'
          }`}
          aria-hidden={i !== index}
        >
          <img
            src={slide.image}
            alt={slide.title}
            className="h-full w-full object-cover"
            loading={i === index ? 'eager' : 'lazy'}
          />
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-black/60" aria-hidden />
        </div>
      ))}

      {/* Content — centered */}
      <div className="relative z-10 flex h-full items-center justify-center text-center">
        <div className="max-w-4xl px-6 md:px-8">
          <h1 className="mb-6 text-5xl font-bold text-white drop-shadow-lg md:text-7xl">
            {current.title}
          </h1>
          <p className="mb-8 text-xl text-white/90 drop-shadow-md md:text-2xl">
            {current.subtitle}
          </p>
          <button
            type="button"
            onClick={() => navigate('/search')}
            className="rounded-full bg-primary px-8 py-4 text-lg font-semibold text-primary-foreground shadow-lg transition-all hover:scale-105 hover:bg-primary/90"
          >
            Explore Homestays
          </button>
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
