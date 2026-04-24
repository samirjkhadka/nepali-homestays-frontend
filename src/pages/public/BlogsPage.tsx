import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { fetchNewsFeed } from '@/lib/api';
import { assets } from '@/lib/design-tokens';
import { ArrowRight, Calendar, Clock, Newspaper, User } from 'lucide-react';

type FeedItem = {
  id: string;
  title: string;
  excerpt?: string;
  url: string;
  date?: string;
  category?: string;
  imageUrl?: string;
};

function formatDate(iso?: string) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleDateString('en-NP', { year: 'numeric', month: 'short', day: 'numeric' });
}

export default function BlogsPage() {
  const [items, setItems] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNewsFeed<{ items?: FeedItem[] }>()
      .then((data) => setItems(Array.isArray(data.items) ? data.items : []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  const featured = items[0];
  const rest = items.slice(1);

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-background pb-16">
      <section className="bg-gradient-to-b from-primary/5 to-background pb-14 pt-14">
        <div className="section-container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mx-auto max-w-3xl text-center"
          >
            <div className="mb-3 flex items-center justify-center gap-2">
              <Newspaper className="h-8 w-8 text-primary" />
              <span className="text-sm font-medium uppercase tracking-wider text-primary">Updates</span>
            </div>
            <h1 className="font-display text-4xl font-bold text-foreground md:text-5xl">Travel Stories &amp; Insights</h1>
            <p className="mt-4 text-lg text-muted-foreground">
              Discover travel tips, cultural insights, and inspiring stories from our community of travelers and hosts.
            </p>
          </motion.div>
        </div>
      </section>

      <div className="section-container py-12">
        {loading ? (
          <p className="text-center text-muted-foreground">Loading…</p>
        ) : items.length === 0 ? (
          <p className="text-center text-muted-foreground">No posts yet. Check back later.</p>
        ) : (
          <>
            {featured && <FeaturedBlogCard item={featured} />}
            {rest.length > 0 && (
              <div className="mt-12 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                {rest.map((item, index) => (
                  <BlogPostCard key={item.id} item={item} index={index} />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function FeaturedBlogCard({ item }: { item: FeedItem }) {
  const [imageFailed, setImageFailed] = useState(false);
  const useLogo = !item.imageUrl || imageFailed;
  const imageSrc = useLogo ? assets.logo : item.imageUrl;

  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="grid items-center overflow-hidden rounded-2xl border border-border bg-card shadow-soft md:grid-cols-2"
    >
      <div className="h-64 overflow-hidden md:h-full">
        <img
          src={imageSrc}
          alt={item.title}
          className={`h-full w-full object-cover ${useLogo ? 'object-contain p-8 bg-gradient-to-br from-primary/10 to-primary/5' : ''}`}
          onError={() => setImageFailed(true)}
        />
      </div>
      <div className="p-8">
        {item.category && (
          <span className="mb-4 inline-block rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
            {item.category}
          </span>
        )}
        <h2 className="font-display mb-4 text-2xl font-bold text-foreground md:text-3xl">{item.title}</h2>
        {item.excerpt && <p className="mb-6 text-muted-foreground line-clamp-4">{item.excerpt}</p>}
        <div className="mb-6 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <User className="h-4 w-4" />
            Homestay Khabar
          </span>
          {item.date && (
            <span className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              {formatDate(item.date)}
            </span>
          )}
          <span className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            5 min read
          </span>
        </div>
        <a
          href={item.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Read More
          <ArrowRight className="h-4 w-4" />
        </a>
      </div>
    </motion.article>
  );
}

function BlogPostCard({ item, index }: { item: FeedItem; index: number }) {
  const [imageFailed, setImageFailed] = useState(false);
  const useLogo = !item.imageUrl || imageFailed;
  const imageSrc = useLogo ? assets.logo : item.imageUrl;

  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.08 }}
      className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card transition-shadow hover:shadow-lg"
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-muted">
        <img
          src={imageSrc}
          alt={item.title}
          className={`h-full w-full object-cover transition-transform duration-500 group-hover:scale-105 ${useLogo ? 'object-contain p-6 bg-gradient-to-br from-primary/10 to-primary/5' : ''}`}
          onError={() => setImageFailed(true)}
        />
        {item.category && (
          <div className="absolute left-4 top-4">
            <span className="rounded-full bg-primary px-2.5 py-0.5 text-xs font-medium text-primary-foreground">
              {item.category}
            </span>
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col p-6">
        <h2 className="font-display text-lg font-semibold text-foreground mb-2 line-clamp-2 group-hover:text-primary transition-colors">
          {item.title}
        </h2>
        {item.excerpt && <p className="mb-4 flex-1 text-sm text-muted-foreground line-clamp-2">{item.excerpt}</p>}
        <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <User className="h-3 w-3" /> Homestay Khabar
          </span>
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            5 min read
          </span>
        </div>
        <a
          href={item.url}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary"
        >
          Read more <ArrowRight className="h-4 w-4" />
        </a>
      </div>
    </motion.article>
  );
}
