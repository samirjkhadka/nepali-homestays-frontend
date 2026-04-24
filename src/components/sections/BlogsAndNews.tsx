import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Clock, ArrowRight, User, Loader2 } from 'lucide-react';
import { fetchNewsFeed } from '@/lib/api';
import { assets } from '@/lib/design-tokens';
import { HOMESTAY_NEWS, type NewsItem } from '@/data/homestayNews';

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
  const [imageFailed, setImageFailed] = useState(false);
  const useLogo = !item.imageUrl || imageFailed;
  const imageSrc = useLogo ? assets.logo : item.imageUrl;

  return (
    <motion.article
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.15 }}
      whileHover={{ y: -8 }}
      className="group bg-card rounded-2xl overflow-hidden border border-border shadow-soft transition-all duration-300 hover:shadow-elevated"
    >
      {/* Image: item image or logo as default / fallback */}
      <div className="relative aspect-[16/10] overflow-hidden bg-muted">
        <img
          src={imageSrc}
          alt={item.title}
          className={`w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 ${useLogo ? 'object-contain p-6 bg-gradient-to-br from-primary/10 to-primary/5' : ''}`}
          onError={() => setImageFailed(true)}
        />
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
    fetchNewsFeed<{ items: FeedItem[] }>()
      .then((data) => {
        const feedItems = data?.items ?? [];
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
      <div className="section-container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-12 flex flex-col md:flex-row md:items-end md:justify-between"
        >
          <div>
            <span className="text-sm font-medium uppercase tracking-wider text-primary">Latest Updates</span>
            <h2 className="font-display mt-2 text-4xl font-bold text-foreground md:text-5xl">Blogs &amp; News</h2>
          </div>
          <motion.div whileHover={{ x: 5 }} className="mt-4 md:mt-0">
            <Link
              to="/blogs"
              className="flex items-center gap-2 font-medium text-primary transition-all hover:gap-3"
            >
              View All Articles <ArrowRight className="h-4 w-4" />
            </Link>
          </motion.div>
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
