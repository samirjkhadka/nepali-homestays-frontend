import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin } from 'lucide-react';
import { NEPAL_PROVINCE_PATHS, NEPAL_MAP_PROJECTION } from '@/data/nepalProvinceMapPaths';
import { NEPAL_MAP_GEO_ID_TO_SEARCH_SLUG } from '@/data/nepalMapProvinceSearch';

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

const PROVINCE_META: Record<
  number,
  { name: string; homestays: number; signature: string; bestSeason: string }
> = {
  1: { name: 'Koshi', homestays: 45, signature: 'Everest & Ilam tea', bestSeason: 'Oct – May' },
  2: { name: 'Madhesh', homestays: 32, signature: 'Janakpur & plains', bestSeason: 'Oct – Mar' },
  3: { name: 'Bagmati', homestays: 89, signature: 'Kathmandu Valley', bestSeason: 'Oct – Apr' },
  4: { name: 'Gandaki', homestays: 120, signature: 'Annapurna & Pokhara', bestSeason: 'Sep – May' },
  5: { name: 'Lumbini', homestays: 56, signature: 'Birthplace of Buddha', bestSeason: 'Oct – Mar' },
  6: { name: 'Karnali', homestays: 28, signature: 'Rara Lake & Dolpo', bestSeason: 'Apr – Oct' },
  7: { name: 'Sudurpashchim', homestays: 35, signature: 'Khaptad National Park', bestSeason: 'Oct – May' },
};

const provinces: Province[] = NEPAL_PROVINCE_PATHS.map((g) => {
  const m = PROVINCE_META[g.id];
  return { ...g, ...m };
});

const minStays = Math.min(...provinces.map((p) => p.homestays));
const maxStays = Math.max(...provinces.map((p) => p.homestays));

function fillFor(p: Province, isActive: boolean) {
  if (isActive) return 'hsl(var(--primary))';
  const t = (p.homestays - minStays) / (maxStays - minStays);
  const opacity = 0.18 + t * 0.47;
  return `hsl(var(--primary) / ${opacity.toFixed(2)})`;
}

export function InteractiveProvinceMap() {
  const navigate = useNavigate();
  const gandaki = useMemo(() => provinces.find((p) => p.id === 4) ?? provinces[0], []);
  const [active, setActive] = useState<Province | null>(gandaki);

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
            Hover a province for details, or click to search homestays in that region. The panel shows signature
            experiences and the best season to visit.
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
              <defs>
                <filter id="map-shadow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur in="SourceAlpha" stdDeviation="6" />
                  <feOffset dx="0" dy="4" result="off" />
                  <feComponentTransfer>
                    <feFuncA type="linear" slope="0.25" />
                  </feComponentTransfer>
                  <feMerge>
                    <feMergeNode />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
                <pattern id="map-hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                  <line
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="6"
                    stroke="hsl(var(--primary))"
                    strokeWidth="0.8"
                    opacity="0.15"
                  />
                </pattern>
              </defs>

              <rect x="0" y="0" width={NEPAL_MAP_PROJECTION.width} height={NEPAL_MAP_PROJECTION.height} fill="url(#map-hatch)" opacity="0.4" />

              <g filter="url(#map-shadow)">
                {provinces.map((p) => {
                  const isActive = active?.id === p.id;
                  return (
                    <path
                      key={p.id}
                      d={p.path}
                      fill={fillFor(p, isActive)}
                      stroke={isActive ? 'hsl(var(--primary))' : 'hsl(var(--card))'}
                      strokeWidth={isActive ? 2.5 : 1.25}
                      onMouseEnter={() => setActive(p)}
                      onClick={() => {
                        setActive(p);
                        goToProvinceSearch(p);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          setActive(p);
                          goToProvinceSearch(p);
                        }
                      }}
                      className="cursor-pointer transition-all duration-200 hover:brightness-110 focus-visible:outline-none"
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
                      style={{ fontSize: 12, fontWeight: 700, letterSpacing: '-0.01em' }}
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
              <div className="flex items-center gap-2">
                <span>Fewer homestays</span>
                <span className="inline-flex h-2.5 w-32 rounded-full overflow-hidden border border-border">
                  <span className="flex-1" style={{ background: 'hsl(var(--primary) / 0.18)' }} />
                  <span className="flex-1" style={{ background: 'hsl(var(--primary) / 0.32)' }} />
                  <span className="flex-1" style={{ background: 'hsl(var(--primary) / 0.46)' }} />
                  <span className="flex-1" style={{ background: 'hsl(var(--primary) / 0.65)' }} />
                </span>
                <span>More homestays</span>
              </div>
              <span className="hidden sm:inline">
                7 provinces · {provinces.reduce((s, p) => s + p.homestays, 0)} total stays
              </span>
            </div>
            <p className="mt-2 text-[11px] text-muted-foreground px-2">
              Province shapes from open geographic data (simplified for the web; illustrative).
            </p>
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
                  <p className="text-xs text-muted-foreground mt-4">
                    Map numbers are illustrative. Click the province again from search filters to refine.
                  </p>
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
