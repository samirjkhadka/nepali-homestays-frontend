import { useEffect, useState } from 'react';
import { Label } from '@/components/ui/label';
import { api } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

interface Policy {
  id: number;
  name: string;
  description: string;
}

interface CancellationPolicyPickerProps {
  listingId: number;
  /** The listing's current choice; null means it follows the platform default. */
  value: number | null;
}

/**
 * The host choosing which cancellation terms a listing sells under.
 *
 * Saves on change rather than waiting for the surrounding form: it is a single
 * field with its own endpoint, and a host who picks a policy and then navigates
 * away should not silently lose it.
 */
export function CancellationPolicyPicker({ listingId, value }: CancellationPolicyPickerProps) {
  const { toast } = useToast();
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [selected, setSelected] = useState<string>(value ? String(value) : '');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api
      .get<{ policies: Policy[] }>('/api/cancellation-policies')
      .then((res) => setPolicies(res.data?.policies ?? []))
      .catch(() => setPolicies([]));
  }, []);

  useEffect(() => { setSelected(value ? String(value) : ''); }, [value]);

  const change = (next: string) => {
    const previous = selected;
    setSelected(next);
    setSaving(true);
    api
      .put(`/api/host/listings/${listingId}/cancellation-policy`, { policy_id: next ? Number(next) : null })
      .then(() => toast({ title: 'Cancellation policy updated.' }))
      .catch((err) => {
        // Put the control back where it was, so what is on screen is what is
        // actually saved.
        setSelected(previous);
        toast({ title: err.response?.data?.message || 'Could not update the policy.', variant: 'destructive' });
      })
      .finally(() => setSaving(false));
  };

  const chosen = policies.find((p) => String(p.id) === selected);

  return (
    <div>
      <Label className="text-primary-800">Cancellation policy</Label>
      <select
        value={selected}
        onChange={(e) => change(e.target.value)}
        disabled={saving}
        className="mt-1 w-full rounded-md border border-primary-200 bg-background px-3 py-2 text-sm"
      >
        <option value="">Use the site default</option>
        {policies.map((p) => (
          <option key={p.id} value={String(p.id)}>{p.name}</option>
        ))}
      </select>
      <p className="mt-1 text-sm text-muted-foreground">
        {chosen
          ? chosen.description
          : 'Guests will see whichever policy the site is currently set to use.'}
      </p>
    </div>
  );
}
