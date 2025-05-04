// components/layouts/DashboardLayout.tsx
'use client';
import { dashboardNavigation } from '@/lib/config';
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';
import { ReactNode, useState } from 'react';

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      {/* Mobile Sidebar */}
      <div className={`fixed inset-0 z-40 lg:hidden transition-transform ${sidebarOpen ? '' : '-translate-x-full'}`}>
        <div className="absolute inset-0 bg-overlay" onClick={() => setSidebarOpen(false)} />
        <div className="relative flex w-72 flex-col bg-card shadow-card">
          <button className="p-4" onClick={() => setSidebarOpen(false)}>
            <XMarkIcon className="h-6 w-6 text-foreground" />
          </button>
          <nav className="px-4 space-y-2">
            {dashboardNavigation.map((item) => (
              <a
                key={item.name}
                href={item.href}
                className="flex items-center gap-3 rounded-md px-2 py-2 text-sm font-medium hover:bg-primary-muted"
              >
                <item.icon className="h-6 w-6" />
                {item.name}
              </a>
            ))}
          </nav>
        </div>
      </div>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:w-72 flex-col bg-card shadow-card">
        <nav className="p-4 space-y-2">
          {dashboardNavigation.map((item) => (
            <a
              key={item.name}
              href={item.href}
              className="flex items-center gap-3 rounded-md px-2 py-2 text-sm font-medium hover:bg-primary-muted"
            >
              <item.icon className="h-6 w-6" />
              {item.name}
            </a>
          ))}
        </nav>
      </aside>

      {/* Main content */}
      <div className="flex flex-1 flex-col">
        <header className="sticky top-0 flex items-center bg-card shadow-button p-4 lg:hidden">
          <button onClick={() => setSidebarOpen(true)}>
            <Bars3Icon className="h-6 w-6" />
          </button>
          <span className="ml-4 font-semibold">Dashboard</span>
        </header>
        <main className="flex-1 overflow-auto p-6">{children}</main>
      </div>
    </div>
  );
}