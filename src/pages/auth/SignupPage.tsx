import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Mail, Phone, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/ui/password-input';
import { Label } from '@/components/ui/label';
import { AuthPageLayout } from '@/components/auth/AuthPageLayout';
import { api } from '@/lib/api';
import { validatePassword, PASSWORD_HINT } from '@/lib/passwordValidation';

export default function SignupPage() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'guest' | 'host'>('guest');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [errorConflict, setErrorConflict] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setErrorConflict(false);
    const passwordCheck = validatePassword(password);
    if (!passwordCheck.valid) {
      setError(passwordCheck.errors.join('. '));
      return;
    }
    setLoading(true);
    api
      .post('/api/auth/signup', { name, email, phone, password, role })
      .then(() => navigate('/verify', { state: { email } }))
      .catch((err) => {
        const data = err.response?.data;
        const status = err.response?.status;
        const msg =
          typeof data?.message === 'string'
            ? data.message
            : status === 409
              ? 'This email or mobile number is already registered.'
              : 'Sign up failed. Please try again.';
        setError(msg);
        setErrorConflict(status === 409);
      })
      .finally(() => setLoading(false));
  };

  return (
    <AuthPageLayout
      maxWidthClassName="max-w-lg"
      title="Create an account"
      description="We’ll send a verification code to your email."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="signup-name" className="text-foreground">
            Name
          </Label>
          <div className="relative">
            <User className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="signup-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoComplete="name"
              className="border-0 bg-muted/60 pl-10"
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="signup-email" className="text-foreground">
            Email
          </Label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="signup-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              className="border-0 bg-muted/60 pl-10"
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="signup-phone" className="text-foreground">
            Mobile number <span className="text-destructive">*</span>
          </Label>
          <div className="relative">
            <Phone className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="signup-phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
              placeholder="e.g. +977 98xxxxxx"
              className="border-0 bg-muted/60 pl-10"
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="signup-password" className="text-foreground">
            Password
          </Label>
          <div className="relative">
            <PasswordInput
              id="signup-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              autoComplete="new-password"
              className="border-0 bg-muted/60"
            />
          </div>
          <p className="text-xs text-muted-foreground">{PASSWORD_HINT}</p>
          {password.length > 0 && !validatePassword(password).valid && (
            <ul className="list-inside list-disc text-xs text-destructive">
              {validatePassword(password).errors.map((err) => (
                <li key={err}>{err}</li>
              ))}
            </ul>
          )}
        </div>
        <div>
          <Label className="text-foreground">I want to</Label>
          <div className="mt-2 flex flex-wrap gap-6">
            <label className="flex cursor-pointer items-center gap-2">
              <input
                type="radio"
                name="role"
                checked={role === 'guest'}
                onChange={() => setRole('guest')}
                className="border-border text-primary focus:ring-primary"
              />
              <span className="text-sm">Book homestays (Guest)</span>
            </label>
            <label className="flex cursor-pointer items-center gap-2">
              <input
                type="radio"
                name="role"
                checked={role === 'host'}
                onChange={() => setRole('host')}
                className="border-border text-primary focus:ring-primary"
              />
              <span className="text-sm">List my homestay (Host)</span>
            </label>
          </div>
        </div>
        {error && (
          <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            <p>{error}</p>
            {errorConflict && (
              <p className="mt-2 text-foreground">
                Already have an account?{' '}
                <Link to="/login" className="font-medium text-primary hover:underline">
                  Log in
                </Link>
              </p>
            )}
          </div>
        )}
        <Button type="submit" className="w-full" size="lg" disabled={loading}>
          <UserPlus className="mr-2 h-4 w-4" />
          {loading ? 'Creating account…' : 'Sign up'}
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-muted-foreground">
        Already have an account?{' '}
        <Link to="/login" className="font-medium text-primary hover:underline">
          Log in
        </Link>
      </p>
    </AuthPageLayout>
  );
}
