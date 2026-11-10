"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";

/** Cycles through your roles, letter by letter, through a blur. */
export function RoleRotator({ roles, interval = 3200 }: { roles: readonly string[]; interval?: number }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (roles.length < 2) return;
    const id = setInterval(() => setIndex((i) => (i + 1) % roles.length), interval);
    return () => clearInterval(id);
  }, [roles.length, interval]);

  const role = roles[index];

  return (
    <span className="relative inline-block h-[1.4em]" aria-live="off">
      <span className="sr-only">{roles.join(" ")}</span>
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={role}
          aria-hidden
          className="inline-block whitespace-nowrap"
          initial="hidden"
          animate="show"
          exit="exit"
          transition={{ staggerChildren: 0.025 }}
        >
          {Array.from(role).map((ch, i) => (
            <motion.span
              key={i}
              className="inline-block"
              variants={{
                hidden: { opacity: 0, filter: "blur(8px)", x: 6 },
                show: { opacity: 1, filter: "blur(0px)", x: 0, transition: { duration: 0.35 } },
                exit: { opacity: 0, filter: "blur(8px)", x: -6, transition: { duration: 0.25 } },
              }}
            >
              {ch === " " ? " " : ch}
            </motion.span>
          ))}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}
