import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Scale, X, Star, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import { getImageDisplayUrl } from '@/lib/image-url';
import { useCurrency } from '@/lib/currency';

type CompareListing = {
  id: number;
  title: string;
  location: string;
  image_url?: string | null;
  average_rating?: number | null;
  review_count?: number;
  price_per_night: string | number;
};

const COMPARE_STORAGE_KEY = 'nh-local-compare-listing-ids-v1';
const COMPARE_UPDATED_EVENT = 'nh-compare-updated';
const COMPARE_MAX = 4;

function readCompareIds(): number[] {
  try {
    const raw = localStorage.getItem(COMPARE_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((x) => Number.isInteger(x)).map((x) => Number(x)).slice(0, COMPARE_MAX);
  } catch {
    return [];
  }
}

export default function CompareWidget() {
  const { format: formatPrice } = useCurrency();
  const [open, setOpen] = useState(false);
  const [ids, setIds] = useState<number[]>([]);
  const [items, setItems] = useState<CompareListing[]>([]);

  useEffect(() => {
    const sync = () => setIds(readCompareIds());
    sync();
    window.addEventListener('storage', sync);
    window.addEventListener(COMPARE_UPDATED_EVENT, sync);
    return () => {
      window.removeEventListener('storage', sync);
      window.removeEventListener(COMPARE_UPDATED_EVENT, sync);
    };
  }, []);

  useEffect(() => {
    if (!ids.length) {
      setItems([]);
      return;
    }
    Promise.all(
      ids.map((id) =>
        api
          .get<CompareListing>(`/api/listings/${id}`)
          .then((res) => res.data)
          .catch(() => null)
      )
    ).then((rows) => setItems(rows.filter((x): x is CompareListing => x != null)));
  }, [ids]);

  const persist = (next: number[]) => {
    setIds(next);
    localStorage.setItem(COMPARE_STORAGE_KEY, JSON.stringify(next));
    window.dispatchEvent(new Event(COMPARE_UPDATED_EVENT));
  };

  const removeOne = (id: number) => persist(ids.filter((x) => x !== id));
  const clear = () => persist([]);

  return (
    <>
      <AnimatePresence>
        {ids.length > 0 && (
          <motion.button
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            onClick={() => setOpen(true)}
            className="fixed bottom-6 right-6 z-40 bg-primary text-primary-foreground rounded-full shadow-elevated px-5 py-3 flex items-center gap-2 font-semibold hover:bg-primary/90 transition-colors"
          >
            <Scale className="w-5 h-5" />
            Compare ({ids.length})
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/40"
              onClick={() => setOpen(false)}
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 280, damping: 28 }}
              className="fixed inset-x-0 bottom-0 z-[60] h-[80vh] rounded-t-2xl border border-border bg-background p-4 md:p-6 overflow-y-auto"
            >
              <div className="mx-auto max-w-7xl">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-foreground">Compare homestays ({ids.length}/4)</h3>
                  <div className="flex items-center gap-2">
                    {ids.length > 0 && (
                      <Button type="button" variant="ghost" size="sm" onClick={clear}>
                        Clear all
                      </Button>
                    )}
                    <Button type="button" variant="outline" size="sm" onClick={() => setOpen(false)}>
                      Close
                    </Button>
                  </div>
                </div>

                {!ids.length && <p className="py-10 text-center text-muted-foreground">Add homestays to compare them side by side.</p>}

                {!!ids.length && (
                  <div className={`grid gap-4 ${items.length <= 1 ? 'grid-cols-1' : items.length === 2 ? 'md:grid-cols-2' : items.length === 3 ? 'md:grid-cols-3' : 'md:grid-cols-4'}`}>
                    {ids.map((id) => {
                      const h = items.find((x) => x.id === id);
                      if (!h) {
                        return (
                          <div key={id} className="rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground">
                            Loading listing {id}...
                          </div>
                        );
                      }
                      return (
                        <div key={h.id} className="rounded-xl border border-border bg-card overflow-hidden flex flex-col">
                          <div className="relative aspect-video">
                            <img src={getImageDisplayUrl(h.image_url || '')} alt={h.title} className="h-full w-full object-cover" />
                            <button
                              type="button"
                              onClick={() => removeOne(h.id)}
                              className="absolute top-2 right-2 p-1.5 rounded-full bg-card/80 hover:bg-card"
                              aria-label="Remove from compare"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                          <div className="p-3 space-y-2 text-sm flex-1 flex flex-col">
                            <h4 className="font-semibold text-foreground line-clamp-1">{h.title}</h4>
                            <div className="flex items-center gap-1 text-muted-foreground text-xs">
                              <MapPin className="w-3 h-3" />
                              {h.location}
                            </div>
                            <div className="flex items-center gap-1 text-xs">
                              <Star className="w-3 h-3 fill-accent text-accent" />
                              <span className="font-medium">{Number(h.average_rating ?? 0).toFixed(1)}</span>
                              <span className="text-muted-foreground">({h.review_count ?? 0})</span>
                            </div>
                            <div className="mt-auto pt-2">
                              <div className="font-semibold text-primary">
                                {formatPrice(h.price_per_night)}
                                <span className="text-xs text-muted-foreground font-normal">/night</span>
                              </div>
                              <Link to={`/listings/${h.id}`} onClick={() => setOpen(false)}>
                                <Button size="sm" variant="outline" className="w-full mt-2">View</Button>
                              </Link>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
