import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/ui/password-input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import { assets } from '@/lib/design-tokens';
import { LogIn } from 'lucide-react';

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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
          navigate('/');
          return;
        }
        setError(res.data.message || 'Login failed. Please try again.');
      })
      .catch((err) => {
        const apiMessage = err.response?.data?.message;
        const isAuthError = err.response?.status === 401 || err.response?.status === 400;
        const message =
          apiMessage ||
          (isAuthError ? 'Invalid email/mobile or password. Please check and try again.' : null) ||
          err.message ||
          'Invalid email/mobile or password. Please check and try again.';
        setError(message);
      })
      .finally(() => setLoading(false));
  };

  return (
    <div className="mx-auto flex min-h-[80vh] max-w-md flex-col justify-center px-4 py-12">
      <div className="mb-8 text-center">
        <Link to="/" className="inline-block">
          <img src={assets.logo} alt="Nepali Homestays" className="mx-auto h-14 w-auto" />
        </Link>
        <p className="mt-2 text-sm text-muted-foreground">Discover authentic Nepal</p>
      </div>
      <Card className="border-primary-200 shadow-lg">
        <CardHeader className="border-b border-primary-100 bg-primary-50/50">
          <h1 className="text-2xl font-bold text-primary-800">Log in</h1>
          <p className="text-sm text-muted-foreground">
            Use your email or mobile number. First-time login: we&apos;ll send a verification code to your email.
          </p>
        </CardHeader>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="login-email" className="text-primary-800">
                Email or mobile number
              </Label>
              <Input
                id="login-email"
                type="text"
                inputMode="email"
                autoComplete="username"
                value={emailOrPhone}
                onChange={(e) => setEmailOrPhone(e.target.value)}
                required
                placeholder="Email or phone"
                className="mt-1 border-primary-200"
              />
            </div>
            <div>
              <Label htmlFor="login-password" className="text-primary-800">
                Password
              </Label>
              <PasswordInput
                id="login-password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="mt-1 border-primary-200"
              />
            </div>
            {successMessage && (
              <div className="rounded-lg border border-green-500/50 bg-green-500/10 px-3 py-2 text-sm text-green-700">
                {successMessage}
              </div>
            )}
            {error && (
              <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </div>
            )}
            <Button
              type="submit"
              className="w-full bg-accent-500 hover:bg-accent-600"
              disabled={loading}
            >
              <LogIn className="w-4 h-4 mr-2" />
              {loading ? 'Sending…' : 'Log in'}
            </Button>
          </form>
          <p className="mt-6 text-center text-sm text-muted-foreground">
            Don&apos;t have an account?{' '}
            <Link to="/signup" className="font-medium text-accent-600 hover:text-accent-700 hover:underline">
              Sign up
            </Link>
          </p>
          <p className="mt-2 text-center text-sm text-muted-foreground">
            <Link to="/forgot-password" className="font-medium text-accent-600 hover:text-accent-700 hover:underline">
              Forgot password?
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
