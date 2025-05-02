'use client';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';

export default function BackButton() {
  const router = useRouter();
  return (
    <motion.button
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="fixed left-8 top-8 z-50 flex h-10 w-10 items-center justify-center rounded-full bg-card shadow-button"
      onClick={() => router.back()}
      aria-label="Go back"
    >
      <ArrowLeft className="h-5 w-5 text-foreground hover:text-primary" />
    </motion.button>
  );
}