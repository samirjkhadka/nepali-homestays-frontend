import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import {
  HeroCarousel,
  SearchSection,
  TrustStrip,
  ImpactSection,
  SectionDivider,
  YouTubeSection,
  FeaturedHomestays,
  BlogsAndNews,
  TestimonialsSection,
  InteractiveProvinceMap,
  MobileAppSection,
  PartnersSection,
  Footer,
} from '@/components/sections';

export type HomeListing = {
  id: number;
  title: string;
  location: string;
  price_per_night: string | number;
  max_guests: number;
  image_url?: string | null;
  badge?: string | null;
  average_rating: number | null;
  review_count: number;
  /** If the API adds rich hero payload later, these are passed through. */
  description?: string | null;
  bedrooms?: number | null;
  bathrooms?: number | null;
  host_name?: string | null;
  hosting_since?: string | null;
};

export default function HomePage() {
  const [heroListings, setHeroListings] = useState<HomeListing[]>([]);
  const [heroLoaded, setHeroLoaded] = useState(false);
  const [featuredListings, setFeaturedListings] = useState<HomeListing[]>([]);
  const [loading, setLoading] = useState(false);
  const [listingsError, setListingsError] = useState<string | null>(null);

  useEffect(() => {
    api.post('/api/stats/visitor-hit').catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    setListingsError(null);
    setHeroLoaded(false);
    Promise.all([
      api.get<{ listings: HomeListing[] }>('/api/listings/hero').then((res) => res.data.listings ?? []).catch((err) => {
        if (err.response?.status === 404) return [];
        throw err;
      }),
      api.get<{ listings: HomeListing[] }>('/api/listings/featured').then((res) => res.data.listings ?? []).catch((err) => {
        if (err.response?.status === 404) return [];
        throw err;
      }),
    ])
      .then(([hero, featured]) => {
        const h = Array.isArray(hero) ? hero : [];
        const f = Array.isArray(featured) ? featured : [];
        setHeroListings(h);
        setHeroLoaded(true);
        setFeaturedListings(f);
      })
      .catch((err) => {
        setHeroListings([]);
        setHeroLoaded(true);
        setFeaturedListings([]);
        setListingsError(err.response?.data?.message || err.message || 'Could not load listings.');
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="bg-background min-h-screen">
      <HeroCarousel listings={heroListings} heroLoaded={heroLoaded} />
      <div
        className="w-full h-12 shrink-0 sm:h-14 md:h-20"
        aria-hidden
      />
      <SearchSection />
      <TrustStrip />
      <ImpactSection />
      <SectionDivider variant="mountains" fill="hsl(var(--background))" className="-mt-px" />
      <FeaturedHomestays
        listings={featuredListings}
        loading={loading}
        error={listingsError}
      />
      <SectionDivider variant="mandala" />
      <TestimonialsSection />
      <InteractiveProvinceMap />
      <MobileAppSection />
      <YouTubeSection />
      <BlogsAndNews />
      <PartnersSection />
      <Footer />
    </div>
  );
}
