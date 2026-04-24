import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { KeyRound, Key } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/ui/password-input';
import { Label } from '@/components/ui/label';
import { AuthPageLayout } from '@/components/auth/AuthPageLayout';
import { api } from '@/lib/api';
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

  const newPasswordValidation = validatePassword(newPassword);
  const confirmMismatch = confirmPassword.length > 0 && newPassword !== confirmPassword;

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
      <AuthPageLayout title="Reset your password" description="Start from the link we emailed you, or request a new code.">
        <p className="text-center text-sm text-muted-foreground">
          Please use the forgot password page first so we can email you a reset code.
        </p>
        <Button asChild className="mt-6 w-full" size="lg">
          <Link to="/forgot-password">Go to forgot password</Link>
        </Button>
      </AuthPageLayout>
    );
  }

  return (
    <AuthPageLayout
      header={
        <div>
          <div className="flex items-center justify-center gap-2 text-center">
            <KeyRound className="h-6 w-6 shrink-0 text-primary" />
            <h1 className="font-display text-2xl font-bold text-foreground">Set new password</h1>
          </div>
          <p className="mt-2 text-center text-sm text-muted-foreground">
            Enter the 6-digit code we sent to <span className="font-medium text-foreground">{email}</span> and choose
            a new password.
          </p>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="reset-otp" className="text-foreground">
            Verification code
          </Label>
          <Input
            id="reset-otp"
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="000000"
            maxLength={6}
            className="border-0 bg-muted/60 text-center text-xl tracking-[0.4em]"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="reset-new-password" className="text-foreground">
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
            className="border-0 bg-muted/60"
          />
          <p className="text-xs text-muted-foreground">{PASSWORD_HINT}</p>
          {newPassword.length > 0 && !newPasswordValidation.valid && (
            <ul className="list-inside list-disc text-xs text-destructive">
              {newPasswordValidation.errors.map((err) => (
                <li key={err}>{err}</li>
              ))}
            </ul>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="reset-confirm-password" className="text-foreground">
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
            className="border-0 bg-muted/60"
          />
          {confirmMismatch && <p className="text-xs text-destructive">Passwords do not match.</p>}
        </div>
        {error && (
          <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </div>
        )}
        <Button type="submit" className="w-full" size="lg" disabled={loading || otp.length !== 6}>
          <Key className="mr-2 h-4 w-4" />
          {loading ? 'Updating…' : 'Update password'}
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-muted-foreground">
        <Link to="/forgot-password" className="font-medium text-primary hover:underline">
          Request a new code
        </Link>
        {' · '}
        <Link to="/login" className="font-medium text-primary hover:underline">
          Back to log in
        </Link>
      </p>
    </AuthPageLayout>
  );
}
