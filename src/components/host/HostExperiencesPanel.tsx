import { useCallback, useEffect, useState } from 'react';
import { Users, Clock, AlertCircle, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { api } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

interface Category { id: number; name: string }

interface HostExperience {
  id: number;
  name: string;
  description: string | null;
  price_npr: string | number;
  unit: string;
  category_id: number | null;
  category_name: string | null;
  duration_minutes: number | null;
  min_participants: number;
  max_participants: number | null;
  standalone_bookable: boolean;
  image_url: string | null;
  is_active: boolean;
  upcoming_bookings: number;
}

interface HostExperiencesPanelProps {
  listingId: number;
}

/**
 * Where a host turns a priced line item into something people can find and book.
 *
 * The name, price and unit are set with the rest of the listing above — this is
 * only the part that makes it an experience: what kind of thing it is, how long
 * it takes, how many can come, and whether day visitors are welcome.
 */
export function HostExperiencesPanel({ listingId }: HostExperiencesPanelProps) {
  const { toast } = useToast();
  const [experiences, setExperiences] = useState<HostExperience[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<number | null>(null);
  const [savedId, setSavedId] = useState<number | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    api
      .get<{ experiences: HostExperience[]; categories: Category[] }>(
        `/api/host/listings/${listingId}/experiences`)
      .then((res) => {
        setExperiences(res.data?.experiences ?? []);
        setCategories(res.data?.categories ?? []);
      })
      .catch(() => setExperiences([]))
      .finally(() => setLoading(false));
  }, [listingId]);

  useEffect(load, [load]);

  const patch = (id: number, changes: Partial<HostExperience>) =>
    setExperiences((xs) => xs.map((x) => (x.id === id ? { ...x, ...changes } : x)));

  const save = (x: HostExperience) => {
    if (x.max_participants != null && x.max_participants > 0 && x.max_participants < x.min_participants) {
      toast({ title: 'The maximum cannot be below the minimum.', variant: 'destructive' });
      return;
    }
    setSavingId(x.id);
    api
      .put(`/api/host/listings/${listingId}/experiences/${x.id}`, {
        category_id: x.category_id,
        duration_minutes: x.duration_minutes,
        min_participants: x.min_participants,
        max_participants: x.max_participants,
        standalone_bookable: x.standalone_bookable,
        image_url: x.image_url,
        is_active: x.is_active,
      })
      .then(() => {
        setSavedId(x.id);
        setTimeout(() => setSavedId((s) => (s === x.id ? null : s)), 2500);
        load();
      })
      .catch((err) => toast({ title: err.response?.data?.message || 'Could not save.', variant: 'destructive' }))
      .finally(() => setSavingId(null));
  };

  if (loading) return <p className="text-sm text-muted-foreground">Loading your experiences…</p>;

  if (experiences.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Add an extra service to this listing above — a cooking class, a village walk, an evening of music — and it
        will appear here to describe.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Name and price are set with the listing above. What you fill in here is what lets guests find these on the
        Things to do page.
      </p>

      {experiences.map((x) => {
        const willUnpublish = !x.is_active && x.upcoming_bookings > 0;
        return (
          <Card key={x.id} className={x.is_active ? '' : 'border-dashed opacity-75'}>
            <CardHeader className="border-b bg-muted/40 py-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="font-semibold">{x.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {Number(x.price_npr).toLocaleString()} NPR
                    {x.unit === 'per_person' ? ' per person' : x.unit === 'per_group' ? ' per group' : ''}
                  </p>
                </div>
                {x.upcoming_bookings > 0 && (
                  <span className="rounded-full bg-primary-100 px-2.5 py-1 text-xs text-primary-800">
                    {x.upcoming_bookings} upcoming {x.upcoming_bookings === 1 ? 'booking' : 'bookings'}
                  </span>
                )}
              </div>
            </CardHeader>

            <CardContent className="space-y-4 p-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label className="text-primary-800">What kind of thing is it?</Label>
                  <select
                    value={x.category_id ?? ''}
                    onChange={(e) => patch(x.id, { category_id: e.target.value ? Number(e.target.value) : null })}
                    className="mt-1 w-full rounded-md border border-primary-200 bg-background px-3 py-2 text-sm"
                  >
                    <option value="">Not set</option>
                    {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                  {x.category_id == null && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      Without this, guests filtering by category will not see it.
                    </p>
                  )}
                </div>

                <div>
                  <Label className="text-primary-800">
                    <Clock className="mr-1 inline h-3.5 w-3.5" /> How long, in minutes
                  </Label>
                  <Input
                    type="number" min={0}
                    value={x.duration_minutes ?? ''}
                    onChange={(e) => patch(x.id, { duration_minutes: e.target.value ? Number(e.target.value) : null })}
                    placeholder="90"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label className="text-primary-800">
                    <Users className="mr-1 inline h-3.5 w-3.5" /> Fewest people
                  </Label>
                  <Input
                    type="number" min={1}
                    value={x.min_participants}
                    onChange={(e) => patch(x.id, { min_participants: Math.max(1, Number(e.target.value) || 1) })}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label className="text-primary-800">Most people</Label>
                  <Input
                    type="number" min={0}
                    value={x.max_participants ?? ''}
                    onChange={(e) => patch(x.id, { max_participants: e.target.value ? Number(e.target.value) : null })}
                    placeholder="No limit"
                    className="mt-1"
                  />
                  <p className="mt-1 text-xs text-muted-foreground">
                    Leave empty if you can take any number. We stop taking bookings once this many are coming on a day.
                  </p>
                </div>
              </div>

              <label className="flex cursor-pointer items-start gap-2 rounded-md border border-primary-100 bg-primary-50/40 p-3">
                <input
                  type="checkbox"
                  checked={x.standalone_bookable}
                  onChange={(e) => patch(x.id, { standalone_bookable: e.target.checked })}
                  className="mt-0.5"
                />
                <span className="text-sm">
                  <span className="font-medium">Day visitors can book this without staying the night</span>
                  <span className="mt-0.5 block text-muted-foreground">
                    Someone from Kathmandu or Pokhara could come just for this. Leave it off and it stays an add-on
                    for guests who are already staying with you.
                  </span>
                </span>
              </label>

              <label className="flex cursor-pointer items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={x.is_active}
                  onChange={(e) => patch(x.id, { is_active: e.target.checked })}
                />
                Show this to guests
              </label>

              {willUnpublish && (
                <p className="flex items-start gap-1.5 text-sm text-destructive">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  {x.upcoming_bookings} {x.upcoming_bookings === 1 ? 'person has' : 'people have'} already booked this.
                  Hiding it stops new bookings — it does not cancel theirs.
                </p>
              )}

              <div className="flex items-center gap-3">
                <Button type="button" onClick={() => save(x)} disabled={savingId === x.id}>
                  {savingId === x.id ? 'Saving…' : 'Save'}
                </Button>
                {savedId === x.id && (
                  <span className="flex items-center gap-1 text-sm text-primary-700">
                    <Check className="h-4 w-4" /> Saved
                  </span>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
