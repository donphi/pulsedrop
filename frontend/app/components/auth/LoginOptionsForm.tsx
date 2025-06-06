'use client';

import { useState, FormEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { TextInput } from '@/components/ui/TextInput';

export function LoginOptionsForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);
  const [showEmailForm, setShowEmailForm] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  // Error messages mapping
  const errorMessages: { [key: string]: string } = {
    Signin: 'Try signing in with a different account.',
    OAuthSignin: 'Try signing in with a different account.',
    OAuthCallback: 'Error processing login. Please try again.',
    OAuthCreateAccount: 'Could not link account. Try a different login method.',
    EmailCreateAccount: 'Could not create account using email.',
    Callback: 'Login callback error. Please try again.',
    OAuthAccountNotLinked: 'This account is not linked. Sign in with the original method or contact support.',
    EmailSignin: 'Check your email address.',
    CredentialsSignin: 'Sign in failed. Check your email and password.',
    SessionRequired: 'Please sign in to access this page.',
    DatabaseError: 'A server error occurred during login. Please try again later.',
    SignInFailed: 'Sign in failed unexpectedly. Please try again.',
    EmailRequired: 'Could not retrieve email. Ensure your profile has a verified email.',
    Default: 'An unknown login error occurred. Please try again.',
  };

  const urlError = searchParams.get('error');
  const displayError = urlError ? (errorMessages[urlError] ?? errorMessages.Default) : localError;

  const handleEmailLogin = async (e: FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    const result = await signIn('credentials', {
      redirect: false,
      email: email,
      password: password,
    });

    if (result?.error) {
      const errorMessage = errorMessages[result.error] ?? errorMessages.CredentialsSignin;
      setLocalError(errorMessage);
    } else if (result?.ok && !result.error) {
      router.push('/dashboard');
      router.refresh();
    } else {
      setLocalError(errorMessages.Default);
    }
  };

  const handleGoogleLogin = async () => {
    setLocalError(null);
    await signIn('google', { callbackUrl: '/dashboard' });
  };

  const handleMicrosoftLogin = async () => {
    setLocalError(null);
    await signIn('microsoft', { callbackUrl: '/dashboard' });
  };

  if (showEmailForm) {
    return (
      <form onSubmit={handleEmailLogin} className="space-y-4">
        {displayError && (
          <div className="text-error bg-error-muted p-3 rounded">
            {displayError}
          </div>
        )}

        <TextInput
          id="email"
          type="email"
          required
          label="Email address"
          value={email}
          onChange={(id, value) => setEmail(value)}
        />

        <TextInput
          id="password"
          type="password"
          required
          label="Password"
          value={password}
          onChange={(id, value) => setPassword(value)}
        />

        <Button type="submit" className="w-full">
          Sign in
        </Button>

        <button
          type="button"
          onClick={() => setShowEmailForm(false)}
          className="w-full flex items-center justify-center rounded-md bg-card px-3.5 py-2.5 text-sm font-semibold text-foreground ring-1 ring-inset ring-neutral-muted hover:bg-neutral-muted shadow-button hover:opacity-90 transition-all"
        >
          Back to options
        </button>

        <p className="mt-6 text-center text-sm text-mutedText">
          Not a member?{' '}
          <Link href="/register" className="font-semibold text-primary hover:text-primary-hover transition-colors">
            Register now
          </Link>
        </p>
      </form>
    );
  }

  return (
    <div className="space-y-4">
      {displayError && (
        <div className="text-error bg-error-muted p-3 rounded">
          {displayError}
        </div>
      )}

      {/* Google and Microsoft side by side */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Google sign in */}
        <button
          type="button"
          onClick={handleGoogleLogin}
          className="bg-card text-foreground ring-1 ring-inset ring-neutral-muted hover:bg-neutral-muted flex items-center justify-center gap-3 px-3.5 py-2.5 rounded-md text-sm font-semibold shadow-button hover:opacity-90 transition-all"
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
            <path
              d="M12.0003 4.75C13.7703 4.75 15.3553 5.36002 16.6053 6.54998L20.0303 3.125C17.9502 1.19 15.2353 0 12.0003 0C7.31028 0 3.25527 2.69 1.28027 6.60998L5.27028 9.70498C6.21525 6.86002 8.87028 4.75 12.0003 4.75Z"
              fill="#EA4335"
            />
            <path
              d="M23.49 12.275C23.49 11.49 23.415 10.73 23.3 10H12V14.51H18.47C18.18 15.99 17.34 17.25 16.08 18.1L19.945 21.1C22.2 19.01 23.49 15.92 23.49 12.275Z"
              fill="#4285F4"
            />
            <path
              d="M5.26498 14.2949C5.02498 13.5699 4.88501 12.7999 4.88501 11.9999C4.88501 11.1999 5.01998 10.4299 5.26498 9.7049L1.275 6.60986C0.46 8.22986 0 10.0599 0 11.9999C0 13.9399 0.46 15.7699 1.28 17.3899L5.26498 14.2949Z"
              fill="#FBBC05"
            />
            <path
              d="M12.0004 24.0001C15.2404 24.0001 17.9654 22.935 19.9454 21.095L16.0804 18.095C15.0054 18.82 13.6204 19.245 12.0004 19.245C8.8704 19.245 6.21537 17.135 5.2654 14.29L1.27539 17.385C3.25539 21.31 7.3104 24.0001 12.0004 24.0001Z"
              fill="#34A853"
            />
          </svg>
          <span>Google</span>
        </button>

        {/* Microsoft sign in */}
        <button
          type="button"
          onClick={handleMicrosoftLogin}
          className="bg-card text-foreground ring-1 ring-inset ring-neutral-muted hover:bg-neutral-muted flex items-center justify-center gap-3 px-3.5 py-2.5 rounded-md text-sm font-semibold shadow-button hover:opacity-90 transition-all"
        >
          <svg className="w-5 h-5" viewBox="0 0 23 23">
            <path fill="#f3f3f3" d="M0 0h11v11H0z"/>
            <path fill="#f35325" d="M0 12h11v11H0z"/>
            <path fill="#05a6f0" d="M12 0h11v11H12z"/>
            <path fill="#ffba08" d="M12 12h11v11H12z"/>
          </svg>
          <span>Microsoft</span>
        </button>
      </div>

      {/* Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-neutral-muted"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-background text-mutedText">or</span>
        </div>
      </div>

      {/* Email sign in */}
      <Button
        type="button"
        onClick={() => setShowEmailForm(true)}
        className="w-full bg-secondary hover:bg-secondary-hover"
      >
        Continue with email
      </Button>

      <p className="text-center text-sm mt-4">
        <button
          onClick={() => router.push('/login')}
          className="font-semibold text-primary hover:text-primary-hover transition-colors"
        >
          Back to Strava login
        </button>
      </p>
    </div>
  );
}