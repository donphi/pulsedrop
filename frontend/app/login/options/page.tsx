'use client';

import { Suspense } from 'react';
import { AuthTemplate } from '@/components/auth/AuthTemplate';
import { LoginOptionsForm } from '@/components/auth/LoginOptionsForm';

export default function LoginOptionsPage() {
  return (
    <AuthTemplate
      title="Choose sign in method"
    >
      <Suspense fallback={<div>Loading...</div>}>
        <LoginOptionsForm />
      </Suspense>
    </AuthTemplate>
  );
}