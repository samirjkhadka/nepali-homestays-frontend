import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { ShieldCheck, Copy, Check, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { api } from '@/lib/api';
import { useAuth, consoleHome } from '@/lib/auth';

interface ChallengeState {
  challenge: string;
  setupRequired: boolean;
  email?: string;
}

type Stage = 'enrol' | 'verify' | 'codes';

/**
 * The second half of a staff sign-in.
 *
 * Reached only with a challenge token — the password step has passed and
 * nothing else has. There is no session yet, so leaving this page means
 * starting the sign-in again, which is why the page never links away from
 * itself except to do exactly that.
 */
export default function TwoFactorPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { setSessionUser } = useAuth();

  const state = (location.state ?? null) as ChallengeState | null;

  const [stage, setStage] = useState<Stage>(state?.setupRequired ? 'enrol' : 'verify');
  const [secret, setSecret] = useState('');
  const [uri, setUri] = useState('');
  const [code, setCode] = useState('');
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [acknowledged, setAcknowledged] = useState(false);

  // No challenge means someone arrived here directly. Send them back rather
  // than showing a form that cannot possibly work.
  useEffect(() => {
    if (!state?.challenge) navigate('/login', { replace: true });
  }, [state?.challenge, navigate]);

  useEffect(() => {
    if (stage !== 'enrol' || !state?.challenge || secret) return;
    setBusy(true);
    api
      .post<{ secret: string; otpauth_uri: string }>('/api/auth/2fa/setup', { challenge: state.challenge })
      .then((res) => {
        setSecret(res.data.secret);
        setUri(res.data.otpauth_uri);
      })
      .catch((err) => setError(err.response?.data?.message || 'Could not start setup. Sign in again.'))
      .finally(() => setBusy(false));
  }, [stage, state?.challenge, secret]);

  const finish = (user: { id: number; email: string; role: string; name?: string }) => {
    setSessionUser({ ...user, must_change_password: false });
    navigate(consoleHome(user.role), { replace: true });
  };

  const submitCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!state?.challenge) return;
    setError('');
    setBusy(true);

    const endpoint = stage === 'enrol' ? '/api/auth/2fa/confirm' : '/api/auth/2fa/verify';

    api
      .post<{ recovery_codes?: string[]; user: { id: number; email: string; role: string; name?: string } }>(
        endpoint, { challenge: state.challenge, code: code.trim() })
      .then((res) => {
        if (stage === 'enrol' && res.data.recovery_codes?.length) {
          // The session is already live at this point, but the codes are shown
          // once and never again — so the page holds here until they are
          // acknowledged rather than redirecting past them.
          setRecoveryCodes(res.data.recovery_codes);
          setStage('codes');
          return;
        }
        finish(res.data.user);
      })
      .catch((err) => {
        setError(err.response?.data?.message || 'That code did not work.');
        setCode('');
      })
      .finally(() => setBusy(false));
  };

  const copySecret = async () => {
    try {
      await navigator.clipboard.writeText(secret);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError('Could not copy. Select the key and copy it by hand.');
    }
  };

  if (!state?.challenge) return null;

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-lg items-center px-4 py-10">
      <Card className="w-full">
        <CardContent className="p-6">
          <div className="mb-5 flex items-center gap-2">
            <ShieldCheck className="h-6 w-6 text-accent-500" />
            <h1 className="font-display text-2xl font-semibold">
              {stage === 'enrol' ? 'Set up two-factor' : stage === 'codes' ? 'Save your recovery codes' : 'Enter your code'}
            </h1>
          </div>

          {stage === 'enrol' && (
            <>
              <p className="text-muted-foreground">
                Admin accounts need a second factor. Scan this with Google Authenticator, Authy, 1Password or any
                authenticator app, then enter the six digits it shows.
              </p>

              {busy && !uri && <p className="mt-4 text-sm text-muted-foreground">Preparing…</p>}

              {uri && (
                <>
                  <div className="mt-5 flex justify-center rounded-md bg-white p-4">
                    {/* Drawn in the browser from the otpauth URI. A server-rendered
                        QR would be a cacheable image containing the secret. */}
                    <QRCodeSVG value={uri} size={192} level="M" />
                  </div>

                  <div className="mt-4">
                    <Label className="text-xs">Can’t scan? Enter this key by hand</Label>
                    <div className="mt-1 flex gap-2">
                      <Input readOnly value={secret} className="font-mono text-sm" onFocus={(e) => e.currentTarget.select()} />
                      <Button type="button" variant="outline" onClick={copySecret} className="shrink-0">
                        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </>
          )}

          {stage === 'verify' && (
            <p className="text-muted-foreground">
              Open your authenticator app and enter the six digits for Nepali Homestays. You can also enter one of
              your recovery codes.
            </p>
          )}

          {stage === 'codes' ? (
            <>
              <p className="text-muted-foreground">
                Each of these works once, and only if you lose your phone. This is the only time they are shown —
                print them or put them in a password manager now.
              </p>

              <ul className="mt-4 grid grid-cols-2 gap-2 rounded-md border border-border bg-muted/50 p-4 font-mono text-sm">
                {recoveryCodes.map((c) => <li key={c} className="tracking-wider">{c}</li>)}
              </ul>

              <label className="mt-4 flex cursor-pointer items-start gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={acknowledged}
                  onChange={(e) => setAcknowledged(e.target.checked)}
                  className="mt-0.5"
                />
                I have saved these somewhere safe
              </label>

              <Button
                className="mt-4 w-full"
                disabled={!acknowledged}
                onClick={() => navigate(consoleHome('admin'), { replace: true })}
              >
                Continue
              </Button>
            </>
          ) : (
            <form onSubmit={submitCode} className="mt-5 space-y-4">
              <div>
                <Label htmlFor="code">Six-digit code</Label>
                <Input
                  id="code"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  autoFocus
                  placeholder="000000"
                  className="mt-1 text-center font-mono text-lg tracking-[0.4em]"
                />
              </div>

              {error && (
                <p className="flex items-start gap-1.5 text-sm text-destructive">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  {error}
                </p>
              )}

              <Button type="submit" className="w-full" disabled={busy || code.trim().length < 6}>
                {busy ? 'Checking…' : stage === 'enrol' ? 'Turn on two-factor' : 'Sign in'}
              </Button>

              <button
                type="button"
                onClick={() => navigate('/login', { replace: true })}
                className="w-full text-center text-sm text-muted-foreground hover:text-foreground"
              >
                Start again
              </button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
