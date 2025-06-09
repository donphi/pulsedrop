// components/layouts/Footer.tsx
import { footerNavigation } from '@/lib/config';
import Link from 'next/link';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full py-6 px-4 sm:px-6 lg:px-8 bg-transparent text-foreground">
      <div className="mx-auto max-w-7xl flex flex-col items-center justify-center gap-4 text-sm">
        <nav className="flex gap-6">
          {footerNavigation.map((item) => (
            item.href.startsWith('/legal/') ? (
              // Use regular anchor tags for legal pages to force full page reload
              <a
                key={item.name}
                href={item.href}
                className="hover:text-primary transition-colors duration-200"
              >
                {item.name}
              </a>
            ) : (
              // Use Next.js Link for other pages
              <Link
                key={item.name}
                href={item.href}
                className="hover:text-primary transition-colors duration-200"
                scroll={true}
              >
                {item.name}
              </Link>
            )
          ))}
        </nav>
        <p className="text-mutedText">
          &copy; {currentYear} Pulse Drop. All rights reserved.
        </p>
      </div>
    </footer>
  );
}