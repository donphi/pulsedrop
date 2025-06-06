'use client'

import { Suspense } from 'react';
import { AuthTemplate } from '@/components/auth/AuthTemplate';
import { LoginChoiceForm } from '@/components/auth/LoginChoiceForm';

export default function LoginPage() {
  return (
    <AuthTemplate
      title="Sign in to your account"
    >
      <Suspense fallback={<div>Loading...</div>}>
        <LoginChoiceForm />
      </Suspense>
    </AuthTemplate>
  );
}