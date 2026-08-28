import { useState, useEffect, useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { Home, Users, MapPin, Star, type LucideIcon } from 'lucide-react';
import { useHomeContent, type HomeImpactItem } from '@/hooks/useHomeContent';

function useCountUp(end: number, duration: number = 2000, startCounting: boolean = false) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!startCounting) return;
    let startTime: number | null = null;
    let animationFrame: number;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * end));
      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [end, duration, startCounting]);

  return count;
}

const ICON_MAP: Record<string, LucideIcon> = { Home, Users, MapPin, Star };

function StatCard({
  icon: Icon,
  value,
  suffix,
  label,
  description,
  delay,
  staticDisplay,
}: {
  icon: LucideIcon;
  value: number;
  suffix: string;
  label: string;
  description: string;
  delay: number;
  staticDisplay?: string;
}) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-50px' });
  const count = useCountUp(value, 2000, isInView && !staticDisplay);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay }}
      className="group rounded-2xl border border-border bg-card p-6 text-center shadow-sm transition-shadow hover:shadow-md md:p-8"
    >
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 transition-colors group-hover:bg-primary/20">
        <Icon className="h-7 w-7 text-primary" />
      </div>
      <div className="mb-1 text-3xl font-bold text-foreground md:text-4xl">
        {staticDisplay ?? (
          <>
            {count.toLocaleString()}
            {suffix}
          </>
        )}
      </div>
      <div className="mb-1 text-sm font-semibold text-foreground">{label}</div>
      <div className="text-xs text-muted-foreground">{description}</div>
    </motion.div>
  );
}

const FALLBACK_ITEMS: HomeImpactItem[] = [
  { icon: 'Home', value: 500, suffix: '+', label: 'Homestays Listed', description: 'Authentic stays across Nepal', stat_key: 'listings' },
  { icon: 'Users', value: 50000, suffix: '+', label: 'Happy Guests', description: 'Travelers served worldwide', stat_key: 'guests' },
  { icon: 'MapPin', value: 75, suffix: '+', label: 'Destinations', description: 'Districts covered nationwide', stat_key: 'districts' },
  { icon: 'Star', value: 0, suffix: '', label: 'Average Rating', description: 'From verified guest reviews', stat_key: 'rating', static_display: '4.8' },
];

export function ImpactSection() {
  const { content, impact } = useHomeContent();
  const cfg = content?.impact;
  const useLive = cfg?.use_live_stats !== false;
  const items = (cfg?.items?.length ? cfg.items : FALLBACK_ITEMS).map((item) => {
    if (!useLive || !impact) return item;
    const key = item.stat_key;
    if (key === 'listings' && impact.listings > 0) return { ...item, value: impact.listings, static_display: undefined };
    if (key === 'guests' && impact.guests > 0) return { ...item, value: impact.guests, static_display: undefined };
    if (key === 'districts' && impact.districts > 0) return { ...item, value: impact.districts, static_display: undefined };
    if (key === 'provinces' && impact.provinces > 0) return { ...item, value: impact.provinces, static_display: undefined };
    if (key === 'rating' && impact.average_rating != null)
      return { ...item, static_display: String(impact.average_rating), value: 0 };
    return item;
  });

  return (
    <section className="relative overflow-hidden bg-primary/5 py-20">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,hsl(var(--primary)/0.08),transparent_60%)]" />
      <div className="section-container relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mb-12 text-center"
        >
          {cfg?.badge && (
            <span className="text-sm font-semibold uppercase tracking-widest text-primary">{cfg.badge}</span>
          )}
          <h2 className="mt-3 font-display text-3xl font-bold text-foreground md:text-4xl">
            {cfg?.title || 'Homestays that make a difference'}
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
            {cfg?.subtitle || 'Real stays, real communities, real Nepal.'}
          </p>
        </motion.div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((s, i) => (
            <StatCard
              key={s.label}
              icon={ICON_MAP[s.icon ?? ''] ?? Home}
              value={s.value}
              suffix={s.suffix ?? ''}
              label={s.label}
              description={s.description ?? ''}
              delay={i * 0.1}
              staticDisplay={s.static_display}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
