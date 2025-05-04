'use client';
import { useTheme } from 'next-themes';
import { motion } from 'framer-motion';
import { Sun, Moon, MonitorSmartphone } from 'lucide-react';

export default function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();

  const nextTheme = () => {
    setTheme(theme === 'light' ? 'dark' : theme === 'dark' ? 'system' : 'light');
  };

  return (
    <motion.button
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.3 }}
      onClick={nextTheme}
      className="fixed right-8 top-8 z-50 flex h-10 w-10 items-center justify-center rounded-full bg-card shadow-button"
      aria-label="Toggle theme"
    >
      {theme === 'light' && <Sun className="h-5 w-5 text-foreground hover:text-primary" />}
      {theme === 'dark' && <Moon className="h-5 w-5 text-foreground hover:text-primary" />}
      {theme === 'system' && (
        <MonitorSmartphone className="h-5 w-5 text-foreground hover:text-primary" />
      )}
    </motion.button>
  );
}