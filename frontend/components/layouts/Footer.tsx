// components/layouts/Footer.tsx
import { footerNavigation } from '@/lib/config';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full py-6 px-4 sm:px-6 lg:px-8 bg-transparent text-foreground">
      <div className="mx-auto max-w-7xl flex flex-col items-center justify-center gap-4 text-sm">
        <nav className="flex gap-6">
          {footerNavigation.map((item) => (
            <a
              key={item.name}
              href={item.href}
              className="hover:text-primary transition-colors duration-200"
            >
              {item.name}
            </a>
          ))}
        </nav>
        <p className="text-mutedText">
          &copy; {currentYear} Your Company, Inc. All rights reserved.
        </p>
      </div>
    </footer>
  );
}