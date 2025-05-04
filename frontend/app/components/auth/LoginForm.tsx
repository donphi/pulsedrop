'use client';

import { useState, FormEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react'; // Import signIn from next-auth/react
import { Button } from '@/components/ui/Button'; // Assuming Button is correctly aliased
import { TextInput } from '@/components/ui/TextInput'; // Assuming Input is correctly aliased

export function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState<string | null>(null); // State for errors from this form's actions
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
  // Determine the message to display based on URL error or local form error
  const displayError = urlError ? (errorMessages[urlError] ?? errorMessages.Default) : localError;

  const handleEmailLogin = async (e: FormEvent) => {
    e.preventDefault();
    setLocalError(null); // Clear previous local errors

    // Use NextAuth signIn with 'credentials' provider
    const result = await signIn('credentials', {
      redirect: false, // Prevent NextAuth from redirecting automatically, handle manually
      email: email,
      password: password,
    });

    if (result?.error) {
      // If NextAuth returns an error, map it or show a generic message
      // The error code comes from the authorize function returning null or throwing an error
      // Or from NextAuth internal errors
      const errorMessage = errorMessages[result.error] ?? errorMessages.CredentialsSignin; // Default to CredentialsSignin
      setLocalError(errorMessage);
    } else if (result?.ok && !result.error) {
      // Login successful, redirect to dashboard
      // The redirect might also be handled by a callbackUrl if preferred
      router.push('/dashboard');
      router.refresh(); // Refresh server components after login
    } else {
        // Handle unexpected cases
        setLocalError(errorMessages.Default);
    }
  };

  const handleStravaLogin = async () => {
    setLocalError(null); // Clear local errors before attempting Strava login
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

      <TextInput
        id="email"
        type="email"
        required
        label="Email address" // Use label instead of placeholder
        value={email}
        onChange={(id, value) => setEmail(value)} // Update onChange signature
      />

      <TextInput
        id="password"
        type="password"
        required
        label="Password" // Use label instead of placeholder
        value={password}
        onChange={(id, value) => setPassword(value)} // Update onChange signature
      />

      <Button type="submit" className="w-full">
        Sign in
      </Button>

      <div className="flex items-center gap-2">
        <div className="flex-1 border-t border-primary-muted"></div>
        <span className="text-sm text-mutedText">or</span>
        <div className="flex-1 border-t border-primary-muted"></div>
      </div>

      <Button
        type="button"
        // variant="secondary" // Remove invalid variant prop
        onClick={handleStravaLogin}
        className="w-full bg-secondary" // Use bg-secondary and remove conflicting primary styles
      >
        Continue with Strava
      </Button>
    </form>
  );
}