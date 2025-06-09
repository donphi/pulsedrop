// app/(legal)/layout.tsx
import { type ReactNode } from 'react';
import BackButton from '@/components/ui/BackButton';

export default function LegalLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-screen">
      {/* Content layer */}
      <div className="relative z-10 flex min-h-screen flex-col">
        {/* Back button */}
        <div className="fixed top-8 left-8 z-50">
          <BackButton />
        </div>

        {/* Main content wrapper - matching ContentLayout structure */}
        <div className="px-6">
          <div className="mx-auto max-w-4xl text-base/7">
            <div className="mx-auto max-w-3xl pt-32">
              {/* This is where the page content will be inserted */}
              {children}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}