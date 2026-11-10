"use client";

import { ArrowUpRight } from "lucide-react";
import { motion, useScroll, useSpring } from "motion/react";
import { useRef } from "react";
import { RichText } from "@/components/rich-text";
import type { Milestone } from "@/content/milestones";

/** Vertical timeline whose line draws itself as you scroll. */
export function MilestoneTimeline({ milestones }: { milestones: Milestone[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 0.65", "end 0.65"] });
  const scaleY = useSpring(scrollYProgress, { stiffness: 120, damping: 28 });

  const years = [...new Set(milestones.map((m) => m.year))].sort((a, b) => b - a);

  return (
    <div ref={ref} className="relative px-5 pt-10 pb-14 sm:px-6">
      <div aria-hidden className="absolute top-10 bottom-14 left-7 w-px -translate-x-1/2 bg-line sm:left-8" />
      <motion.div
        aria-hidden
        style={{ scaleY }}
        className="absolute top-10 bottom-14 left-7 w-px origin-top -translate-x-1/2 bg-fg sm:left-8"
      />

      {years.map((year) => (
        <section key={year} className="relative">
          <motion.h2
            initial={{ opacity: 0, x: -12, filter: "blur(8px)" }}
            whileInView={{ opacity: 1, x: 0, filter: "blur(0px)" }}
            viewport={{ once: true, margin: "0px 0px -20% 0px" }}
            transition={{ duration: 0.6 }}
            className="ml-9 w-fit pt-6 pb-2 font-serif text-5xl leading-none tracking-tight sm:ml-10"
          >
            {year}
          </motion.h2>
          <ol>
            {milestones
              .filter((m) => m.year === year)
              .map((m) => (
                <motion.li
                  key={m.title}
                  initial="hidden"
                  whileInView="show"
                  viewport={{ once: true, margin: "0px 0px -30% 0px" }}
                  className="relative py-5 pl-9 sm:pl-10"
                >
                  <motion.span
                    aria-hidden
                    variants={{
                      hidden: { scale: 0, backgroundColor: "var(--bg)" },
                      show: {
                        scale: 1,
                        backgroundColor: "var(--fg)",
                        transition: { type: "spring", stiffness: 420, damping: 18 },
                      },
                    }}
                    className="absolute top-[1.85rem] left-2 size-2.5 -translate-x-1/2 rounded-full ring-4 ring-bg"
                  />
                  <motion.div
                    variants={{
                      hidden: { opacity: 0, y: 14, filter: "blur(8px)" },
                      show: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.55 } },
                    }}
                  >
                    <p className="flex flex-wrap items-center gap-2 font-mono text-xs text-soft">
                      {m.date}
                      {m.tag && (
                        <span className="rounded border border-chip-line bg-chip px-1.5 py-0.5 text-muted">
                          {m.tag}
                        </span>
                      )}
                    </p>
                    <h3 className="mt-1.5 text-xl font-semibold tracking-tight">
                      {m.href ? (
                        <a
                          href={m.href}
                          target="_blank"
                          rel="noreferrer"
                          className="group inline-flex items-center gap-1 hover:underline"
                        >
                          {m.title}
                          <ArrowUpRight className="size-4 text-soft transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                        </a>
                      ) : (
                        m.title
                      )}
                    </h3>
                    <p className="mt-1.5 max-w-xl leading-relaxed text-muted">
                      <RichText text={m.text} />
                    </p>
                  </motion.div>
                </motion.li>
              ))}
          </ol>
        </section>
      ))}
    </div>
  );
}
