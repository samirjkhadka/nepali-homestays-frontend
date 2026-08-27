import { useCallback, useEffect, useState } from 'react';
import { Plus, Trash2, Lock, ChevronDown, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { api } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

interface PolicyRule {
  hours_before_checkin: number;
  refund_percent: number;
  first_night_non_refundable: boolean;
}

interface Policy {
  id: number;
  code: string;
  name: string;
  description: string;
  is_system: boolean;
  is_active: boolean;
  sort_order: number;
  grace_hours: number;
  grace_min_lead_hours: number;
  platform_fee_refundable: boolean;
  rules: PolicyRule[];
}

const BLANK: Policy = {
  id: 0, code: '', name: '', description: '', is_system: false, is_active: true,
  sort_order: 100, grace_hours: 0, grace_min_lead_hours: 0, platform_fee_refundable: false,
  // Every policy needs the 0-hour floor — it decides what a last-minute
  // cancellation gets — so a new one starts with it rather than letting the
  // admin discover the requirement by having their first save rejected.
  rules: [{ hours_before_checkin: 0, refund_percent: 0, first_night_non_refundable: false }],
};

/** Hours as something a person would say, so nobody has to divide by 24 in their head. */
function describeHours(h: number): string {
  if (h <= 0) return 'any time before check-in';
  if (h % 24 === 0) {
    const d = h / 24;
    return d === 1 ? '1 day before' : `${d} days before`;
  }
  return h === 1 ? '1 hour before' : `${h} hours before`;
}

/** The sentence a guest would read, derived from the tiers rather than written twice. */
function plainEnglish(p: Policy): string {
  const ladder = [...p.rules].sort((a, b) => b.hours_before_checkin - a.hours_before_checkin);
  const free = ladder.find((r) => r.refund_percent >= 100 && !r.first_night_non_refundable);
  const parts: string[] = [];

  if (free) {
    parts.push(free.hours_before_checkin === 0
      ? 'Full refund at any time.'
      : `Full refund until ${describeHours(free.hours_before_checkin)} check-in.`);
  }
  if (p.grace_hours > 0) {
    parts.push(`Full refund within ${p.grace_hours} hours of booking${
      p.grace_min_lead_hours > 0 ? `, if check-in is more than ${describeHours(p.grace_min_lead_hours).replace(' before', '')} away` : ''}.`);
  }
  for (const r of ladder) {
    if (r === free) continue;
    const pct = r.refund_percent;
    const first = r.first_night_non_refundable ? ', minus the first night' : '';
    parts.push(pct === 0
      ? `No refund ${r.hours_before_checkin === 0 ? 'after that' : `from ${describeHours(r.hours_before_checkin)} check-in`}.`
      : `${pct}% refund${first} ${r.hours_before_checkin === 0 ? 'after that' : `until ${describeHours(r.hours_before_checkin)} check-in`}.`);
  }
  return parts.join(' ') || 'No tiers configured yet.';
}

/**
 * Editing the cancellation tiers.
 *
 * The five built-in policies can be edited and deactivated but not deleted, so
 * a listing can never end up pointing at terms that no longer exist. That is
 * enforced by the API too; showing it here is so an admin is not surprised.
 */
export function CancellationPoliciesPanel() {
  const { toast } = useToast();
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Policy | null>(null);
  const [saving, setSaving] = useState(false);
  const [openId, setOpenId] = useState<number | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    api
      .get<{ policies: Policy[] }>('/api/admin/cancellation-policies')
      .then((res) => setPolicies(res.data?.policies ?? []))
      .catch(() => toast({ title: 'Could not load cancellation policies.', variant: 'destructive' }))
      .finally(() => setLoading(false));
  }, [toast]);

  useEffect(load, [load]);

  const save = () => {
    if (!editing) return;
    setSaving(true);
    api
      .post('/api/admin/cancellation-policies', editing)
      .then(() => {
        toast({ title: 'Cancellation policy saved.' });
        setEditing(null);
        load();
      })
      .catch((err) => toast({ title: err.response?.data?.message || 'Could not save.', variant: 'destructive' }))
      .finally(() => setSaving(false));
  };

  const remove = (p: Policy) => {
    if (!window.confirm(`Delete "${p.name}"? Listings using it fall back to the platform default.`)) return;
    api
      .delete(`/api/admin/cancellation-policies/${p.id}`)
      .then(() => { toast({ title: 'Policy deleted.' }); load(); })
      .catch((err) => toast({ title: err.response?.data?.message || 'Could not delete.', variant: 'destructive' }));
  };

  const patch = (changes: Partial<Policy>) => setEditing((e) => (e ? { ...e, ...changes } : e));
  const patchRule = (i: number, changes: Partial<PolicyRule>) =>
    setEditing((e) => e ? { ...e, rules: e.rules.map((r, x) => (x === i ? { ...r, ...changes } : r)) } : e);

  if (loading) return <p className="text-sm text-muted-foreground">Loading cancellation policies…</p>;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Cancellation policies</h2>
          <p className="max-w-2xl text-sm text-muted-foreground">
            The terms hosts choose from and guests agree to at checkout. The five built-in tiers follow the
            conventions guests already know from other booking sites — edit the percentages and cut-offs to suit,
            or add your own.
          </p>
        </div>
        <Button type="button" onClick={() => { setEditing({ ...BLANK }); setOpenId(null); }}>
          <Plus className="mr-2 h-4 w-4" /> New policy
        </Button>
      </div>

      {editing && (
        <Card className="border-primary-300">
          <CardHeader className="border-b bg-primary-50/50">
            <h3 className="font-semibold text-primary-800">
              {editing.id > 0 ? `Editing ${editing.name}` : 'New cancellation policy'}
            </h3>
            {editing.is_system && (
              <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Lock className="h-3.5 w-3.5" />
                A built-in tier. You can change how it behaves, but it cannot be deleted.
              </p>
            )}
          </CardHeader>
          <CardContent className="space-y-6 p-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label>Name</Label>
                <Input value={editing.name} onChange={(e) => patch({ name: e.target.value })} className="mt-1" />
              </div>
              <div>
                <Label>Short code</Label>
                <Input
                  value={editing.code}
                  onChange={(e) => patch({ code: e.target.value })}
                  disabled={editing.id > 0}
                  placeholder="peak_season"
                  className="mt-1 font-mono text-sm"
                />
                {editing.id > 0 && (
                  <p className="mt-1 text-xs text-muted-foreground">The code cannot change once a policy exists.</p>
                )}
              </div>
            </div>

            <div>
              <Label>What the guest is told</Label>
              <textarea
                value={editing.description}
                onChange={(e) => patch({ description: e.target.value })}
                rows={3}
                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Shown on the listing and at checkout. Write it the way you would say it out loud.
              </p>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <Label>Refund tiers</Label>
                <Button
                  type="button" variant="outline" size="sm"
                  onClick={() => patch({ rules: [...editing.rules, { hours_before_checkin: 24, refund_percent: 50, first_night_non_refundable: false }] })}
                >
                  <Plus className="mr-1 h-3.5 w-3.5" /> Add tier
                </Button>
              </div>
              <p className="mb-2 mt-1 text-xs text-muted-foreground">
                Cancelling later must never return more than cancelling earlier. Keep one tier at 0 hours — it decides
                what a last-minute cancellation gets.
              </p>

              <div className="space-y-2">
                {editing.rules.map((r, i) => (
                  <div key={i} className="grid items-end gap-2 rounded-md border border-border p-3 sm:grid-cols-[1fr_1fr_auto_auto]">
                    <div>
                      <Label className="text-xs">Cancel at least (hours before)</Label>
                      <Input
                        type="number" min={0} value={r.hours_before_checkin}
                        onChange={(e) => patchRule(i, { hours_before_checkin: Number(e.target.value) })}
                        className="mt-1"
                      />
                      <p className="mt-1 text-xs text-muted-foreground">{describeHours(r.hours_before_checkin)}</p>
                    </div>
                    <div>
                      <Label className="text-xs">Refund %</Label>
                      <Input
                        type="number" min={0} max={100} value={r.refund_percent}
                        onChange={(e) => patchRule(i, { refund_percent: Number(e.target.value) })}
                        className="mt-1"
                      />
                    </div>
                    <label className="flex items-center gap-2 pb-2 text-sm">
                      <input
                        type="checkbox" checked={r.first_night_non_refundable}
                        onChange={(e) => patchRule(i, { first_night_non_refundable: e.target.checked })}
                      />
                      Keep first night
                    </label>
                    <Button
                      type="button" variant="ghost" size="sm"
                      className="mb-1 text-destructive hover:text-destructive"
                      onClick={() => patch({ rules: editing.rules.filter((_, x) => x !== i) })}
                      aria-label="Remove tier"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label>Grace period after booking (hours)</Label>
                <Input
                  type="number" min={0} value={editing.grace_hours}
                  onChange={(e) => patch({ grace_hours: Number(e.target.value) })}
                  className="mt-1"
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  Full refund this soon after booking. 0 turns it off.
                </p>
              </div>
              <div>
                <Label>…but only if check-in is at least (hours away)</Label>
                <Input
                  type="number" min={0} value={editing.grace_min_lead_hours}
                  onChange={(e) => patch({ grace_min_lead_hours: Number(e.target.value) })}
                  className="mt-1"
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  Stops a last-minute booking carrying a free cancellation.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-6">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={editing.is_active} onChange={(e) => patch({ is_active: e.target.checked })} />
                Available for hosts to choose
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox" checked={editing.platform_fee_refundable}
                  onChange={(e) => patch({ platform_fee_refundable: e.target.checked })}
                />
                Refund the service fee on partial refunds
              </label>
            </div>
            <p className="-mt-3 text-xs text-muted-foreground">
              A full refund always returns the service fee, whatever this is set to — otherwise “free cancellation”
              would not be free.
            </p>

            <div className="rounded-md bg-muted p-3">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Guests will see</p>
              <p className="mt-1 text-sm">{plainEnglish(editing)}</p>
            </div>

            <div className="flex gap-2">
              <Button type="button" onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save policy'}</Button>
              <Button type="button" variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-2">
        {policies.map((p) => (
          <Card key={p.id} className={p.is_active ? '' : 'opacity-60'}>
            <CardContent className="p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <button
                  type="button"
                  className="flex min-w-0 flex-1 items-start gap-2 text-left"
                  onClick={() => setOpenId(openId === p.id ? null : p.id)}
                  aria-expanded={openId === p.id}
                >
                  {openId === p.id ? <ChevronDown className="mt-1 h-4 w-4 shrink-0" /> : <ChevronRight className="mt-1 h-4 w-4 shrink-0" />}
                  <span className="min-w-0">
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold">{p.name}</span>
                      <span className="font-mono text-xs text-muted-foreground">{p.code}</span>
                      {p.is_system && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                          <Lock className="h-3 w-3" /> built in
                        </span>
                      )}
                      {!p.is_active && <span className="rounded-full bg-muted px-2 py-0.5 text-xs">hidden</span>}
                    </span>
                    <span className="mt-0.5 block text-sm text-muted-foreground">{plainEnglish(p)}</span>
                  </span>
                </button>
                <div className="flex shrink-0 gap-2">
                  <Button type="button" variant="outline" size="sm" onClick={() => setEditing({ ...p, rules: [...p.rules] })}>
                    Edit
                  </Button>
                  {!p.is_system && (
                    <Button
                      type="button" variant="ghost" size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() => remove(p)} aria-label={`Delete ${p.name}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>

              {openId === p.id && (
                <div className="mt-3 overflow-x-auto border-t pt-3">
                  <table className="w-full min-w-[24rem] text-sm">
                    <thead>
                      <tr className="text-left text-xs uppercase tracking-wide text-muted-foreground">
                        <th className="pb-1 pr-4 font-medium">Cancel by</th>
                        <th className="pb-1 pr-4 font-medium">Refund</th>
                        <th className="pb-1 font-medium">First night</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[...p.rules].sort((a, b) => b.hours_before_checkin - a.hours_before_checkin).map((r) => (
                        <tr key={r.hours_before_checkin} className="border-t border-border/50">
                          <td className="py-1.5 pr-4">{describeHours(r.hours_before_checkin)}</td>
                          <td className="py-1.5 pr-4 tabular-nums">{r.refund_percent}%</td>
                          <td className="py-1.5">{r.first_night_non_refundable ? 'kept by host' : 'refunded'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {p.grace_hours > 0 && (
                    <p className="mt-2 text-xs text-muted-foreground">
                      Plus a full refund within {p.grace_hours} hours of booking
                      {p.grace_min_lead_hours > 0 && `, if check-in is more than ${describeHours(p.grace_min_lead_hours).replace(' before', '')} away`}.
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
