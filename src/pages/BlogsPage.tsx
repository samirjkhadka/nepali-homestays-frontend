import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { ArrowRight, Newspaper } from 'lucide-react';

type FeedItem = { id: string; title: string; excerpt?: string; url: string; date?: string; category?: string };

export default function BlogsPage() {
  const [items, setItems] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<{ items?: FeedItem[] }>('/api/news/feed')
      .then((res) => setItems(Array.isArray(res.data.items) ? res.data.items : []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="container mx-auto px-4 py-16 max-w-3xl">
      <h1 className="font-display text-3xl font-bold text-primary-800 mb-8 flex items-center gap-2">
        <Newspaper className="w-8 h-8" /> Blogs & News
      </h1>
      {loading ? (
        <p className="text-muted-foreground">Loading…</p>
      ) : items.length === 0 ? (
        <p className="text-muted-foreground">No blog posts yet. Check back later.</p>
      ) : (
        <ul className="space-y-6">
          {items.map((item) => (
            <li key={item.id} className="border-b border-primary-100 pb-6 last:border-0">
              <h2 className="font-semibold text-primary-800 text-lg">{item.title}</h2>
              {item.excerpt && <p className="mt-1 text-muted-foreground">{item.excerpt}</p>}
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 mt-2 text-accent hover:underline"
              >
                Read more <ArrowRight className="w-4 h-4" />
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
