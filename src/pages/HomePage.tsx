import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import {
  HeroCarousel,
  SearchSection,
  ProvinceExplorer,
  YouTubeSection,
  FeaturedHomestays,
  HowItWorks,
  BlogsAndNews,
  Testimonials,
  AppDownloadSection,
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
};

export default function HomePage() {
  const [heroListings, setHeroListings] = useState<HomeListing[]>([]);
  const [featuredListings, setFeaturedListings] = useState<HomeListing[]>([]);
  const [loading, setLoading] = useState(false);
  const [listingsError, setListingsError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setListingsError(null);
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
        setHeroListings(Array.isArray(hero) ? hero : []);
        setFeaturedListings(Array.isArray(featured) ? featured : []);
      })
      .catch((err) => {
        setHeroListings([]);
        setFeaturedListings([]);
        setListingsError(err.response?.data?.message || err.message || 'Could not load listings.');
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-16 md:space-y-20 overflow-x-hidden min-h-screen">
      <HeroCarousel listings={heroListings} />
      <SearchSection />

      <ProvinceExplorer />

      <FeaturedHomestays
        listings={featuredListings}
        loading={loading}
        error={listingsError}
      />

      <YouTubeSection />

      <BlogsAndNews />

      <HowItWorks />

      <Testimonials />

      <AppDownloadSection />

      <Footer />
    </div>
  );
}
