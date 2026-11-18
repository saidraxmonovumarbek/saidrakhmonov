"use client";

import { AnimatePresence, LayoutGroup, motion } from "motion/react";
import { useState } from "react";
import { techIcon } from "@/components/tech-icon";
import { techCategories, type Tech } from "@/content/tech";
import { cn } from "@/lib/utils";

const FILTERS = ["All", ...techCategories] as const;
type Filter = (typeof FILTERS)[number];

export function TechFilters({ value, onChange }: { value: Filter; onChange: (f: Filter) => void }) {
  return (
    <div role="tablist" aria-label="Filter tech stack" className="flex flex-wrap items-center gap-0.5">
      {FILTERS.map((filter) => (
        <button
          key={filter}
          type="button"
          role="tab"
          aria-selected={value === filter}
          onClick={() => onChange(filter)}
          className={cn(
            "relative cursor-pointer rounded-full px-3 py-1.5 text-sm font-medium transition-colors",
            value === filter ? "text-fg" : "text-muted hover:text-fg",
          )}
        >
          {value === filter && (
            <motion.span
              layoutId="tech-filter"
              className="absolute inset-0 rounded-full border border-white/15 bg-white/[0.09]"
              transition={{ type: "spring", stiffness: 420, damping: 34 }}
            />
          )}
          <span className="relative">{filter}</span>
        </button>
      ))}
    </div>
  );
}

export function TechStack({ tech, title, note }: { tech: Tech[]; title: string; note: string }) {
  const [filter, setFilter] = useState<Filter>("All");
  const items = tech.filter((t) => filter === "All" || t.category === filter);

  return (
    <section id="tech" data-panel className="card">
      <div className="rule-b flex flex-wrap items-end justify-between gap-x-4 gap-y-3 px-5 pt-5 pb-4 sm:px-7 sm:pt-6">
        <div className="flex items-center gap-3">
          <span aria-hidden className="bg-lava size-1.5 shrink-0 rounded-full shadow-[0_0_12px_#ff7a1a]" />
          <h2 data-edit="copy.home.tech" className="text-[1.6rem] leading-none font-medium tracking-[-0.03em]">
            {title}
          </h2>
          <span data-edit="copy.home.techNote" className="hidden font-mono text-[11px] tracking-wide text-soft sm:inline">
            {note}
          </span>
        </div>
        <TechFilters value={filter} onChange={setFilter} />
      </div>

      <LayoutGroup>
        <motion.ul layout className="flex min-h-40 flex-wrap content-start gap-2.5 px-5 py-6 sm:px-7">
          <AnimatePresence mode="popLayout" initial={false}>
            {items.map((item) => {
              const icon = techIcon(item.icon);
              return (
                <motion.li
                  key={item.name}
                  layout
                  initial={{ opacity: 0, scale: 0.8, filter: "blur(6px)" }}
                  animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                  exit={{ opacity: 0, scale: 0.8, filter: "blur(6px)" }}
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                >
                  <motion.span
                    initial="rest"
                    whileHover="play"
                    whileTap="play"
                    className="group flex cursor-default items-center gap-2 rounded-full border border-chip-line bg-chip px-3.5 py-1.5 text-[15px] text-white/80 transition-colors hover:border-white/25 hover:text-fg"
                    style={{ "--brand": icon?.color ?? "var(--fg)" } as React.CSSProperties}
                  >
                    {icon && (
                      <motion.svg
                        viewBox="0 0 24 24"
                        aria-hidden
                        className="size-4 shrink-0 fill-lilac transition-[fill] duration-300 group-hover:fill-(--brand)"
                        variants={{
                          rest: { rotate: 0, scale: 1 },
                          play: {
                            rotate: [0, -18, 14, -8, 0],
                            scale: [1, 1.28, 1.2, 1.24, 1.18],
                            transition: { duration: 0.6, ease: "easeInOut" },
                          },
                        }}
                      >
                        <path d={icon.path} />
                      </motion.svg>
                    )}
                    <span data-edit={`tech.name=${item.name}.name`}>{item.name}</span>
                  </motion.span>
                </motion.li>
              );
            })}
          </AnimatePresence>
        </motion.ul>
      </LayoutGroup>
    </section>
  );
}
