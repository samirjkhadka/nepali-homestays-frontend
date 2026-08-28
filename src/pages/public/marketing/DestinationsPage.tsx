import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { api } from '@/lib/api';

type Destination = {
  name: string;
  region?: string;
  image?: string;
  description?: string;
  search_href?: string;
};

type DestinationsConfig = {
  title?: string;
  subtitle?: string;
  destinations?: Destination[];
};

export default function DestinationsPage() {
  const [config, setConfig] = useState<DestinationsConfig | null>(null);

  useEffect(() => {
    api
      .get<DestinationsConfig>('/api/settings/destinations')
      .then((res) => setConfig(res.data))
      .catch(() => setConfig({ destinations: [] }));
  }, []);

  const destinations = config?.destinations ?? [];

  return (
    <div className="min-h-screen bg-background">
      <section className="bg-gradient-to-b from-primary/5 to-background pb-12 pt-12">
        <div className="section-container">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mx-auto max-w-3xl text-center">
            <h1 className="mb-4 font-display text-4xl font-bold md:text-5xl">
              {config?.title || 'Explore Destinations'}
            </h1>
            <p className="text-lg text-muted-foreground">
              {config?.subtitle || "Discover authentic homestays across Nepal's most beautiful regions"}
            </p>
          </motion.div>
        </div>
      </section>

      <section className="section-container py-12">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {destinations.map((d, index) => (
            <motion.div
              key={d.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.05 }}
              className="overflow-hidden rounded-2xl border border-border bg-card"
            >
              {d.image && <img src={d.image} alt={d.name} className="h-48 w-full object-cover" />}
              <div className="p-6">
                <h2 className="font-display text-xl font-semibold">{d.name}</h2>
                {d.region && <p className="text-sm text-primary">{d.region}</p>}
                {d.description && <p className="mt-2 text-sm text-muted-foreground">{d.description}</p>}
                <Link
                  to={d.search_href || '/search'}
                  className="mt-4 inline-block text-sm font-medium text-primary hover:underline"
                >
                  Browse homestays
                </Link>
              </div>
            </motion.div>
          ))}
        </div>
        {!destinations.length && (
          <p className="text-center text-muted-foreground">Destinations will appear here once configured.</p>
        )}
      </section>
    </div>
  );
}
