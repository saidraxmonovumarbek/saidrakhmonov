"use client";

import { ChevronDown, Menu, X } from "lucide-react";
import { AnimatePresence, motion, useScroll, useSpring } from "motion/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ThemeToggle } from "@/components/theme-toggle";
import { nav, site } from "@/content/site";
import { cn } from "@/lib/utils";

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
}

export function SiteNav() {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, { stiffness: 140, damping: 26, mass: 0.4 });

  useEffect(() => {
    if (!moreOpen && !menuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMoreOpen(false);
        setMenuOpen(false);
      }
    };
    const onDown = (e: PointerEvent) => {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) setMoreOpen(false);
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("pointerdown", onDown);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("pointerdown", onDown);
    };
  }, [moreOpen, menuOpen]);

  const moreActive = nav.more.some((item) => isActive(pathname, item.href));
  const close = () => {
    setMoreOpen(false);
    setMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 bg-bg/95 backdrop-blur-md">
      <div className="rule-b mx-auto flex h-16 max-w-3xl items-center justify-between border-x border-dashed border-line px-5 sm:px-6">
        <Link
          href="/"
          onClick={close}
          className="font-serif text-[2rem] leading-none tracking-[-0.01em] transition-opacity hover:opacity-70"
        >
          {site.shortName}
        </Link>

        <nav aria-label="Main" className="flex items-center gap-1">
          <ul className="hidden items-center sm:flex">
            {nav.main.map((item) => {
              const active = isActive(pathname, item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "relative block px-3 py-2 text-[15px] transition-colors",
                      active ? "font-semibold text-fg" : "text-muted hover:text-fg",
                    )}
                  >
                    {item.label}
                    {active && (
                      <motion.span
                        layoutId="nav-dot"
                        className="absolute -bottom-0.5 left-1/2 size-1 -translate-x-1/2 rounded-full bg-fg"
                        transition={{ type: "spring", stiffness: 420, damping: 32 }}
                      />
                    )}
                  </Link>
                </li>
              );
            })}
            <li>
              <div
                ref={moreRef}
                className="relative"
                onMouseEnter={() => setMoreOpen(true)}
                onMouseLeave={() => setMoreOpen(false)}
              >
                <button
                  type="button"
                  aria-expanded={moreOpen}
                  aria-haspopup="menu"
                  onClick={() => setMoreOpen((v) => !v)}
                  className={cn(
                    "relative flex cursor-pointer items-center gap-1 px-3 py-2 text-[15px] transition-colors",
                    moreActive ? "font-semibold text-fg" : "text-muted hover:text-fg",
                  )}
                >
                  More
                  <ChevronDown
                    className={cn("size-4 transition-transform duration-300", moreOpen && "rotate-180")}
                  />
                  {moreActive && (
                    <motion.span
                      layoutId="nav-dot"
                      className="absolute -bottom-0.5 left-1/2 size-1 -translate-x-1/2 rounded-full bg-fg"
                      transition={{ type: "spring", stiffness: 420, damping: 32 }}
                    />
                  )}
                </button>
                <AnimatePresence>
                  {moreOpen && (
                    <motion.div
                      role="menu"
                      initial={{ opacity: 0, y: -6, scale: 0.97, filter: "blur(6px)" }}
                      animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
                      exit={{ opacity: 0, y: -6, scale: 0.97, filter: "blur(6px)" }}
                      transition={{ duration: 0.2, ease: [0.21, 0.47, 0.32, 0.98] }}
                      className="absolute top-full right-0 w-56 origin-top-right pt-2"
                    >
                      <div className="rounded-xl border border-chip-line bg-card p-1.5 shadow-xl shadow-black/5 dark:shadow-black/40">
                        {nav.more.map((item) => (
                          <Link
                            key={item.href}
                            href={item.href}
                            role="menuitem"
                            onClick={close}
                            className={cn(
                              "block rounded-lg px-3 py-2 transition-colors hover:bg-chip",
                              isActive(pathname, item.href) && "bg-chip",
                            )}
                          >
                            <span className="block text-[15px] font-medium">{item.label}</span>
                            <span className="block text-[13px] text-muted">{item.note}</span>
                          </Link>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </li>
          </ul>

          <ThemeToggle />

          <button
            type="button"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((v) => !v)}
            className="grid size-9 cursor-pointer place-items-center rounded-full text-muted transition-colors hover:bg-chip hover:text-fg sm:hidden"
          >
            {menuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </nav>

        <motion.div
          aria-hidden
          style={{ scaleX: progress }}
          className="absolute inset-x-0 -bottom-px z-10 h-px origin-left bg-fg"
        />
      </div>

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.21, 0.47, 0.32, 0.98] }}
            className="overflow-hidden bg-bg sm:hidden"
          >
            <ul className="rule-b mx-auto max-w-3xl border-x border-dashed border-line px-3 py-3">
              {[...nav.main, ...nav.more].map((item, i) => (
                <motion.li
                  key={item.href}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.04 * i + 0.08 }}
                >
                  <Link
                    href={item.href}
                    onClick={close}
                    className={cn(
                      "flex items-center justify-between rounded-lg px-3 py-2.5 font-serif text-2xl",
                      isActive(pathname, item.href) ? "text-fg" : "text-muted",
                    )}
                  >
                    {item.label}
                    {isActive(pathname, item.href) && <span className="size-1.5 rounded-full bg-fg" />}
                  </Link>
                </motion.li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
