import { useState, useEffect } from 'react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Newspaper, ExternalLink, Calendar, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';
import { HOMESTAY_NEWS, HOMESTAY_NEWS_SOURCE_URL, type NewsItem } from '@/data/homestayNews';

/** Shape returned by GET /api/news/feed */
type FeedItem = { id: string; title: string; excerpt: string; url: string; date: string; category?: string };

function formatNewsDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-NP', { year: 'numeric', month: 'short', day: 'numeric' });
}

function feedItemToNewsItem(f: FeedItem): NewsItem {
  return {
    id: f.id,
    title: f.title,
    excerpt: f.excerpt || '',
    category: f.category ?? 'News',
    date: f.date,
    url: f.url,
  };
}

function NewsCard({ item }: { item: NewsItem }) {
  return (
    <Card className="flex h-full flex-col overflow-hidden border-primary-200 transition-shadow hover:shadow-lg">
      <CardContent className="flex flex-1 flex-col p-5">
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-accent-100 px-2.5 py-1 text-xs font-medium text-accent-800">
            {item.category}
          </span>
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Calendar className="h-3.5 w-3.5" />
            {formatNewsDate(item.date)}
          </span>
        </div>
        <h3 className="font-semibold text-primary-800 line-clamp-2">{item.title}</h3>
        {item.titleNe && (
          <p className="mt-1 text-xs text-muted-foreground line-clamp-1" lang="ne">
            {item.titleNe}
          </p>
        )}
        <p className="mt-3 flex-1 text-sm text-muted-foreground line-clamp-3">{item.excerpt}</p>
      </CardContent>
      <CardFooter className="border-t border-primary-100 p-3">
        <Button
          variant="outline"
          size="sm"
          className="w-full border-primary-200 text-accent-600 hover:bg-accent-50 hover:border-accent-200"
          asChild
        >
          <a href={item.url} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="mr-1.5 h-4 w-4" />
            Read on Homestay Khabar
          </a>
        </Button>
      </CardFooter>
    </Card>
  );
}

const DISPLAY_LIMIT = 6;

export default function BlogsAndNews() {
  const [items, setItems] = useState<NewsItem[]>(HOMESTAY_NEWS.slice(0, DISPLAY_LIMIT));
  const [loading, setLoading] = useState(true);
  const [fromFeed, setFromFeed] = useState(false);

  useEffect(() => {
    api
      .get<{ items: FeedItem[] }>('/api/news/feed')
      .then((res) => {
        const feedItems = res.data?.items ?? [];
        if (feedItems.length > 0) {
          setItems(feedItems.slice(0, DISPLAY_LIMIT).map(feedItemToNewsItem));
          setFromFeed(true);
        }
      })
      .catch(() => {
        setItems(HOMESTAY_NEWS.slice(0, DISPLAY_LIMIT));
      })
      .finally(() => setLoading(false));
  }, []);

  const displayItems = items;

  return (
    <section className="space-y-6">
      <div className="flex flex-col items-center text-center sm:flex-row sm:items-end sm:justify-between sm:gap-4">
        <div>
          <h2 className="text-3xl font-bold text-primary-800 md:text-4xl">Blogs & News</h2>
          <p className="mt-2 text-muted-foreground">
            {fromFeed
              ? 'Latest from Homestay Khabar — homestay tourism, culture and community (updated daily)'
              : 'Top stories from Homestay Khabar — homestay tourism, culture and community'}
          </p>
        </div>
        <a
          href={HOMESTAY_NEWS_SOURCE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-accent-600 hover:text-accent-700 sm:mt-0"
        >
          <Newspaper className="h-4 w-4" />
          Visit Homestay Khabar
        </a>
      </div>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          <div className="col-span-full flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-accent-500" />
          </div>
        ) : (
          displayItems.map((item) => (
            <NewsCard key={item.id} item={item} />
          ))
        )}
      </div>
    </section>
  );
}
