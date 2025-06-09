// components/layouts/Footer.tsx
'use client';
import { footerNavigation } from '@/lib/config';
import Link from 'next/link';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  // Simple handler to scroll to top when clicking legal links
  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    // Only for legal links
    if ((e.currentTarget.getAttribute('href') || '').startsWith('/legal/')) {
      // Scroll to top with smooth behavior
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    }
  };

  return (
    <footer className="w-full py-6 px-4 sm:px-6 lg:px-8 bg-transparent text-foreground">
      <div className="mx-auto max-w-7xl flex flex-col items-center justify-center gap-4 text-sm">
        <nav className="flex gap-6">
          {footerNavigation.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className="hover:text-primary transition-colors duration-200"
              onClick={handleClick}
            >
              {item.name}
            </Link>
          ))}
        </nav>
        <p className="text-mutedText">
          &copy; {currentYear} Pulse Drop. All rights reserved.
        </p>
      </div>
    </footer>
  );
}