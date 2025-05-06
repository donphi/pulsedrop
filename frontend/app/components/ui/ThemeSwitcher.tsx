'use client';
import { useTheme } from 'next-themes';
import { motion } from 'framer-motion';
import { Sun, Moon, MonitorSmartphone } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  const nextTheme = () => {
    setTheme(theme === 'light' ? 'dark' : theme === 'dark' ? 'system' : 'light');
  };

  return (
    <motion.button
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      transition={{ duration: 0.3 }}
      onClick={nextTheme}
      className="fixed right-8 top-8 z-50 flex h-10 w-10 items-center justify-center rounded-full bg-card shadow-button"
      aria-label="Toggle theme"
    >
      <motion.div
        key={theme}
        initial={{ rotate: -180, opacity: 0 }}
        animate={{ rotate: 0, opacity: 1 }}
        exit={{ rotate: 180, opacity: 0 }}
        transition={{ duration: 0.5 }}
      >
        {theme === 'light' && <Sun className="h-5 w-5 text-foreground hover:text-primary" />}
        {theme === 'dark' && <Moon className="h-5 w-5 text-foreground hover:text-primary" />}
        {theme === 'system' && (
          <MonitorSmartphone className="h-5 w-5 text-foreground hover:text-primary" />
        )}
      </motion.div>
    </motion.button>
  );
}