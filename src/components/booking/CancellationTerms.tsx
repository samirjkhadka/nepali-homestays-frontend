import { useEffect, useState } from 'react';
import { CalendarX } from 'lucide-react';
import { api } from '@/lib/api';

interface PolicyRule {
  hours_before_checkin: number;
  refund_percent: number;
  first_night_non_refundable: boolean;
}

interface Policy {
  name: string;
  description: string;
  grace_hours: number;
  grace_min_lead_hours: number;
  rules: PolicyRule[];
}

interface CancellationTermsProps {
  listingId: number;
  /** `full` for the listing page, `compact` for checkout. */
  variant?: 'full' | 'compact';
}

function describeHours(h: number): string {
  if (h <= 0) return 'any time';
  if (h % 24 === 0) {
    const d = h / 24;
    return d === 1 ? '1 day' : `${d} days`;
  }
  return h === 1 ? '1 hour' : `${h} hours`;
}

/**
 * The cancellation terms for a listing.
 *
 * Shown where the guest is deciding, not buried in a policy page: what happens
 * if plans change is part of the price, and burying it is how a booking becomes
 * a complaint.
 *
 * Renders nothing at all if the terms cannot be loaded. A silent gap is better
 * than an error box on a page someone is trying to read, and the booking flow
 * still shows the real number before anyone commits.
 */
export function CancellationTerms({ listingId, variant = 'full' }: CancellationTermsProps) {
  const [policy, setPolicy] = useState<Policy | null>(null);

  useEffect(() => {
    let live = true;
    api
      .get<{ policy: Policy }>(`/api/listings/${listingId}/cancellation-policy`)
      .then((res) => { if (live) setPolicy(res.data?.policy ?? null); })
      .catch(() => { if (live) setPolicy(null); });
    return () => { live = false; };
  }, [listingId]);

  if (!policy) return null;

  if (variant === 'compact') {
    return (
      <div className="rounded-md bg-muted/60 p-3">
        <p className="text-sm font-medium">{policy.name} cancellation</p>
        <p className="mt-0.5 text-xs text-muted-foreground">{policy.description}</p>
      </div>
    );
  }

  const ladder = [...policy.rules].sort((a, b) => b.hours_before_checkin - a.hours_before_checkin);

  return (
    <div className="border-t border-border pt-8 pb-8">
      <div className="mb-3 flex items-center gap-2">
        <CalendarX className="h-5 w-5 text-accent-500" />
        <h2 className="font-display text-xl font-semibold text-foreground">
          Cancellation — {policy.name}
        </h2>
      </div>

      <p className="max-w-2xl text-muted-foreground">{policy.description}</p>

      {ladder.length > 0 && (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[20rem] max-w-lg text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th className="pb-1 pr-6 font-medium">If you cancel</th>
                <th className="pb-1 font-medium">You get back</th>
              </tr>
            </thead>
            <tbody>
              {ladder.map((r) => (
                <tr key={r.hours_before_checkin} className="border-t border-border/60">
                  <td className="py-2 pr-6">
                    {r.hours_before_checkin === 0
                      ? 'Less than that'
                      : `${describeHours(r.hours_before_checkin)} or more before check-in`}
                  </td>
                  <td className="py-2 tabular-nums">
                    {r.refund_percent === 0
                      ? 'Nothing'
                      : `${r.refund_percent}%${r.first_night_non_refundable ? ', minus the first night' : ''}`}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {policy.grace_hours > 0 && (
        <p className="mt-3 max-w-2xl text-sm text-muted-foreground">
          You also get a full refund within {policy.grace_hours} hours of booking
          {policy.grace_min_lead_hours > 0 &&
            `, as long as check-in is more than ${describeHours(policy.grace_min_lead_hours)} away`}.
        </p>
      )}

      <p className="mt-3 text-xs text-muted-foreground">
        Deadlines are counted from midnight at the start of your check-in day, Nepal time.
      </p>
    </div>
  );
}
