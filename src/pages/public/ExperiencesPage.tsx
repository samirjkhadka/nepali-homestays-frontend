import { useEffect, useMemo, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Clock, Users, MapPin, Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { api } from '@/lib/api';
import { getImageDisplayUrl } from '@/lib/image-url';
import { useCurrency } from '@/lib/currency';

const PAGE_SIZE = 24;

interface Category { category_id: number; code: string; name: string; icon: string | null; total: number }

interface Experience {
  id: number;
  name: string;
  description: string | null;
  price_npr: string | number;
  unit: string;
  duration_minutes: number | null;
  min_participants: number;
  max_participants: number | null;
  standalone_bookable: boolean;
  image_url: string | null;
  category: { id: number; code: string; name: string; icon: string | null } | null;
  listing: { id: number; title: string | null; location: string | null };
}

/** "1 hr 30 min" reads faster than "90 minutes" when scanning a grid. */
function formatDuration(mins: number | null): string | null {
  if (!mins || mins <= 0) return null;
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m === 0 ? `${h} hr` : `${h} hr ${m} min`;
}

function formatUnit(unit: string): string {
  if (unit === 'per_person') return 'per person';
  if (unit === 'per_group') return 'per group';
  return '';
}

function formatParticipants(min: number, max: number | null): string | null {
  if (max && max > 0) return min === max ? `${min} guests` : `${min}–${max} guests`;
  if (min > 1) return `${min}+ guests`;
  return null;
}

/**
 * Everything hosts actually do, browsable on its own terms.
 *
 * Aimed squarely at the visitor who is not looking for a bed: a Kathmandu
 * family wanting a Saturday cooking class, or a trekker adding a cultural
 * evening to a stay they have already booked. That audience never reaches this
 * content through a listing page, which is where all of it used to live.
 */
export default function ExperiencesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { format: formatPrice } = useCurrency();

  const [categories, setCategories] = useState<Category[]>([]);
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  const categoryId = searchParams.get('category');
  const standaloneOnly = searchParams.get('standalone') === '1';
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const activeQuery = searchParams.get('q') || '';

  useEffect(() => { setPage(1); }, [categoryId, standaloneOnly, activeQuery]);

  useEffect(() => {
    api
      .get<{ categories: Category[] }>('/api/experiences/categories', {
        params: standaloneOnly ? { standaloneOnly: true } : {},
      })
      .then((res) => setCategories(res.data?.categories ?? []))
      .catch(() => setCategories([]));
  }, [standaloneOnly]);

  useEffect(() => {
    const params: Record<string, string | number | boolean> = { page, limit: PAGE_SIZE };
    if (categoryId) params.category_id = categoryId;
    if (standaloneOnly) params.standaloneOnly = true;
    if (activeQuery) params.q = activeQuery;

    setLoading(true);
    api
      .get<{ experiences: Experience[]; total: number }>('/api/experiences', { params })
      .then((res) => {
        setExperiences(res.data?.experiences ?? []);
        setTotal(res.data?.total ?? 0);
      })
      .catch(() => { setExperiences([]); setTotal(0); })
      .finally(() => setLoading(false));
  }, [page, categoryId, standaloneOnly, activeQuery]);

  const setParam = (key: string, value: string | null) => {
    const next = new URLSearchParams(searchParams);
    if (value === null || value === '') next.delete(key);
    else next.set(key, value);
    setSearchParams(next);
  };

  // Categories with nothing behind them are dropped rather than shown greyed
  // out: the count comes from the same test the search applies, so an empty one
  // is genuinely a dead end.
  const visibleCategories = useMemo(() => categories.filter((c) => c.total > 0), [categories]);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const hasFilters = Boolean(categoryId || standaloneOnly || activeQuery);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <header className="mb-6">
        <h1 className="font-display text-3xl font-semibold text-foreground">Things to do</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Cook dal bhat with a family in Ghandruk, walk the terraces at harvest, sit in on an evening of folk
          music. Some you can join without staying the night.
        </p>
      </header>

      <form
        onSubmit={(e) => { e.preventDefault(); setParam('q', query.trim() || null); }}
        className="mb-4 flex gap-2"
      >
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cooking, yoga, farming…"
            className="pl-9"
            aria-label="Search experiences"
          />
        </div>
        <Button type="submit">Search</Button>
      </form>

      <div className="mb-6 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setParam('category', null)}
          className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${
            !categoryId ? 'border-primary bg-primary text-primary-foreground' : 'border-border hover:bg-muted'
          }`}
        >
          All
        </button>
        {visibleCategories.map((c) => (
          <button
            key={c.category_id}
            type="button"
            onClick={() => setParam('category', String(c.category_id))}
            className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${
              categoryId === String(c.category_id)
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-border hover:bg-muted'
            }`}
          >
            {c.name} <span className="opacity-70 tabular-nums">{c.total}</span>
          </button>
        ))}

        <label className="ml-auto flex cursor-pointer items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={standaloneOnly}
            onChange={(e) => setParam('standalone', e.target.checked ? '1' : null)}
          />
          I&rsquo;m not staying overnight
        </label>
      </div>

      {hasFilters && (
        <button
          type="button"
          onClick={() => { setQuery(''); setSearchParams(new URLSearchParams()); }}
          className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <X className="h-3.5 w-3.5" /> Clear filters
        </button>
      )}

      {loading ? (
        <p className="text-muted-foreground">Loading…</p>
      ) : experiences.length === 0 ? (
        <Card>
          <CardContent className="p-10 text-center">
            <p className="font-medium">Nothing matches that yet</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {standaloneOnly
                ? 'Try turning off “I’m not staying overnight” — many experiences come with a stay.'
                : 'Try a different category, or clear the search.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <p className="mb-3 text-sm text-muted-foreground">
            {total} {total === 1 ? 'experience' : 'experiences'}
          </p>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {experiences.map((x) => {
              const duration = formatDuration(x.duration_minutes);
              const party = formatParticipants(x.min_participants, x.max_participants);
              return (
                <Link key={x.id} to={`/things-to-do/${x.id}`} className="group">
                  <Card className="h-full overflow-hidden transition-shadow hover:shadow-md">
                    {x.image_url && (
                      <img
                        src={getImageDisplayUrl(x.image_url)}
                        alt=""
                        loading="lazy"
                        className="h-40 w-full object-cover transition-transform group-hover:scale-[1.02]"
                      />
                    )}
                    <CardContent className="p-4">
                      <div className="flex flex-wrap items-center gap-2">
                        {x.category && (
                          <span className="rounded-full bg-accent-100 px-2 py-0.5 text-xs text-accent-800">
                            {x.category.name}
                          </span>
                        )}
                        {x.standalone_bookable && (
                          <span className="rounded-full bg-primary-100 px-2 py-0.5 text-xs text-primary-800">
                            No stay needed
                          </span>
                        )}
                      </div>

                      <h2 className="mt-2 font-semibold text-foreground">{x.name}</h2>

                      {x.description && (
                        <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{x.description}</p>
                      )}

                      <p className="mt-2 flex items-center gap-1 text-sm text-muted-foreground">
                        <MapPin className="h-3.5 w-3.5 shrink-0" />
                        <span className="truncate">{x.listing.title || x.listing.location}</span>
                      </p>

                      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                        {duration && (
                          <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{duration}</span>
                        )}
                        {party && (
                          <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" />{party}</span>
                        )}
                      </div>

                      <p className="mt-3 font-semibold text-foreground">
                        {formatPrice(String(x.price_npr))}
                        <span className="ml-1 text-sm font-normal text-muted-foreground">{formatUnit(x.unit)}</span>
                      </p>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>

          {totalPages > 1 && (
            <div className="mt-8 flex items-center justify-center gap-3">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                Previous
              </Button>
              <span className="text-sm text-muted-foreground tabular-nums">Page {page} of {totalPages}</span>
              <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
                Next
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
