'use client';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function BackButton() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  // Define the back arrow animation that moves left and returns twice
  const arrowVariants = {
    initial: { x: 0 },
    hover: {
      x: [0, -8, 0, -4, 0],
      transition: {
        duration: 1.5,
        ease: "easeInOut",
        times: [0, 0.25, 0.5, 0.75, 1]
      }
    }
  };

  return (
    <motion.button
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="group fixed left-8 top-8 z-50 flex h-10 w-10 items-center justify-center rounded-full bg-card shadow-button"
      onClick={() => router.back()}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      aria-label="Go back"
    >
      <motion.div
        variants={arrowVariants}
        initial="initial"
        animate={isHovered ? "hover" : "initial"}
      >
        <ArrowLeft className="h-5 w-5 text-foreground hover:text-primary" />
      </motion.div>
    </motion.button>
  );
}