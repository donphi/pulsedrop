// app/layout.tsx
import { ReactNode } from 'react';
import ThemeProvider from '@/providers/ThemeProvider';
import Footer from '@/components/layouts/Footer';
import ThemeSwitcher from '@/components/ui/ThemeSwitcher';
import '@/styles/globals.css';

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="bg-background text-foreground transition-colors duration-300">
        <ThemeProvider attribute="class" defaultTheme="system" disableTransitionOnChange={true}>
          <ThemeSwitcher />
          <div className="flex min-h-screen flex-col">
            <main className="flex-1">{children}</main>
            <Footer />
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}