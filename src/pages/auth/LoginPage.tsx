import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { Mail, Lock, LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/ui/password-input';
import { Label } from '@/components/ui/label';
import { AuthPageLayout } from '@/components/auth/AuthPageLayout';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { login } = useAuth();
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const becameHost = searchParams.get('became') === 'host';
  const successMessage = (location.state as { message?: string })?.message;
  useEffect(() => {
    if (successMessage) setError('');
  }, [successMessage]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    api
      .post<{ requireOtp?: boolean; token?: string; user?: { id: number; email: string; role: string }; message?: string; email?: string }>(
        '/api/auth/login',
        { email: emailOrPhone.trim(), password }
      )
      .then((res) => {
        if (res.data.requireOtp !== false) {
          const emailForVerify = res.data.email ?? (emailOrPhone.includes('@') ? emailOrPhone : '');
          if (!emailForVerify) {
            setError('Unable to send verification code. Please try with your email address.');
            return;
          }
          navigate('/verify', { state: { email: emailForVerify } });
          return;
        }
        if (res.data.token && res.data.user) {
          login(res.data.token, res.data.user);
          navigate(res.data.user.role === 'host' ? '/dashboard/host' : '/');
          return;
        }
        setError(res.data.message || 'Login failed. Please try again.');
      })
      .catch((err) => {
        const apiMessage = err.response?.data?.message;
        const status = err.response?.status;
        const isAuthError = err.response?.status === 401 || err.response?.status === 400;
        const message =
          (status === 429 ? 'Too many login attempts. Please wait a minute and try again.' : null) ||
          apiMessage ||
          (isAuthError ? 'Invalid email/mobile or password. Please check and try again.' : null) ||
          err.message ||
          'Invalid email/mobile or password. Please check and try again.';
        setError(message);
      })
      .finally(() => setLoading(false));
  };

  return (
    <AuthPageLayout
      title="Welcome back"
      description={
        <>
          Sign in with your email or mobile. First-time login: we&apos;ll email you a verification code.
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="login-email" className="text-foreground">
            Email or mobile number
          </Label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="login-email"
              type="text"
              inputMode="email"
              autoComplete="username"
              value={emailOrPhone}
              onChange={(e) => setEmailOrPhone(e.target.value)}
              required
              placeholder="you@example.com or +977…"
              className="border-0 bg-muted/60 pl-10"
            />
          </div>
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="login-password" className="text-foreground">
              Password
            </Label>
            <Link to="/forgot-password" className="text-sm text-primary hover:underline">
              Forgot?
            </Link>
          </div>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3 top-1/2 z-10 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            <PasswordInput
              id="login-password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="border-0 bg-muted/60 pl-10"
            />
          </div>
        </div>
        {becameHost && (
          <div className="rounded-lg border border-primary/30 bg-primary/5 px-3 py-2 text-sm text-foreground">
            You are now a host. Log in to access the Host Dashboard.
          </div>
        )}
        {successMessage && !becameHost && (
          <div className="rounded-lg border border-green-500/40 bg-green-500/10 px-3 py-2 text-sm text-foreground">
            {successMessage}
          </div>
        )}
        {error && (
          <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </div>
        )}
        <Button type="submit" className="w-full" size="lg" disabled={loading}>
          <LogIn className="mr-2 h-4 w-4" />
          {loading ? 'Sending…' : 'Log in'}
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-muted-foreground">
        Don&apos;t have an account?{' '}
        <Link to="/signup" className="font-medium text-primary hover:underline">
          Sign up
        </Link>
      </p>
    </AuthPageLayout>
  );
}
