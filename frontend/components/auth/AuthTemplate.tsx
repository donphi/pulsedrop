import { ReactNode } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import BackButton from '../ui/BackButton';

interface AuthTemplateProps {
  children: ReactNode;
  title?: string;
  footerText?: string;
  footerLinkText?: string;
  footerLinkHref?: string;
}

export function AuthTemplate({
  children,
  title,
  footerText,
  footerLinkText,
  footerLinkHref,
}: AuthTemplateProps) {
  return (
    <div className="relative isolate flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <BackButton />
      <Image src="/images/logo.svg" width={48} height={48} alt="Logo" className="mx-auto mb-6" />
      {title && <h2 className="text-center text-2xl font-bold">{title}</h2>}
      <div className="mt-8 w-full max-w-md">{children}</div>
      {footerText && footerLinkText && (
        <p className="mt-8 text-center text-sm">
          {footerText}{' '}
          <Link href={footerLinkHref || '/'} className="text-primary hover:text-primary-hover">
            {footerLinkText}
          </Link>
        </p>
      )}
    </div>
  );
}