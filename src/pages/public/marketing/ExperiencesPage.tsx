import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { api } from '@/lib/api';

type Experience = {
  name: string;
  host?: string;
  price_from?: number;
  currency?: string;
  image?: string;
  description?: string;
};

type ExperiencesConfig = {
  title?: string;
  subtitle?: string;
  experiences?: Experience[];
};

export default function ExperiencesPage() {
  const [config, setConfig] = useState<ExperiencesConfig | null>(null);

  useEffect(() => {
    api
      .get<ExperiencesConfig>('/api/settings/experiences')
      .then((res) => setConfig(res.data))
      .catch(() => setConfig({ experiences: [] }));
  }, []);

  const experiences = config?.experiences ?? [];

  return (
    <div className="min-h-screen bg-background">
      <section className="bg-gradient-to-b from-primary/5 to-background pb-12 pt-12">
        <div className="section-container">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mx-auto max-w-3xl text-center">
            <h1 className="mb-4 font-display text-4xl font-bold md:text-5xl">{config?.title || 'Experiences'}</h1>
            <p className="text-lg text-muted-foreground">
              {config?.subtitle || 'Hands-on cultural moments beyond the stay'}
            </p>
          </motion.div>
        </div>
      </section>
      <section className="section-container py-12">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {experiences.map((ex, i) => (
            <motion.div
              key={ex.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className="overflow-hidden rounded-2xl border border-border bg-card"
            >
              {ex.image && <img src={ex.image} alt={ex.name} className="h-44 w-full object-cover" />}
              <div className="p-6">
                <h2 className="font-display text-xl font-semibold">{ex.name}</h2>
                {ex.host && <p className="text-sm text-primary">{ex.host}</p>}
                {ex.price_from != null && (
                  <p className="mt-1 text-sm text-muted-foreground">
                    From {ex.currency || 'USD'} {ex.price_from}
                  </p>
                )}
                {ex.description && <p className="mt-2 text-sm text-muted-foreground">{ex.description}</p>}
              </div>
            </motion.div>
          ))}
        </div>
        {!experiences.length && (
          <p className="text-center text-muted-foreground">Experiences will appear here once configured.</p>
        )}
      </section>
    </div>
  );
}
