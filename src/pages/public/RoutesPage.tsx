import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Mountain, Moon, MapPin } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { api } from '@/lib/api';
import { getImageDisplayUrl } from '@/lib/image-url';

interface Route {
  id: number;
  code: string;
  name: string;
  description: string | null;
  region: string | null;
  total_nights: number;
  difficulty: string | null;
  image_url: string | null;
  stop_count: number;
  bookable: boolean;
}

const DIFFICULTY_CLASS: Record<string, string> = {
  easy: 'bg-primary-100 text-primary-800',
  moderate: 'bg-accent-100 text-accent-800',
  challenging: 'bg-amber-100 text-amber-800',
  strenuous: 'bg-destructive/10 text-destructive',
};

/**
 * The walks.
 *
 * A route is the unit people actually plan around — nobody books one village in
 * isolation — and it is the one thing on this platform that a single-property
 * marketplace cannot express.
 */
export default function RoutesPage() {
  const [routes, setRoutes] = useState<Route[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<{ routes: Route[] }>('/api/routes')
      .then((res) => setRoutes(res.data?.routes ?? []))
      .catch(() => setRoutes([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <header className="mb-6">
        <h1 className="font-display text-3xl font-semibold text-foreground">Treks</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Walk village to village and sleep in a different home each night. Pick a route and a start date, and book
          the whole way in one go.
        </p>
      </header>

      {loading ? (
        <p className="text-muted-foreground">Loading…</p>
      ) : routes.length === 0 ? (
        <Card><CardContent className="p-10 text-center text-muted-foreground">No treks yet.</CardContent></Card>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {routes.map((r) => {
            const card = (
              <Card className={`h-full overflow-hidden transition-shadow ${r.bookable ? 'hover:shadow-md' : 'opacity-75'}`}>
                {r.image_url && (
                  <img src={getImageDisplayUrl(r.image_url)} alt="" loading="lazy" className="h-40 w-full object-cover" />
                )}
                <CardContent className="p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    {r.region && (
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3" />{r.region}
                      </span>
                    )}
                    {r.difficulty && (
                      <span className={`rounded-full px-2 py-0.5 text-xs ${DIFFICULTY_CLASS[r.difficulty] ?? 'bg-muted'}`}>
                        {r.difficulty}
                      </span>
                    )}
                  </div>

                  <h2 className="mt-2 font-semibold text-foreground">{r.name}</h2>

                  {r.description && (
                    <p className="mt-1 line-clamp-3 text-sm text-muted-foreground">{r.description}</p>
                  )}

                  <p className="mt-3 flex flex-wrap gap-x-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1.5"><Moon className="h-3.5 w-3.5" />{r.total_nights} nights</span>
                    <span className="flex items-center gap-1.5"><Mountain className="h-3.5 w-3.5" />{r.stop_count} villages</span>
                  </p>

                  {!r.bookable && (
                    // Said plainly rather than hidden: a route with a village
                    // nobody hosts yet is still worth showing, and pretending it
                    // is bookable would fail a guest halfway through planning.
                    <p className="mt-3 text-xs text-muted-foreground">
                      Not bookable end to end yet — some villages have no host signed up.
                    </p>
                  )}
                </CardContent>
              </Card>
            );

            return r.bookable
              ? <Link key={r.id} to={`/treks/${r.id}`} className="group">{card}</Link>
              : <div key={r.id}>{card}</div>;
          })}
        </div>
      )}
    </div>
  );
}
