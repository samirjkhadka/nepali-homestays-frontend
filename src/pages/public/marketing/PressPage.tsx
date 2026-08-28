import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { api } from '@/lib/api';

type PressRelease = { title: string; date?: string; excerpt?: string; url?: string };
type MediaFeature = { outlet: string; title?: string; url?: string };

type PressConfig = {
  title?: string;
  subtitle?: string;
  press_releases?: PressRelease[];
  media_features?: MediaFeature[];
  media_kit_url?: string;
  contact_email?: string;
};

export default function PressPage() {
  const [config, setConfig] = useState<PressConfig | null>(null);

  useEffect(() => {
    api
      .get<PressConfig>('/api/settings/press')
      .then((res) => setConfig(res.data))
      .catch(() => setConfig({ press_releases: [], media_features: [] }));
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <section className="bg-gradient-to-b from-primary/5 to-background pb-12 pt-12">
        <div className="section-container">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mx-auto max-w-3xl text-center">
            <h1 className="mb-4 font-display text-4xl font-bold md:text-5xl">{config?.title || 'Press'}</h1>
            <p className="text-lg text-muted-foreground">
              {config?.subtitle || 'News and media resources about Nepali Homestays'}
            </p>
          </motion.div>
        </div>
      </section>
      <section className="section-container space-y-10 py-12">
        <div>
          <h2 className="mb-4 font-display text-2xl font-semibold">Press releases</h2>
          <div className="space-y-4">
            {(config?.press_releases ?? []).map((r) => (
              <article key={r.title} className="rounded-xl border border-border bg-card p-5">
                <h3 className="font-semibold">{r.title}</h3>
                {r.date && <p className="text-xs text-muted-foreground">{r.date}</p>}
                {r.excerpt && <p className="mt-2 text-sm text-muted-foreground">{r.excerpt}</p>}
                {r.url && (
                  <a href={r.url} className="mt-2 inline-block text-sm text-primary hover:underline" target="_blank" rel="noreferrer">
                    Read more
                  </a>
                )}
              </article>
            ))}
            {!config?.press_releases?.length && (
              <p className="text-muted-foreground">No press releases published yet.</p>
            )}
          </div>
        </div>
        {(config?.media_features?.length ?? 0) > 0 && (
          <div>
            <h2 className="mb-4 font-display text-2xl font-semibold">Featured in</h2>
            <ul className="space-y-2">
              {config!.media_features!.map((m) => (
                <li key={`${m.outlet}-${m.title}`} className="text-sm">
                  <span className="font-medium">{m.outlet}</span>
                  {m.title ? ` — ${m.title}` : ''}
                </li>
              ))}
            </ul>
          </div>
        )}
        {config?.contact_email && (
          <p className="text-sm text-muted-foreground">
            Media contact:{' '}
            <a className="text-primary hover:underline" href={`mailto:${config.contact_email}`}>
              {config.contact_email}
            </a>
          </p>
        )}
      </section>
    </div>
  );
}
