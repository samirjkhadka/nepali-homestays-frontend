import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar } from 'lucide-react';
import { fetchFestivalsSettings } from '@/lib/api';

type FestivalItem = {
  id: string;
  name: string;
  monthIndex: number;
  region?: string;
  duration?: string;
  description: string;
  emoji?: string;
};

type FestivalsConfig = {
  badge?: string;
  title: string;
  subtitle?: string;
  festivals: FestivalItem[];
};

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const FALLBACK: FestivalsConfig = {
  badge: 'Cultural Calendar',
  title: 'Festivals of Nepal',
  subtitle: "Time your visit with one of Nepal's vibrant festivals to experience the country at its most alive.",
  festivals: [],
};

export default function FestivalsPage() {
  const [config, setConfig] = useState<FestivalsConfig>(FALLBACK);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFestivalsSettings<FestivalsConfig>()
      .then((data) => setConfig({ ...FALLBACK, ...data, festivals: Array.isArray(data.festivals) ? data.festivals : [] }))
      .catch(() => setConfig(FALLBACK))
      .finally(() => setLoading(false));
  }, []);

  const byMonth = useMemo(() => {
    const buckets = new Map<number, FestivalItem[]>();
    config.festivals.forEach((f) => {
      const m = Number.isInteger(f.monthIndex) && f.monthIndex >= 0 && f.monthIndex <= 11 ? f.monthIndex : -1;
      if (m < 0) return;
      const list = buckets.get(m) ?? [];
      list.push(f);
      buckets.set(m, list);
    });
    return buckets;
  }, [config.festivals]);

  return (
    <div className="min-h-screen bg-background">
      <main className="pt-12 pb-16">
        <div className="section-container">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
            <span className="text-primary font-medium text-sm uppercase tracking-wider">{config.badge || 'Cultural Calendar'}</span>
            <h1 className="font-display text-4xl md:text-5xl font-bold text-foreground mt-2 mb-4">{config.title}</h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">{config.subtitle}</p>
          </motion.div>

          {loading && <p className="text-center text-muted-foreground">Loading festivals...</p>}

          {!loading && (
            <div className="space-y-10">
              {MONTHS.map((month, i) => {
                const monthFestivals = byMonth.get(i) ?? [];
                if (!monthFestivals.length) return null;
                return (
                  <motion.section key={month} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
                    <h2 className="font-display text-2xl font-bold text-foreground mb-4 flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-primary" />
                      {month}
                    </h2>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {monthFestivals.map((f) => (
                        <div key={f.id} className="bg-card border border-border rounded-2xl p-5 hover:shadow-soft transition-shadow">
                          <div className="text-4xl mb-3">{f.emoji || '🎉'}</div>
                          <h3 className="font-display text-xl font-bold text-foreground mb-1">{f.name}</h3>
                          <p className="text-xs text-primary mb-3">{[f.region, f.duration].filter(Boolean).join(' · ')}</p>
                          <p className="text-sm text-foreground/80">{f.description}</p>
                        </div>
                      ))}
                    </div>
                  </motion.section>
                );
              })}
              {!config.festivals.length && <p className="text-center text-muted-foreground">No festivals configured yet.</p>}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
