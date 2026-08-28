import { useCallback, useEffect, useState } from 'react';
import { Home, Plus, Trash2, Users, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { api } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

interface Unit {
  id: number;
  name: string;
  capacity: number;
  sort_order: number;
  is_active: boolean;
  upcoming_bookings: number;
}

interface UnitsResponse {
  units: Unit[];
  bookable_at_once: number;
  total_capacity: number;
}

interface ListingUnitsPanelProps {
  listingId: number;
  /** 'individual' or 'community'; the panel only shows houses for a community. */
  kind: string;
  onKindChange: (kind: string) => void;
}

/**
 * The houses in a community homestay.
 *
 * Registration has always asked how many houses a community has, and the answer
 * was never stored — so a community of six was sold as one house and vanished
 * from search after a single booking. This is where a host finally says what
 * they actually have.
 */
export function ListingUnitsPanel({ listingId, kind, onKindChange }: ListingUnitsPanelProps) {
  const { toast } = useToast();
  const [data, setData] = useState<UnitsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState('');
  const [newCapacity, setNewCapacity] = useState(4);
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    api
      .get<UnitsResponse>(`/api/host/listings/${listingId}/units`)
      .then((res) => setData(res.data))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [listingId]);

  useEffect(load, [load]);

  const setKind = (next: string) => {
    onKindChange(next);
    api
      .put(`/api/host/listings/${listingId}/homestay-kind`, { kind: next })
      .then(() => { toast({ title: 'Homestay type updated.' }); load(); })
      .catch(() => toast({ title: 'Could not change the type.', variant: 'destructive' }));
  };

  const addUnit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setBusy(true);
    api
      .post(`/api/host/listings/${listingId}/units`, {
        name: newName.trim(),
        capacity: newCapacity,
        sort_order: (data?.units.length ?? 0) + 1,
      })
      .then(() => { setNewName(''); load(); })
      .catch((err) => toast({ title: err.response?.data?.message || 'Could not add that house.', variant: 'destructive' }))
      .finally(() => setBusy(false));
  };

  const saveUnit = (u: Unit) => {
    api
      .put(`/api/host/listings/${listingId}/units/${u.id}`, {
        name: u.name, capacity: u.capacity, sort_order: u.sort_order, is_active: u.is_active,
      })
      .then(() => { toast({ title: 'House updated.' }); load(); })
      .catch((err) => toast({ title: err.response?.data?.message || 'Could not save.', variant: 'destructive' }));
  };

  const removeUnit = (u: Unit) => {
    const warning = u.upcoming_bookings > 0
      ? `${u.upcoming_bookings} booking${u.upcoming_bookings === 1 ? '' : 's'} still points at ${u.name}. Remove it anyway?`
      : `Remove ${u.name}?`;
    if (!window.confirm(warning)) return;
    api
      .delete(`/api/host/listings/${listingId}/units/${u.id}`)
      .then(() => { toast({ title: 'House removed.' }); load(); })
      .catch((err) => toast({ title: err.response?.data?.message || 'Could not remove that house.', variant: 'destructive' }));
  };

  const patch = (id: number, changes: Partial<Unit>) =>
    setData((d) => d ? { ...d, units: d.units.map((u) => (u.id === id ? { ...u, ...changes } : u)) } : d);

  return (
    <div className="space-y-5">
      <div>
        <Label className="text-primary-800">Is this one house, or a community?</Label>
        <div className="mt-2 flex flex-col gap-2 sm:flex-row">
          {[
            { value: 'individual', title: 'One house', blurb: 'A single family home taking one booking at a time.' },
            { value: 'community', title: 'A community', blurb: 'Several houses sharing one listing, taking guests at the same time.' },
          ].map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setKind(opt.value)}
              className={`flex-1 rounded-md border p-3 text-left transition-colors ${
                kind === opt.value ? 'border-primary bg-primary-50' : 'border-border hover:bg-muted'
              }`}
            >
              <span className="block font-medium">{opt.title}</span>
              <span className="mt-0.5 block text-sm text-muted-foreground">{opt.blurb}</span>
            </button>
          ))}
        </div>
      </div>

      {kind !== 'community' ? (
        <p className="text-sm text-muted-foreground">
          One house takes one booking at a time. Choose “a community” if several families host together and you can
          take more than one group on the same night.
        </p>
      ) : loading ? (
        <p className="text-sm text-muted-foreground">Loading houses…</p>
      ) : (
        <>
          <div className="rounded-md bg-primary-50/60 p-3 text-sm">
            <p className="flex flex-wrap items-center gap-x-4 gap-y-1">
              <span className="flex items-center gap-1.5">
                <Home className="h-4 w-4 text-accent-500" />
                <strong>{data?.bookable_at_once ?? 1}</strong>
                {(data?.bookable_at_once ?? 1) === 1 ? 'group' : 'groups'} at once
              </span>
              <span className="flex items-center gap-1.5">
                <Users className="h-4 w-4 text-accent-500" />
                <strong>{data?.total_capacity ?? 0}</strong> guests in total
              </span>
            </p>
            <p className="mt-1 text-muted-foreground">
              Guests can keep booking until every house is taken on the same night.
            </p>
          </div>

          <div className="space-y-2">
            {(data?.units ?? []).map((u) => (
              <div
                key={u.id}
                className={`grid items-end gap-2 rounded-md border p-3 sm:grid-cols-[1fr_7rem_auto_auto] ${
                  u.is_active ? 'border-border' : 'border-dashed opacity-70'
                }`}
              >
                <div>
                  <Label className="text-xs">House name</Label>
                  <Input
                    value={u.name}
                    onChange={(e) => patch(u.id, { name: e.target.value })}
                    onBlur={() => saveUnit(u)}
                    className="mt-1"
                  />
                  {u.upcoming_bookings > 0 && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      {u.upcoming_bookings} upcoming {u.upcoming_bookings === 1 ? 'booking' : 'bookings'}
                    </p>
                  )}
                </div>
                <div>
                  <Label className="text-xs">Sleeps</Label>
                  <Input
                    type="number" min={1}
                    value={u.capacity}
                    onChange={(e) => patch(u.id, { capacity: Math.max(1, Number(e.target.value) || 1) })}
                    onBlur={() => saveUnit(u)}
                    className="mt-1"
                  />
                </div>
                <label className="flex items-center gap-2 pb-2 text-sm">
                  <input
                    type="checkbox"
                    checked={u.is_active}
                    onChange={(e) => { patch(u.id, { is_active: e.target.checked }); saveUnit({ ...u, is_active: e.target.checked }); }}
                  />
                  Taking guests
                </label>
                <Button
                  type="button" variant="ghost" size="sm"
                  className="mb-1 text-destructive hover:text-destructive"
                  onClick={() => removeUnit(u)}
                  aria-label={`Remove ${u.name}`}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>

          {(data?.units.length ?? 0) <= 1 && (
            <p className="flex items-start gap-1.5 text-sm text-muted-foreground">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              With one house this behaves exactly like an individual homestay. Add the other houses so guests can
              book more than one group at a time.
            </p>
          )}

          <form onSubmit={addUnit} className="flex flex-col gap-2 border-t pt-4 sm:flex-row sm:items-end">
            <div className="flex-1">
              <Label className="text-xs">Add a house</Label>
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Aama's house"
                className="mt-1"
              />
            </div>
            <div className="sm:w-28">
              <Label className="text-xs">Sleeps</Label>
              <Input
                type="number" min={1}
                value={newCapacity}
                onChange={(e) => setNewCapacity(Math.max(1, Number(e.target.value) || 1))}
                className="mt-1"
              />
            </div>
            <Button type="submit" disabled={busy || !newName.trim()} className="shrink-0">
              <Plus className="mr-1 h-4 w-4" /> Add
            </Button>
          </form>
        </>
      )}
    </div>
  );
}
