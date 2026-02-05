import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PasswordInput } from '@/components/ui/password-input';
import { Label } from '@/components/ui/label';
import { api } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/lib/auth';
import { validatePassword, PASSWORD_HINT } from '@/lib/passwordValidation';
import { KeyRound } from 'lucide-react';

export default function ChangePasswordPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { logout } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const newPasswordValidation = validatePassword(newPassword);
  const confirmMismatch = confirmPassword.length > 0 && newPassword !== confirmPassword;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast({ title: 'New passwords do not match.', variant: 'destructive' });
      return;
    }
    if (!newPasswordValidation.valid) {
      toast({ title: newPasswordValidation.errors.join('. '), variant: 'destructive' });
      return;
    }
    setLoading(true);
    api
      .post('/api/auth/change-password', {
        currentPassword,
        newPassword,
      })
      .then(() => {
        toast({ title: 'Password updated. Please sign in with your new password.' });
        logout();
        navigate('/login', { replace: true });
      })
      .catch((err) => {
        toast({ title: err.response?.data?.message || 'Failed to update password.', variant: 'destructive' });
      })
      .finally(() => setLoading(false));
  };

  return (
    <div className="mx-auto max-w-md">
      <h1 className="text-2xl font-semibold text-primary-800">Change password</h1>
      <p className="mt-1 text-sm text-muted-foreground">Update your account password.</p>
      <Card className="mt-6 border-primary-200">
        <CardHeader className="border-b border-primary-100 bg-primary-50/50">
          <h2 className="font-semibold text-primary-800">New password</h2>
          <p className="text-sm text-muted-foreground">Enter your current password and choose a new one.</p>
        </CardHeader>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="current">Current password</Label>
              <PasswordInput
                id="current"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                className="mt-1"
                autoComplete="current-password"
              />
            </div>
            <div>
              <Label htmlFor="new">New password</Label>
              <PasswordInput
                id="new"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={8}
                className="mt-1"
                autoComplete="new-password"
              />
              <p className="mt-1 text-xs text-muted-foreground">{PASSWORD_HINT}</p>
              {newPassword.length > 0 && !newPasswordValidation.valid && (
                <ul className="mt-1 list-inside list-disc text-xs text-destructive">
                  {newPasswordValidation.errors.map((err) => (
                    <li key={err}>{err}</li>
                  ))}
                </ul>
              )}
            </div>
            <div>
              <Label htmlFor="confirm">Confirm new password</Label>
              <PasswordInput
                id="confirm"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={8}
                className="mt-1"
                autoComplete="new-password"
              />
              {confirmMismatch && <p className="mt-1 text-xs text-destructive">Passwords do not match.</p>}
            </div>
            <div className="flex gap-3 pt-2">
              <Button type="submit" disabled={loading}>
                <KeyRound className="w-4 h-4 mr-2" />
                {loading ? 'Updating…' : 'Update password'}
              </Button>
              <Button type="button" variant="outline" asChild>
                <Link to="/">Cancel</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
