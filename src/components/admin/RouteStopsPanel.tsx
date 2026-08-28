import { useCallback, useEffect, useState } from 'react';
import { Mountain, Plus, X, AlertCircle, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { api } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

interface MappedListing { id: number; title: string | null; location: string | null; status: string | null }

interface Stop {
  stop_id: number;
  day_number: number;
  village_name: string;
  altitude_m: number | null;
  nights: number;
  listings: MappedListing[];
}

interface RouteWithStops { id: number; code: string; name: string; stops: Stop[] }

interface Suggestion { id: number; title: string | null; location: string | null; max_guests: number }

/**
 * Mapping villages to homestays.
 *
 * A trek is only bookable when every village on it has a host. Until that is
 * done the route exists and is not walkable, which the browse page says out
 * loud — this is where an admin closes the gap.
 */
export function RouteStopsPanel() {
  const { toast } = useToast();
  const [routes, setRoutes] = useState<RouteWithStops[]>([]);
  const [loading, setLoading] = useState(true);
  const [openStop, setOpenStop] = useState<number | null>(null);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [search, setSearch] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    api
      .get<{ routes: RouteWithStops[] }>('/api/admin/routes')
      .then((res) => setRoutes(res.data?.routes ?? []))
      .catch(() => toast({ title: 'Could not load treks.', variant: 'destructive' }))
      .finally(() => setLoading(false));
  }, [toast]);

  useEffect(load, [load]);

  const openFor = (stop: Stop) => {
    setOpenStop(stop.stop_id);
    setSearch(stop.village_name);
    api
      .get<{ listings: Suggestion[] }>('/api/admin/routes/suggest', { params: { village: stop.village_name } })
      .then((res) => setSuggestions(res.data?.listings ?? []))
      .catch(() => setSuggestions([]));
  };

  const runSearch = (term: string) => {
    setSearch(term);
    api
      .get<{ listings: Suggestion[] }>('/api/admin/routes/suggest', { params: { village: term } })
      .then((res) => setSuggestions(res.data?.listings ?? []))
      .catch(() => setSuggestions([]));
  };

  // The endpoint replaces the whole set, so add and remove are the same call
  // with a different list. Keeps the two operations from drifting apart.
  const setListings = (stop: Stop, ids: number[]) => {
    setSaving(true);
    api
      .put(`/api/admin/routes/stops/${stop.stop_id}/listings`, { listing_ids: ids })
      .then(() => { toast({ title: `${stop.village_name} updated.` }); load(); })
      .catch(() => toast({ title: 'Could not save.', variant: 'destructive' }))
      .finally(() => setSaving(false));
  };

  if (loading) return <p className="text-sm text-muted-foreground">Loading treks…</p>;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Treks</h2>
        <p className="max-w-2xl text-sm text-muted-foreground">
          A trek can only be booked when every village on it has a homestay. Guests see the ones that are not ready
          yet, and are told why, so nobody plans five nights and fails on the sixth.
        </p>
      </div>

      {routes.map((r) => {
        const unmapped = r.stops.filter((s) => s.listings.length === 0).length;
        return (
          <Card key={r.id}>
            <CardContent className="p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="font-semibold">{r.name}</h3>
                {unmapped === 0 ? (
                  <span className="flex items-center gap-1 rounded-full bg-primary-100 px-2.5 py-1 text-xs text-primary-800">
                    <Check className="h-3 w-3" /> bookable
                  </span>
                ) : (
                  <span className="flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-xs text-amber-800">
                    <AlertCircle className="h-3 w-3" />
                    {unmapped} {unmapped === 1 ? 'village' : 'villages'} with no host
                  </span>
                )}
              </div>

              <ol className="mt-4 space-y-3">
                {r.stops.map((s) => (
                  <li key={s.stop_id} className="border-l-2 border-primary-100 pl-3">
                    <div className="flex flex-wrap items-baseline gap-x-3">
                      <span className="font-medium text-primary-800">
                        Night {s.day_number} · {s.village_name}
                      </span>
                      {s.altitude_m && (
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Mountain className="h-3 w-3" />{s.altitude_m} m
                        </span>
                      )}
                      {s.nights > 1 && <span className="text-xs text-muted-foreground">{s.nights} nights</span>}
                    </div>

                    <div className="mt-1.5 flex flex-wrap items-center gap-2">
                      {s.listings.map((l) => (
                        <span
                          key={l.id}
                          className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted px-2.5 py-1 text-sm"
                        >
                          {l.title}
                          <button
                            type="button"
                            aria-label={`Remove ${l.title}`}
                            className="text-muted-foreground hover:text-destructive"
                            onClick={() => setListings(s, s.listings.filter((x) => x.id !== l.id).map((x) => x.id))}
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </span>
                      ))}

                      {s.listings.length === 0 && (
                        <span className="text-sm text-amber-700">No host here yet</span>
                      )}

                      <Button type="button" variant="outline" size="sm" onClick={() => openFor(s)}>
                        <Plus className="mr-1 h-3.5 w-3.5" /> Add
                      </Button>
                    </div>

                    {openStop === s.stop_id && (
                      <div className="mt-2 rounded-md border border-border p-3">
                        <Input
                          value={search}
                          onChange={(e) => runSearch(e.target.value)}
                          placeholder="Search homestays by name or place"
                          className="mb-2"
                        />
                        <div className="max-h-52 space-y-1 overflow-y-auto">
                          {suggestions
                            .filter((x) => !s.listings.some((l) => l.id === x.id))
                            .map((x) => (
                              <button
                                key={x.id}
                                type="button"
                                disabled={saving}
                                onClick={() => setListings(s, [...s.listings.map((l) => l.id), x.id])}
                                className="flex w-full items-center justify-between gap-2 rounded px-2 py-1.5 text-left text-sm hover:bg-muted"
                              >
                                <span className="min-w-0 truncate">{x.title}</span>
                                <span className="shrink-0 text-xs text-muted-foreground">
                                  {x.location} · sleeps {x.max_guests}
                                </span>
                              </button>
                            ))}
                          {suggestions.length === 0 && (
                            <p className="px-2 py-1.5 text-sm text-muted-foreground">
                              Nothing approved matches that. Try a wider search.
                            </p>
                          )}
                        </div>
                        <Button type="button" variant="ghost" size="sm" className="mt-1" onClick={() => setOpenStop(null)}>
                          Done
                        </Button>
                      </div>
                    )}
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
