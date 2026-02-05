import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Clock, ArrowRight, User, Loader2, Newspaper } from 'lucide-react';
import { api } from '@/lib/api';
import { HOMESTAY_NEWS, HOMESTAY_NEWS_SOURCE_URL, type NewsItem } from '@/data/homestayNews';

/** Shape returned by GET /api/news/feed */
type FeedItem = {
  id: string;
  title: string;
  excerpt: string;
  url: string;
  date: string;
  category?: string;
  imageUrl?: string;
};

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
    imageUrl: f.imageUrl,
  };
}

const DISPLAY_LIMIT = 6;
const DEFAULT_READ_TIME = '2 min read';
const DEFAULT_AUTHOR = 'Homestay Khabar';

function BlogCard({
  item,
  index,
}: {
  item: NewsItem;
  index: number;
}) {
  const imageUrl = item.imageUrl;

  return (
    <motion.article
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.15 }}
      whileHover={{ y: -8 }}
      className="group bg-card rounded-2xl overflow-hidden shadow-md hover:shadow-lg transition-all duration-300 border border-border"
    >
      {/* Image or placeholder */}
      <div className="relative aspect-[16/10] overflow-hidden bg-muted">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={item.title}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5">
            <Newspaper className="w-14 h-14 text-muted-foreground/50" aria-hidden />
          </div>
        )}
        <div className="absolute top-4 left-4">
          <span className="px-3 py-1 bg-primary text-primary-foreground text-xs font-semibold rounded-full">
            {item.category}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
          <span className="flex items-center gap-1">
            <User className="w-4 h-4" />
            {DEFAULT_AUTHOR}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            {DEFAULT_READ_TIME}
          </span>
        </div>

        <h3 className="font-display text-xl font-semibold text-foreground mb-3 group-hover:text-primary transition-colors line-clamp-2">
          {item.title}
        </h3>

        {item.titleNe && (
          <p className="text-muted-foreground text-sm line-clamp-1 mb-2" lang="ne">
            {item.titleNe}
          </p>
        )}

        <p className="text-muted-foreground text-sm line-clamp-2 mb-4">
          {item.excerpt}
        </p>

        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            {formatNewsDate(item.date)}
          </span>
          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary font-medium text-sm flex items-center gap-1 hover:gap-2 transition-all"
          >
            Read More <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      </div>
    </motion.article>
  );
}

export default function BlogsAndNews() {
  const [items, setItems] = useState<NewsItem[]>(HOMESTAY_NEWS.slice(0, DISPLAY_LIMIT));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<{ items: FeedItem[] }>('/api/news/feed')
      .then((res) => {
        const feedItems = res.data?.items ?? [];
        if (feedItems.length > 0) {
          setItems(feedItems.slice(0, DISPLAY_LIMIT).map(feedItemToNewsItem));
        }
      })
      .catch(() => {
        setItems(HOMESTAY_NEWS.slice(0, DISPLAY_LIMIT));
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <section id="blogs" className="py-20 bg-background">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex flex-col md:flex-row md:items-end md:justify-between mb-12"
        >
          <div>
            <span className="text-primary font-medium text-sm uppercase tracking-wider">
              Latest Updates
            </span>
            <h2 className="font-display text-4xl md:text-5xl font-bold text-foreground mt-2">
              Blogs & News
            </h2>
          </div>
          <motion.a
            href={HOMESTAY_NEWS_SOURCE_URL}
            target="_blank"
            rel="noopener noreferrer"
            whileHover={{ x: 5 }}
            className="flex items-center gap-2 text-primary font-medium mt-4 md:mt-0 hover:gap-3 transition-all"
          >
            View All Articles <ArrowRight className="w-4 h-4" />
          </motion.a>
        </motion.div>

        {/* Blog Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {loading ? (
            <div className="col-span-full flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            items.map((item, index) => (
              <BlogCard key={`${item.id}-${index}`} item={item} index={index} />
            ))
          )}
        </div>
      </div>
    </section>
  );
}
