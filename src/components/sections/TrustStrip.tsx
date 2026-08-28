import { motion } from 'framer-motion';
import { Users, Home, MapPin, Star, type LucideIcon } from 'lucide-react';
import { useHomeContent } from '@/hooks/useHomeContent';

const ICON_MAP: Record<string, LucideIcon> = {
  Users,
  Home,
  MapPin,
  Star,
};

const FALLBACK = [
  { icon: 'Users', value: '10,000+', label: 'Travelers hosted' },
  { icon: 'Home', value: '200+', label: 'Verified hosts' },
  { icon: 'MapPin', value: '7', label: 'Provinces covered' },
  { icon: 'Star', value: '4.8', label: 'Average rating' },
];

export function TrustStrip() {
  const { content, impact } = useHomeContent();
  const items = content?.trust?.items?.length ? content.trust.items : FALLBACK;

  const resolved = items.map((item) => {
    let value = item.value;
    if (impact) {
      if (item.label.toLowerCase().includes('province') && impact.provinces > 0)
        value = String(impact.provinces);
      if (item.label.toLowerCase().includes('rating') && impact.average_rating != null)
        value = String(impact.average_rating);
      if (item.label.toLowerCase().includes('host') && impact.listings > 0)
        value = `${impact.listings}+`;
    }
    return { ...item, value };
  });

  return (
    <section className="border-y border-border bg-muted/40">
      <div className="section-container py-16 md:py-20">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {resolved.map((s, i) => {
            const Icon = ICON_MAP[s.icon ?? ''] ?? Star;
            return (
              <motion.div
                key={`${s.label}-${i}`}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="flex items-center gap-3"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <div className="font-display text-lg font-bold leading-tight text-foreground">{s.value}</div>
                  <div className="text-xs text-muted-foreground">{s.label}</div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
