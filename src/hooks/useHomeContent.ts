import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

export type HomeTrustItem = { icon?: string; value: string; label: string };
export type HomeImpactItem = {
  icon?: string;
  value: number;
  suffix?: string;
  label: string;
  description?: string;
  stat_key?: string;
  static_display?: string;
};
export type HomeTestimonial = {
  id: number | string;
  name: string;
  country?: string;
  avatar?: string;
  rating?: number;
  homestay?: string;
  comment: string;
};
export type HomeMobileApp = {
  badge?: string;
  title?: string;
  title_accent?: string;
  subtitle?: string;
  features?: string[];
  rating?: string;
  downloads_label?: string;
  app_store_url?: string;
  play_store_url?: string;
  coming_soon?: boolean;
};
export type HomeSocialLink = { network: string; url?: string; label?: string };
export type HomeFooterLink = { label: string; href: string };
export type HomeFooterNav = {
  company?: HomeFooterLink[];
  explore?: HomeFooterLink[];
  support?: HomeFooterLink[];
  legal?: HomeFooterLink[];
};
export type HomeContent = {
  trust?: { items?: HomeTrustItem[] };
  impact?: {
    badge?: string;
    title?: string;
    subtitle?: string;
    use_live_stats?: boolean;
    items?: HomeImpactItem[];
  };
  testimonials?: {
    badge?: string;
    title?: string;
    subtitle?: string;
    items?: HomeTestimonial[];
  };
  mobile_app?: HomeMobileApp;
  social_links?: HomeSocialLink[];
  footer_nav?: HomeFooterNav;
  footer_brand?: { blurb?: string; brand_name?: string };
  province_meta?: Record<string, { signature?: string; bestSeason?: string }>;
  hero_fallback?: {
    slides?: Array<{ image: string; title: string; subtitle: string }>;
  };
  _meta?: { using_defaults?: boolean };
};

export type ImpactStats = {
  listings: number;
  provinces: number;
  districts: number;
  guests: number;
  average_rating: number | null;
  review_count: number;
  by_province: Array<{ province_id: number; listing_count: number }>;
};

let homeContentCache: HomeContent | null = null;
let impactCache: ImpactStats | null = null;

export async function fetchHomeContent(): Promise<HomeContent> {
  if (homeContentCache) return homeContentCache;
  const res = await api.get<HomeContent>('/api/settings/home-content');
  homeContentCache = res.data ?? {};
  return homeContentCache;
}

export async function fetchImpactStats(): Promise<ImpactStats | null> {
  if (impactCache) return impactCache;
  try {
    const res = await api.get<ImpactStats>('/api/stats/impact');
    impactCache = res.data;
    return impactCache;
  } catch {
    return null;
  }
}

export function useHomeContent() {
  const [content, setContent] = useState<HomeContent | null>(null);
  const [impact, setImpact] = useState<ImpactStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    Promise.all([fetchHomeContent().catch(() => ({}) as HomeContent), fetchImpactStats()])
      .then(([c, i]) => {
        if (cancelled) return;
        setContent(c);
        setImpact(i);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { content, impact, loading };
}
