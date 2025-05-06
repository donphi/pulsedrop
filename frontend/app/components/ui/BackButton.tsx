'use client';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function BackButton() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <motion.button
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      whileHover={{
        scale: 1.1,
        x: -3,
        transition: { type: "spring", stiffness: 400, damping: 10 }
      }}
      whileTap={{
        scale: 0.9,
        x: -5,
        transition: { type: "spring", stiffness: 400, damping: 17 }
      }}
      transition={{ duration: 0.3 }}
      className="fixed left-8 top-8 z-50 flex h-10 w-10 items-center justify-center rounded-full bg-card shadow-button"
      onClick={() => router.back()}
      aria-label="Go back"
    >
      <motion.div
        whileHover={{ x: -2 }}
        whileTap={{ x: -4 }}
      >
        <ArrowLeft className="h-5 w-5 text-foreground hover:text-primary" />
      </motion.div>
    </motion.button>
  );
}