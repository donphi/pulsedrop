// components/layouts/Footer.tsx
'use client';
import { footerNavigation } from '@/lib/config';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function Footer() {
  const router = useRouter();
  
  // Handle navigation with manual scroll to top for legal pages
  const handleLegalClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (href.startsWith('/legal/')) {
      e.preventDefault();
      router.push(href);
      // Use the same smooth scroll behavior as in useScrollToTop
      setTimeout(() => {
        window.scrollTo({
          top: 0,
          behavior: 'smooth'
        });
      }, 100);
    }
  };
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full py-6 px-4 sm:px-6 lg:px-8 bg-transparent text-foreground">
      <div className="mx-auto max-w-7xl flex flex-col items-center justify-center gap-4 text-sm">
        <nav className="flex gap-6">
          {footerNavigation.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className="hover:text-primary transition-colors duration-200"
              onClick={(e) => handleLegalClick(e, item.href)}
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