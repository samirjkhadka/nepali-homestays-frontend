import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/ui/password-input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { api } from '@/lib/api';
import { assets } from '@/lib/design-tokens';
import { validatePassword, PASSWORD_HINT } from '@/lib/passwordValidation';
import { UserPlus } from 'lucide-react';

export default function SignupPage() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'guest' | 'host'>('guest');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const passwordCheck = validatePassword(password);
    if (!passwordCheck.valid) {
      setError(passwordCheck.errors.join('. '));
      return;
    }
    setLoading(true);
    api
      .post('/api/auth/signup', { name, email, phone, password, role })
      .then(() => navigate('/verify', { state: { email } }))
      .catch((err) => setError(err.response?.data?.message || 'Sign up failed.'))
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
          <h1 className="text-2xl font-bold text-primary-800">Sign up</h1>
          <p className="text-sm text-muted-foreground">
            We&apos;ll send a verification code to your email.
          </p>
        </CardHeader>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="signup-name" className="text-primary-800">
                Name
              </Label>
              <Input
                id="signup-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                autoComplete="name"
                className="mt-1 border-primary-200"
              />
            </div>
            <div>
              <Label htmlFor="signup-email" className="text-primary-800">
                Email
              </Label>
              <Input
                id="signup-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="mt-1 border-primary-200"
              />
            </div>
            <div>
              <Label htmlFor="signup-phone" className="text-primary-800">
                Mobile number <span className="text-destructive">*</span>
              </Label>
              <Input
                id="signup-phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                placeholder="e.g. +977 98xxxxxx"
                className="mt-1 border-primary-200"
              />
            </div>
            <div>
              <Label htmlFor="signup-password" className="text-primary-800">
                Password
              </Label>
              <PasswordInput
                id="signup-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                autoComplete="new-password"
                className="mt-1 border-primary-200"
              />
              <p className="mt-1 text-xs text-muted-foreground">{PASSWORD_HINT}</p>
            </div>
            <div>
              <Label className="text-primary-800">I want to</Label>
              <div className="mt-2 flex flex-wrap gap-6">
                <label className="flex cursor-pointer items-center gap-2">
                  <input
                    type="radio"
                    name="role"
                    checked={role === 'guest'}
                    onChange={() => setRole('guest')}
                    className="border-primary-400 text-accent-500 focus:ring-accent-500"
                  />
                  <span className="text-sm">Book homestays (Guest)</span>
                </label>
                <label className="flex cursor-pointer items-center gap-2">
                  <input
                    type="radio"
                    name="role"
                    checked={role === 'host'}
                    onChange={() => setRole('host')}
                    className="border-primary-400 text-accent-500 focus:ring-accent-500"
                  />
                  <span className="text-sm">List my homestay (Host)</span>
                </label>
              </div>
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
              <UserPlus className="w-4 h-4 mr-2" />
              {loading ? 'Creating account…' : 'Sign up'}
            </Button>
          </form>
          <p className="mt-6 text-center text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link to="/login" className="font-medium text-accent-600 hover:text-accent-700 hover:underline">
              Log in
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
