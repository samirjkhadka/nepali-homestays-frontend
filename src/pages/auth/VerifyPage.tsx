import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import { assets } from '@/lib/design-tokens';
import { Mail } from 'lucide-react';

export default function VerifyPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
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
      .post<{ token: string; refreshToken: string; user: { id: number; email: string; role: string } }>(
        '/api/auth/verify',
        { email, otp }
      )
      .then((res) => {
        login(res.data.token, res.data.user);
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
    <div className="mx-auto flex min-h-[80vh] max-w-md flex-col justify-center px-4 py-12">
      <div className="mb-8 text-center">
        <Link to="/" className="inline-block">
          <img src={assets.logo} alt="Nepali Homestays" className="mx-auto h-14 w-auto" />
        </Link>
        <p className="mt-2 text-sm text-muted-foreground">Verify your email</p>
      </div>
      <Card className="border-primary-200 shadow-lg">
        <CardHeader className="border-b border-primary-100 bg-primary-50/50">
          <div className="flex items-center gap-2">
            <Mail className="h-6 w-6 text-accent-500" />
            <h1 className="text-2xl font-bold text-primary-800">Check your email</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Enter the 6-digit code we sent to <span className="font-medium text-primary-800">{email || 'your email'}</span>. You can request a new code up to 3 times if it expires.
          </p>
        </CardHeader>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="verify-otp" className="text-primary-800">
                Verification code
              </Label>
              <Input
                id="verify-otp"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                maxLength={6}
                className="mt-1 border-primary-200 text-center text-xl tracking-[0.4em]"
              />
            </div>
            {error && (
              <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </div>
            )}
            <Button
              type="submit"
              className="w-full bg-accent-500 hover:bg-accent-600"
              disabled={loading || otp.length !== 6}
            >
              {loading ? 'Verifying…' : 'Verify'}
            </Button>
            <div className="mt-4 flex items-center justify-between gap-2 border-t border-primary-100 pt-4">
              <p className="text-xs text-muted-foreground">
                Code expired? Request a new one (max 3 times).
                {resendsRemaining !== null && (
                  <span className="ml-1 font-medium text-primary-700">
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
                className="shrink-0 border-primary-200"
              >
                {resendLoading ? 'Sending…' : 'Resend code'}
              </Button>
            </div>
          </form>
          <p className="mt-6 text-center text-sm text-muted-foreground">
            <Link to="/login" className="font-medium text-accent-600 hover:text-accent-700 hover:underline">
              Back to log in
            </Link>
          </p>
        </CardContent>
      </Card>
      <p className="mt-6 text-center">
        <Link to="/" className="text-sm text-muted-foreground hover:text-primary-700">
          ← Back to home
        </Link>
      </p>
    </div>
  );
}
