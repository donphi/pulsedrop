'use client';

import { useState, FormEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react'; // Import signIn from next-auth/react
import { supabase } from '../../lib/supabaseClient'; // Using relative path
import { Button } from '@/components/ui/Button'; // Assuming Button is correctly aliased
import { Input } from '@/components/ui/Input'; // Assuming Input is correctly aliased

export function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState<string | null>(null); // Separate state for email errors
  const router = useRouter();
  const searchParams = useSearchParams(); // Get search params

  // Map NextAuth error codes (passed via URL) to user-friendly messages
  const errorMessages: { [key: string]: string } = {
    Signin: 'Try signing in with a different account.',
    OAuthSignin: 'Try signing in with a different account.',
    OAuthCallback: 'Error processing Strava login. Please try again.',
    OAuthCreateAccount: 'Could not link Strava account. Try a different login method.',
    EmailCreateAccount: 'Could not create account using email.',
    Callback: 'Login callback error. Please try again.',
    OAuthAccountNotLinked: 'This Strava account is not linked. Sign in with the original method or contact support.',
    EmailSignin: 'Check your email address.',
    CredentialsSignin: 'Sign in failed. Check your email and password.',
    SessionRequired: 'Please sign in to access this page.',
    DatabaseError: 'A server error occurred during login. Please try again later.',
    SignInFailed: 'Sign in failed unexpectedly. Please try again.',
    EmailRequired: 'Could not retrieve email from Strava. Ensure your Strava profile has a verified email.',
    Default: 'An unknown login error occurred. Please try again.',
    // Add more specific error mappings based on codes returned in auth.ts
  };

  // Get error code from URL query parameter
  const urlError = searchParams.get('error');
  // Determine the message to display based on URL error or local email error
  const displayError = urlError ? (errorMessages[urlError] ?? errorMessages.Default) : emailError;

  const handleEmailLogin = async (e: FormEvent) => {
    e.preventDefault();
    setEmailError(null); // Clear previous email errors

    // NOTE: This uses Supabase direct auth, not NextAuth credentials provider.
    // This might need refactoring later if full NextAuth integration for email/password is desired.
    const { error: supabaseError } = await supabase.auth.signInWithPassword({ email, password });

    if (supabaseError) {
      setEmailError(supabaseError.message); // Show Supabase specific error for email login
      return;
    }

    router.push('/dashboard');
  };

  const handleStravaLogin = async () => {
    setEmailError(null); // Clear email errors before attempting Strava login
    // Use NextAuth signIn for Strava.
    // Errors are handled by NextAuth redirecting back here with ?error=...
    // The callbackUrl specifies where to go on SUCCESSFUL login.
    await signIn('strava', { callbackUrl: '/dashboard' });
  };

  return (
    <form onSubmit={handleEmailLogin} className="space-y-4">
      {/* Display error message if present (from URL or email login attempt) */}
      {displayError && (
         // Using basic styling as requested, avoiding new classes.
         // Ensure text-error, bg-error-muted etc. are defined in globals.css or Tailwind config.
        <div className="text-error bg-error-muted p-3 rounded-md mb-4">
          {displayError}
        </div>
      )}

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