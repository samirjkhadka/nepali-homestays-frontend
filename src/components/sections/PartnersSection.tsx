import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { CreditCard, Plane, PartyPopper, Building2, Handshake, type LucideIcon } from 'lucide-react';
import { fetchPartnersSettings } from '@/lib/api';

const ICON_MAP: Record<string, LucideIcon> = {
  CreditCard,
  Plane,
  PartyPopper,
  Building2,
};

type PartnerItem = { name: string; tag: string; website?: string };
type PartnerCategory = {
  title: string;
  description?: string;
  icon: string;
  partners: PartnerItem[];
};
type PartnersPayload = {
  section_badge?: string;
  section_title?: string;
  section_subtitle?: string;
  categories: PartnerCategory[];
};

export function PartnersSection() {
  const [config, setConfig] = useState<PartnersPayload | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetchPartnersSettings<PartnersPayload & { _meta?: unknown }>()
      .then((data) => {
        if (cancelled) return;
        if (!data?.categories?.length) {
          setLoadFailed(true);
          return;
        }
        const { _meta: _m, ...rest } = data;
        setConfig(rest as PartnersPayload);
      })
      .catch(() => {
        if (!cancelled) setLoadFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (loadFailed || !config) {
    return loadFailed ? null : (
      <section className="py-20 bg-muted/30" aria-hidden>
        <div className="section-container">
          <div className="h-48 rounded-2xl bg-muted animate-pulse" />
        </div>
      </section>
    );
  }

  return (
    <section className="py-20 bg-muted/30 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,hsl(var(--primary)/0.08),transparent_60%)]" />

      <div className="section-container relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-14"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            <Handshake className="w-4 h-4" />
            {config.section_badge || 'Our Partners'}
          </div>
          <h2 className="font-display text-4xl md:text-5xl font-bold mb-4">
            {config.section_title || 'Powered by Trusted Partners'}
          </h2>
          {config.section_subtitle && (
            <p className="text-muted-foreground max-w-2xl mx-auto">{config.section_subtitle}</p>
          )}
        </motion.div>

        <div className="grid gap-8 md:grid-cols-2">
          {config.categories.map((category, idx) => {
            const Icon = ICON_MAP[category.icon] ?? Building2;
            return (
              <motion.div
                key={`${category.title}-${idx}`}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="bg-card border border-border rounded-2xl p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-start gap-4 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <Icon className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-display text-xl font-semibold">{category.title}</h3>
                    {category.description && <p className="text-sm text-muted-foreground">{category.description}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {category.partners.map((partner) => {
                    const inner = (
                      <>
                        <span className="absolute inset-x-0 top-0 h-0.5 bg-gradient-warm opacity-0 group-hover/partner:opacity-100 transition-opacity" />
                        <div className="font-display font-semibold text-sm text-foreground truncate">{partner.name}</div>
                        <div className="text-[10px] uppercase tracking-wide text-muted-foreground mt-1">{partner.tag}</div>
                      </>
                    );
                    return (
                      <motion.div
                        key={`${category.title}-${partner.name}`}
                        whileHover={{ y: -3 }}
                        className="relative bg-background border border-border rounded-xl p-3 text-center transition-all hover:shadow-md group/partner overflow-hidden"
                      >
                        {partner.website ? (
                          <a
                            href={partner.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block text-inherit no-underline hover:text-primary"
                          >
                            {inner}
                          </a>
                        ) : (
                          inner
                        )}
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>
            );
          })}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center mt-12"
        >
          <p className="text-muted-foreground text-sm">
            Interested in partnering with us?{' '}
            <Link to="/contact" className="text-primary font-semibold hover:underline">
              Get in touch →
            </Link>
          </p>
        </motion.div>
      </div>
    </section>
  );
}
