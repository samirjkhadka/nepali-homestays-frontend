import { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin } from 'lucide-react';
import { NEPAL_PROVINCE_PATHS, NEPAL_MAP_PROJECTION } from '@/data/nepalProvinceMapPaths';
import { NEPAL_MAP_GEO_ID_TO_SEARCH_SLUG } from '@/data/nepalMapProvinceSearch';
import { useHomeContent } from '@/hooks/useHomeContent';

interface Province {
  id: number;
  name: string;
  homestays: number;
  signature: string;
  bestSeason: string;
  path: string;
  cx: number;
  cy: number;
}

const NAME_FALLBACK: Record<number, string> = {
  1: 'Koshi',
  2: 'Madhesh',
  3: 'Bagmati',
  4: 'Gandaki',
  5: 'Lumbini',
  6: 'Karnali',
  7: 'Sudurpashchim',
};

const META_FALLBACK: Record<number, { signature: string; bestSeason: string }> = {
  1: { signature: 'Everest & Ilam tea', bestSeason: 'Oct – May' },
  2: { signature: 'Janakpur & plains', bestSeason: 'Oct – Mar' },
  3: { signature: 'Kathmandu Valley', bestSeason: 'Oct – Apr' },
  4: { signature: 'Annapurna & Pokhara', bestSeason: 'Sep – May' },
  5: { signature: 'Birthplace of Buddha', bestSeason: 'Oct – Mar' },
  6: { signature: 'Rara Lake & Dolpo', bestSeason: 'Apr – Oct' },
  7: { signature: 'Khaptad National Park', bestSeason: 'Oct – May' },
};

function fillFor(p: Province, isActive: boolean, minStays: number, maxStays: number) {
  if (isActive) return 'hsl(var(--primary))';
  const span = Math.max(1, maxStays - minStays);
  const t = (p.homestays - minStays) / span;
  const opacity = 0.18 + t * 0.47;
  return `hsl(var(--primary) / ${opacity.toFixed(2)})`;
}

export function InteractiveProvinceMap() {
  const navigate = useNavigate();
  const { content, impact } = useHomeContent();

  const provinces: Province[] = useMemo(() => {
    const counts = new Map((impact?.by_province ?? []).map((r) => [r.province_id, r.listing_count]));
    const meta = content?.province_meta ?? {};
    return NEPAL_PROVINCE_PATHS.map((g) => {
      const m = meta[String(g.id)] ?? META_FALLBACK[g.id] ?? { signature: '', bestSeason: '' };
      return {
        ...g,
        name: NAME_FALLBACK[g.id] ?? `Province ${g.id}`,
        homestays: counts.get(g.id) ?? 0,
        signature: m.signature || META_FALLBACK[g.id]?.signature || '',
        bestSeason: m.bestSeason || META_FALLBACK[g.id]?.bestSeason || '',
      };
    });
  }, [content?.province_meta, impact?.by_province]);

  const minStays = Math.min(...provinces.map((p) => p.homestays), 0);
  const maxStays = Math.max(...provinces.map((p) => p.homestays), 1);
  const gandaki = useMemo(() => provinces.find((p) => p.id === 4) ?? provinces[0], [provinces]);
  const [active, setActive] = useState<Province | null>(null);

  useEffect(() => {
    setActive(gandaki);
  }, [gandaki]);

  const goToProvinceSearch = (p: Province) => {
    const slug = NEPAL_MAP_GEO_ID_TO_SEARCH_SLUG[p.id];
    if (slug) navigate(`/search?province=${encodeURIComponent(slug)}`);
  };

  return (
    <section className="py-20 md:py-24 bg-muted/40 pattern-overlay">
      <div className="section-container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <span className="text-primary font-medium text-sm uppercase tracking-wider">Explore by Region</span>
          <h2 className="font-display text-4xl md:text-5xl font-bold text-foreground mt-2 mb-4 tracking-tight">
            The Map of Nepal
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Hover a province for details, or click to search homestays in that region.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-[1fr_320px] gap-8 items-start">
          <div className="relative bg-card border border-border rounded-2xl p-4 md:p-6 shadow-soft">
            <svg
              viewBox={NEPAL_MAP_PROJECTION.viewBox}
              className="w-full h-auto"
              role="img"
              aria-label="Map of Nepal showing 7 provinces"
            >
              <g>
                {provinces.map((p) => {
                  const isActive = active?.id === p.id;
                  return (
                    <path
                      key={p.id}
                      d={p.path}
                      fill={fillFor(p, isActive, minStays, maxStays)}
                      stroke={isActive ? 'hsl(var(--primary))' : 'hsl(var(--card))'}
                      strokeWidth={isActive ? 2.5 : 1.25}
                      onMouseEnter={() => setActive(p)}
                      onClick={() => {
                        setActive(p);
                        goToProvinceSearch(p);
                      }}
                      className="cursor-pointer transition-all duration-200 hover:brightness-110"
                      tabIndex={0}
                      role="button"
                      aria-label={`${p.name} province, ${p.homestays} homestays`}
                    />
                  );
                })}
              </g>
              {provinces.map((p) => {
                const isActive = active?.id === p.id;
                return (
                  <g key={`lbl-${p.id}`} className="pointer-events-none">
                    <text
                      x={p.cx}
                      y={p.cy - 4}
                      textAnchor="middle"
                      className={isActive ? 'fill-primary-foreground' : 'fill-foreground'}
                      style={{ fontSize: 12, fontWeight: 700 }}
                    >
                      {p.name}
                    </text>
                    <text
                      x={p.cx}
                      y={p.cy + 12}
                      textAnchor="middle"
                      className={isActive ? 'fill-primary-foreground/80' : 'fill-muted-foreground'}
                      style={{ fontSize: 10, fontWeight: 500 }}
                    >
                      {p.homestays} stays
                    </text>
                  </g>
                );
              })}
            </svg>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 px-2 text-xs text-muted-foreground">
              <span>
                7 provinces · {provinces.reduce((s, p) => s + p.homestays, 0)} total stays
              </span>
            </div>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={active?.id ?? 'idle'}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
              className="bg-card border border-border rounded-2xl p-6 shadow-soft sticky top-24"
            >
              {active ? (
                <>
                  <div className="flex items-center gap-2 text-primary text-sm font-medium mb-2">
                    <MapPin className="w-4 h-4" /> {active.name} Province
                  </div>
                  <p className="font-display text-3xl font-bold text-foreground mb-4 tracking-tight">
                    {active.homestays}
                    <span className="text-base font-normal text-muted-foreground"> homestays</span>
                  </p>
                  <dl className="space-y-3 text-sm">
                    <div>
                      <dt className="text-xs uppercase tracking-wider text-muted-foreground">Signature</dt>
                      <dd className="text-foreground">{active.signature}</dd>
                    </div>
                    <div>
                      <dt className="text-xs uppercase tracking-wider text-muted-foreground">Best season</dt>
                      <dd className="text-foreground">{active.bestSeason}</dd>
                    </div>
                  </dl>
                </>
              ) : (
                <p className="text-muted-foreground text-sm">
                  Hover or tap a region on the map, then click to open search for that province.
                </p>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
