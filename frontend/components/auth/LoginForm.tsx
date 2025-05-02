'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleEmailLogin = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError(error.message);
      return;
    }

    router.push('/dashboard');
  };

  const handleStravaLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'strava',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });

    if (error) {
      setError(error.message);
    }
  };

  return (
    <form onSubmit={handleEmailLogin} className="space-y-4">
      {error && <div className="text-error bg-error-muted p-3 rounded-md">{error}</div>}

      <Input
        id="email"
        type="email"
        required
        placeholder="Email address"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />

      <Input
        id="password"
        type="password"
        required
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      <Button type="submit" className="w-full">
        Sign in
      </Button>

      <div className="flex items-center gap-2">
        <div className="flex-1 border-t border-neutral-muted"></div>
        <span className="text-sm text-neutral">or</span>
        <div className="flex-1 border-t border-neutral-muted"></div>
      </div>

      <Button
        type="button"
        variant="secondary"
        onClick={handleStravaLogin}
        className="w-full bg-primary hover:bg-primary-hover"
      >
        Continue with Strava
      </Button>
    </form>
  );
}