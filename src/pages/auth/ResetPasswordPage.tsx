import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/ui/password-input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { api } from '@/lib/api';
import { assets } from '@/lib/design-tokens';
import { KeyRound, Key } from 'lucide-react';
import { validatePassword, PASSWORD_HINT } from '@/lib/passwordValidation';

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const email = (location.state as { email?: string })?.email || '';
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    const passwordCheck = validatePassword(newPassword);
    if (!passwordCheck.valid) {
      setError(passwordCheck.errors.join('. '));
      return;
    }
    if (!email) {
      setError('Session expired. Please request a new reset code from the forgot password page.');
      return;
    }
    setLoading(true);
    api
      .post<{ message: string }>('/api/auth/reset-password', {
        email,
        otp,
        newPassword,
      })
      .then(() => {
        navigate('/login', { state: { message: 'Password updated. You can now log in with your new password.' } });
      })
      .catch((err) => {
        setError(err.response?.data?.message || 'Invalid or expired code. Please request a new one.');
      })
      .finally(() => setLoading(false));
  };

  if (!email) {
    return (
      <div className="mx-auto flex min-h-[80vh] max-w-md flex-col justify-center px-4 py-12">
        <div className="mb-8 text-center">
          <Link to="/" className="inline-block">
            <img src={assets.logo} alt="Nepali Homestays" className="mx-auto h-14 w-auto" />
          </Link>
        </div>
        <Card className="border-primary-200 shadow-lg">
          <CardContent className="p-6">
            <p className="text-center text-muted-foreground">
              Please start from the forgot password page to receive a reset code.
            </p>
            <Button asChild className="mt-4 w-full bg-accent-500 hover:bg-accent-600">
              <Link to="/forgot-password">Go to Forgot password</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-[80vh] max-w-md flex-col justify-center px-4 py-12">
      <div className="mb-8 text-center">
        <Link to="/" className="inline-block">
          <img src={assets.logo} alt="Nepali Homestays" className="mx-auto h-14 w-auto" />
        </Link>
        <p className="mt-2 text-sm text-muted-foreground">Set your new password</p>
      </div>
      <Card className="border-primary-200 shadow-lg">
        <CardHeader className="border-b border-primary-100 bg-primary-50/50">
          <div className="flex items-center gap-2">
            <KeyRound className="h-6 w-6 text-accent-500" />
            <h1 className="text-2xl font-bold text-primary-800">Set new password</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Enter the 6-digit code we sent to <span className="font-medium text-primary-800">{email}</span> and choose a new password.
          </p>
        </CardHeader>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="reset-otp" className="text-primary-800">
                Verification code
              </Label>
              <Input
                id="reset-otp"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                maxLength={6}
                className="mt-1 border-primary-200 text-center text-xl tracking-[0.4em]"
              />
            </div>
            <div>
              <Label htmlFor="reset-new-password" className="text-primary-800">
                New password
              </Label>
              <PasswordInput
                id="reset-new-password"
                autoComplete="new-password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={8}
                placeholder="Min 8 chars, upper, lower, number, special"
                className="mt-1 border-primary-200"
              />
              <p className="mt-1 text-xs text-muted-foreground">{PASSWORD_HINT}</p>
            </div>
            <div>
              <Label htmlFor="reset-confirm-password" className="text-primary-800">
                Confirm new password
              </Label>
              <PasswordInput
                id="reset-confirm-password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={8}
                placeholder="Repeat new password"
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
              disabled={loading || otp.length !== 6}
            >
              <Key className="w-4 h-4 mr-2" />
              {loading ? 'Updating…' : 'Update password'}
            </Button>
          </form>
          <p className="mt-6 text-center text-sm text-muted-foreground">
            <Link to="/forgot-password" className="font-medium text-accent-600 hover:text-accent-700 hover:underline">
              Request a new code
            </Link>
          </p>
        </CardContent>
      </Card>
      <p className="mt-6 text-center">
        <Link to="/login" className="text-sm text-muted-foreground hover:text-primary-700">
          ← Back to log in
        </Link>
      </p>
    </div>
  );
}
