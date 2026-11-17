"use client";

import { motion } from "motion/react";

/**
 * Soft entrance every time you move to another page. Movement only: fading
 * the page would switch off the glass blur of the cards while it runs.
 */
export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ y: 14 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.45, ease: [0.21, 0.47, 0.32, 0.98] }}
    >
      {children}
    </motion.div>
  );
}
