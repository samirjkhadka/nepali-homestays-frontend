import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AuthPageLayout } from '@/components/auth/AuthPageLayout';
import { api } from '@/lib/api';

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
    <AuthPageLayout
      header={
        <div>
          <div className="flex items-center justify-center gap-2 text-center">
            <Mail className="h-6 w-6 shrink-0 text-primary" />
            <h1 className="font-display text-2xl font-bold text-foreground">Forgot password?</h1>
          </div>
          <p className="mt-2 text-center text-sm text-muted-foreground">
            Enter your email and we&apos;ll send you a one-time code to reset your password.
          </p>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="forgot-email" className="text-foreground">
            Email
          </Label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="forgot-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="you@example.com"
              className="border-0 bg-muted/60 pl-10"
            />
          </div>
        </div>
        {error && (
          <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </div>
        )}
        <Button type="submit" className="w-full" size="lg" disabled={loading}>
          <Send className="mr-2 h-4 w-4" />
          {loading ? 'Sending…' : 'Send reset code'}
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-muted-foreground">
        <Link to="/login" className="font-medium text-primary hover:underline">
          Back to log in
        </Link>
      </p>
    </AuthPageLayout>
  );
}
