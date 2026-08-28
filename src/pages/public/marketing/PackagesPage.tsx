import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { api } from '@/lib/api';

type PackageItem = {
  name: string;
  duration?: string;
  price_from?: number;
  currency?: string;
  image?: string;
  highlights?: string[];
  description?: string;
};

type Category = { id?: string; title: string; packages?: PackageItem[] };

type PackagesConfig = {
  title?: string;
  subtitle?: string;
  categories?: Category[];
};

export default function PackagesPage() {
  const [config, setConfig] = useState<PackagesConfig | null>(null);

  useEffect(() => {
    api
      .get<PackagesConfig>('/api/settings/packages')
      .then((res) => setConfig(res.data))
      .catch(() => setConfig({ categories: [] }));
  }, []);

  const categories = config?.categories ?? [];

  return (
    <div className="min-h-screen bg-background">
      <section className="bg-gradient-to-b from-primary/5 to-background pb-12 pt-12">
        <div className="section-container">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mx-auto max-w-3xl text-center">
            <h1 className="mb-4 font-display text-4xl font-bold md:text-5xl">
              {config?.title || 'Travel Packages'}
            </h1>
            <p className="text-lg text-muted-foreground">
              {config?.subtitle || 'Curated experiences combining homestays with culture and adventure'}
            </p>
          </motion.div>
        </div>
      </section>
      <section className="section-container space-y-12 py-12">
        {categories.map((cat) => (
          <div key={cat.id || cat.title}>
            <h2 className="mb-6 font-display text-2xl font-semibold">{cat.title}</h2>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {(cat.packages ?? []).map((pkg) => (
                <div key={pkg.name} className="overflow-hidden rounded-2xl border border-border bg-card">
                  {pkg.image && <img src={pkg.image} alt={pkg.name} className="h-44 w-full object-cover" />}
                  <div className="p-5">
                    <h3 className="font-display text-lg font-semibold">{pkg.name}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {[pkg.duration, pkg.price_from != null ? `from ${pkg.currency || 'USD'} ${pkg.price_from}` : null]
                        .filter(Boolean)
                        .join(' · ')}
                    </p>
                    {pkg.description && <p className="mt-2 text-sm text-muted-foreground">{pkg.description}</p>}
                    {!!pkg.highlights?.length && (
                      <ul className="mt-3 list-inside list-disc text-sm text-muted-foreground">
                        {pkg.highlights.map((h) => (
                          <li key={h}>{h}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
        {!categories.length && (
          <p className="text-center text-muted-foreground">Packages will appear here once configured.</p>
        )}
      </section>
    </div>
  );
}
