"use client";

import { motion, type Variants } from "motion/react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

const EASE = [0.21, 0.47, 0.32, 0.98] as const;
const VIEWPORT = { once: true, margin: "0px 0px -10% 0px" } as const;

/** Fades + un-blurs its children the first time they scroll into view. */
export function Reveal({
  children,
  className,
  delay = 0,
  y = 18,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  y?: number;
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y, filter: "blur(8px)" }}
      whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      viewport={VIEWPORT}
      transition={{ duration: 0.7, ease: EASE, delay }}
    >
      {children}
    </motion.div>
  );
}

const staggerParent: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
};

const staggerChild: Variants = {
  hidden: { opacity: 0, y: 16, filter: "blur(6px)" },
  show: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.6, ease: EASE },
  },
};

/** Parent for a list whose items appear one after another. */
export function Stagger({
  children,
  className,
  as = "div",
}: {
  children: ReactNode;
  className?: string;
  as?: "div" | "ul" | "ol";
}) {
  const Tag = motion[as];
  return (
    <Tag
      className={className}
      variants={staggerParent}
      initial="hidden"
      whileInView="show"
      viewport={VIEWPORT}
    >
      {children}
    </Tag>
  );
}

export function StaggerItem({
  children,
  className,
  as = "div",
}: {
  children: ReactNode;
  className?: string;
  as?: "div" | "li";
}) {
  const Tag = motion[as];
  return (
    <Tag className={className} variants={staggerChild}>
      {children}
    </Tag>
  );
}

/** Heading whose letters slide up out of a blur, one by one. */
export function SplitText({
  text,
  className,
  as = "h2",
  immediate = false,
}: {
  text: string;
  className?: string;
  as?: "h1" | "h2" | "span";
  /** Animate on mount instead of waiting for scroll. */
  immediate?: boolean;
}) {
  const Tag = motion[as];
  const words = text.split(" ");
  let n = 0;
  return (
    <Tag
      className={cn("inline-block", className)}
      aria-label={text}
      initial="hidden"
      {...(immediate
        ? { animate: "show" }
        : { whileInView: "show", viewport: VIEWPORT })}
      transition={{ staggerChildren: 0.028 }}
    >
      {words.map((word, w) => (
        <span key={w} aria-hidden className="inline-block whitespace-nowrap">
          {Array.from(word).map((ch) => (
            <motion.span
              key={n++}
              className="inline-block"
              variants={{
                hidden: { opacity: 0, y: "0.35em", filter: "blur(6px)" },
                show: {
                  opacity: 1,
                  y: 0,
                  filter: "blur(0px)",
                  transition: { duration: 0.5, ease: EASE },
                },
              }}
            >
              {ch}
            </motion.span>
          ))}
          {w < words.length - 1 ? " " : null}
        </span>
      ))}
    </Tag>
  );
}
