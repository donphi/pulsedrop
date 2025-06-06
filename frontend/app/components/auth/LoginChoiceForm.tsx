'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { Button } from '@/components/ui/Button';
import { StravaButton } from '@/components/ui/StravaButton';

export function LoginChoiceForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [localError, setLocalError] = useState<string | null>(null);

  // Error messages mapping
  const errorMessages: { [key: string]: string } = {
    OAuthCallback: 'Error processing Strava login. Please try again.',
    OAuthAccountNotLinked: 'This Strava account is not linked. Sign in with the original method or contact support.',
    Default: 'An unknown login error occurred. Please try again.',
  };

  // Get error code from URL query parameter
  const urlError = searchParams.get('error');
  const displayError = urlError ? (errorMessages[urlError] ?? errorMessages.Default) : localError;

  const handleStravaLogin = async () => {
    setLocalError(null);
    // Use NextAuth signIn for Strava
    await signIn('strava', { callbackUrl: '/dashboard' });
  };

  const handleOtherOptions = () => {
    // Navigate to the secondary login page with other options
    router.push('/login/options');
  };

  return (
    <div className="space-y-4">
      {/* Display error message if present */}
      {displayError && (
        <div className="text-error bg-error-muted p-3 rounded">
          {displayError}
        </div>
      )}

      {/* Strava button - primary option */}
      <div className="flex justify-center">
        <StravaButton onClick={handleStravaLogin} />
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

      {/* Other options button */}
      <Button
        type="button"
        onClick={handleOtherOptions}
        className="w-full bg-secondary hover:bg-secondary-hover text-background"
      >
        Sign in with other options
      </Button>

      {/* Attribution for Strava API compliance */}
      <p className="text-xs text-center text-mutedText mt-4">
        Powered by Strava
      </p>
    </div>
  );
}