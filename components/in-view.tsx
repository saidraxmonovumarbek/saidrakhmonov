"use client";

import { useInView } from "motion/react";
import { useRef, type ReactNode } from "react";

/** Sets data-inview="true" once the element scrolls into view (for CSS animations). */
export function InView({ children, className }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "0px 0px -15% 0px" });
  return (
    <div ref={ref} className={className} data-inview={inView}>
      {children}
    </div>
  );
}
