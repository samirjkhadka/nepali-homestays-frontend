import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Mail, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AuthPageLayout } from '@/components/auth/AuthPageLayout';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';

export default function VerifyPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { setSessionUser } = useAuth();
  const email = (location.state as { email?: string })?.email || '';
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendsRemaining, setResendsRemaining] = useState<number | null>(null);
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError('Email missing. Please sign up or log in again.');
      return;
    }
    setError('');
    setLoading(true);
    api
      .post<{
        token: string;
        refreshToken: string;
        user: { id: number; email: string; role: string; must_change_password?: boolean };
        mustChangePassword?: boolean;
      }>('/api/auth/verify', { email, otp })
      .then((res) => {
        const mustChange =
          Boolean(res.data.user.must_change_password) || Boolean(res.data.mustChangePassword);
        const user = { ...res.data.user, must_change_password: mustChange };
        setSessionUser(user);
        if (mustChange) {
          navigate('/profile/change-password', { replace: true });
          return;
        }
        navigate('/');
      })
      .catch((err) => setError(err.response?.data?.message || 'Invalid or expired code.'))
      .finally(() => setLoading(false));
  };

  const handleResendOtp = () => {
    if (!email) return;
    setError('');
    setResendLoading(true);
    api
      .post<{ message: string; resendsRemaining: number }>('/api/auth/resend-otp', { email })
      .then((res) => {
        setResendsRemaining(res.data.resendsRemaining);
        setError('');
      })
      .catch((err) => setError(err.response?.data?.message || 'Failed to resend code.'))
      .finally(() => setResendLoading(false));
  };

  return (
    <AuthPageLayout
      header={
        <div>
          <div className="flex items-center justify-center gap-2 text-center">
            <Mail className="h-6 w-6 shrink-0 text-primary" />
            <h1 className="font-display text-2xl font-bold text-foreground">Check your email</h1>
          </div>
          <p className="mt-2 text-center text-sm text-muted-foreground">
            Enter the 6-digit code we sent to{' '}
            <span className="font-medium text-foreground">{email || 'your email'}</span>. You can request a new code
            up to 3 times if it expires.
          </p>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="verify-otp" className="text-foreground">
            Verification code
          </Label>
          <Input
            id="verify-otp"
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="000000"
            maxLength={6}
            className="border-0 bg-muted/60 text-center text-xl tracking-[0.4em]"
          />
        </div>
        {error && (
          <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </div>
        )}
        <Button type="submit" className="w-full" size="lg" disabled={loading || otp.length !== 6}>
          <CheckCircle className="mr-2 h-4 w-4" />
          {loading ? 'Verifying…' : 'Verify'}
        </Button>
        <div className="mt-4 flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-muted-foreground">
            Code expired? Request a new one (max 3 times).
            {resendsRemaining !== null && (
              <span className="ml-1 font-medium text-foreground">
                {resendsRemaining} request{resendsRemaining !== 1 ? 's' : ''} left.
              </span>
            )}
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleResendOtp}
            disabled={resendLoading || !email || (resendsRemaining !== null && resendsRemaining <= 0)}
            className="shrink-0"
          >
            {resendLoading ? 'Sending…' : 'Resend code'}
          </Button>
        </div>
      </form>
      <p className="mt-6 text-center text-sm text-muted-foreground">
        <Link to="/login" className="font-medium text-primary hover:underline">
          Back to log in
        </Link>
      </p>
    </AuthPageLayout>
  );
}
