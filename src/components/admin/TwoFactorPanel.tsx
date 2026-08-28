import { useCallback, useEffect, useState } from 'react';
import { ShieldCheck, ShieldOff, Lock, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';

interface StaffRow {
  user_id: number;
  name: string;
  email: string;
  role: string;
  is_enabled: boolean;
  is_confirmed: boolean;
  locked_until: string | null;
  unused_recovery_codes: number;
  enabled_at: string | null;
}

/**
 * Superadmin control over other admins' second factors.
 *
 * The only reason this exists is the colleague who lost their phone. Everything
 * on it is written from that situation: what state is this account in, and what
 * happens if I switch this off.
 */
export function TwoFactorPanel() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [staff, setStaff] = useState<StaffRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [forbidden, setForbidden] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    api
      .get<{ staff: StaffRow[] }>('/api/admin/two-factor')
      .then((res) => setStaff(res.data?.staff ?? []))
      .catch((err) => {
        if (err.response?.status === 403) setForbidden(true);
        else toast({ title: 'Could not load two-factor status.', variant: 'destructive' });
      })
      .finally(() => setLoading(false));
  }, [toast]);

  useEffect(load, [load]);

  const setEnabled = (row: StaffRow, enabled: boolean) => {
    const warning = enabled
      ? `Require two-factor for ${row.name}? They will set it up at their next sign-in.`
      : `Turn OFF two-factor for ${row.name}?\n\nTheir current authenticator and recovery codes stop working. `
        + `They will sign in with a password alone until it is turned back on.`;
    if (!window.confirm(warning)) return;

    setBusyId(row.user_id);
    api
      .put(`/api/admin/two-factor/${row.user_id}`, { enabled })
      .then((res) => { toast({ title: res.data?.message || 'Updated.' }); load(); })
      .catch((err) => toast({ title: err.response?.data?.message || 'Could not update.', variant: 'destructive' }))
      .finally(() => setBusyId(null));
  };

  // The API is superadmin-only. Saying so beats an empty panel that looks broken.
  if (forbidden) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Lock className="mx-auto h-8 w-8 text-muted-foreground" />
          <p className="mt-3 font-medium">Superadmin only</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Only a superadmin can change two-factor for other accounts. Ask one of them.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (loading) return <p className="text-sm text-muted-foreground">Loading…</p>;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Two-factor authentication</h2>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Every admin account needs an authenticator app. Turn it off only for someone who has lost their phone —
          doing so clears their authenticator and their recovery codes, so they set it up fresh next time.
        </p>
      </div>

      <div className="space-y-2">
        {staff.map((row) => {
          const isSelf = user?.id === row.user_id;
          const locked = row.locked_until && new Date(row.locked_until) > new Date();

          return (
            <Card key={row.user_id}>
              <CardContent className="flex flex-wrap items-center justify-between gap-4 p-4">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium">{row.name}</span>
                    <span className="text-sm text-muted-foreground">{row.email}</span>
                    {row.role === 'superadmin' && (
                      <span className="rounded-full bg-accent-100 px-2 py-0.5 text-xs text-accent-800">superadmin</span>
                    )}
                    {isSelf && <span className="text-xs text-muted-foreground">(you)</span>}
                  </div>

                  <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                    {!row.is_enabled ? (
                      <span className="flex items-center gap-1.5 text-destructive">
                        <ShieldOff className="h-3.5 w-3.5" /> Password only
                      </span>
                    ) : row.is_confirmed ? (
                      <span className="flex items-center gap-1.5 text-primary-700">
                        <ShieldCheck className="h-3.5 w-3.5" /> Set up
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 text-amber-700">
                        <AlertCircle className="h-3.5 w-3.5" /> Will set up at next sign-in
                      </span>
                    )}

                    {row.is_confirmed && (
                      <span className={row.unused_recovery_codes === 0 ? 'text-amber-700' : 'text-muted-foreground'}>
                        {row.unused_recovery_codes} recovery {row.unused_recovery_codes === 1 ? 'code' : 'codes'} left
                      </span>
                    )}

                    {locked && (
                      <span className="flex items-center gap-1.5 text-destructive">
                        <Lock className="h-3.5 w-3.5" /> Locked until{' '}
                        {new Date(row.locked_until!).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    )}
                  </div>
                </div>

                <div className="shrink-0">
                  {isSelf ? (
                    // The API refuses this too. Showing a disabled control with
                    // the reason beats a button that always errors.
                    <span className="text-sm text-muted-foreground">
                      Ask another superadmin to change yours
                    </span>
                  ) : row.is_enabled ? (
                    <Button
                      type="button" variant="outline" size="sm"
                      disabled={busyId === row.user_id}
                      className="text-destructive hover:text-destructive"
                      onClick={() => setEnabled(row, false)}
                    >
                      Turn off
                    </Button>
                  ) : (
                    <Button
                      type="button" size="sm"
                      disabled={busyId === row.user_id}
                      onClick={() => setEnabled(row, true)}
                    >
                      Require
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
