import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { api } from '@/lib/api';
import { assets } from '@/lib/design-tokens';
import { Mail } from 'lucide-react';

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    api
      .post<{ message: string; resendsRemaining: number }>('/api/auth/forgot-password', { email: email.trim() })
      .then(() => {
        navigate('/reset-password', { state: { email: email.trim() } });
      })
      .catch((err) => {
        setError(err.response?.data?.message || 'Failed to send reset code. Please try again.');
      })
      .finally(() => setLoading(false));
  };

  return (
    <div className="mx-auto flex min-h-[80vh] max-w-md flex-col justify-center px-4 py-12">
      <div className="mb-8 text-center">
        <Link to="/" className="inline-block">
          <img src={assets.logo} alt="Nepali Homestays" className="mx-auto h-14 w-auto" />
        </Link>
        <p className="mt-2 text-sm text-muted-foreground">Reset your password</p>
      </div>
      <Card className="border-primary-200 shadow-lg">
        <CardHeader className="border-b border-primary-100 bg-primary-50/50">
          <div className="flex items-center gap-2">
            <Mail className="h-6 w-6 text-accent-500" />
            <h1 className="text-2xl font-bold text-primary-800">Forgot password?</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Enter your email and we&apos;ll send you a one-time code to reset your password.
          </p>
        </CardHeader>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="forgot-email" className="text-primary-800">
                Email
              </Label>
              <Input
                id="forgot-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@example.com"
                className="mt-1 border-primary-200"
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
              disabled={loading}
            >
              {loading ? 'Sending…' : 'Send reset code'}
            </Button>
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
