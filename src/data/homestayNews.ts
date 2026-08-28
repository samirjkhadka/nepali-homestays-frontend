/**
 * Emergency offline fallback when `/api/news/feed` is unavailable.
 * Prefer the live feed + admin-synced items in production.
 */

export type NewsItem = {
  id: string;
  title: string;
  titleNe?: string;
  excerpt: string;
  category: string;
  categoryNe?: string;
  date: string;
  /** External link to full article when available */
  url: string;
  /** Optional image URL for card thumbnail */
  imageUrl?: string;
};

export const HOMESTAY_NEWS_SOURCE_URL = 'https://homestaykhabar.com/';

export const HOMESTAY_NEWS: NewsItem[] = [
  {
    id: '1',
    title: 'Homestay news & blogs',
    excerpt: 'Latest updates from Homestay Khabar will appear here when the feed is available.',
    category: 'News',
    date: '2026-01-01',
    url: HOMESTAY_NEWS_SOURCE_URL,
  },
];
