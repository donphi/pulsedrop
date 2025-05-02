// components/layouts/SettingsLayout.tsx
'use client';
import { settingsNavigation, secondaryNavigation } from '@/lib/config';
import Link from 'next/link';

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <aside className="hidden lg:flex w-72 flex-col bg-card shadow-card">
        <nav className="p-4 space-y-2">
          {settingsNavigation.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className="flex items-center gap-3 rounded-md px-2 py-2 text-sm font-medium hover:bg-primary-muted"
            >
              <item.icon className="h-6 w-6" />
              {item.name}
            </Link>
          ))}
        </nav>
      </aside>

      <main className="flex-1 overflow-auto p-6">
        <nav className="flex border-b border-neutral-muted mb-4">
          {secondaryNavigation.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className="px-4 py-2 text-sm font-semibold hover:text-primary"
            >
              {item.name}
            </Link>
          ))}
        </nav>
        <section className="space-y-8">{children}</section>
      </main>
    </div>
  );
}