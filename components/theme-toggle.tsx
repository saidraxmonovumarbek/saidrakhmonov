"use client";

import { Moon, Sun } from "lucide-react";
import { useLayoutEffect } from "react";

/** Runs before the page paints so the saved theme never flashes. */
export const themeScript = `(function(){try{var t=localStorage.getItem("theme");if(t!=="light"&&t!=="dark"){t=matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"}document.documentElement.setAttribute("data-theme",t)}catch(e){}})()`;

function currentTheme(): "light" | "dark" {
  return document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light";
}

export function ThemeToggle() {
  // React resets <html> attributes on the dev-mode remount; put the theme back.
  useLayoutEffect(() => {
    try {
      const saved = localStorage.getItem("theme");
      if (saved === "light" || saved === "dark")
        document.documentElement.setAttribute("data-theme", saved);
      else if (matchMedia("(prefers-color-scheme: dark)").matches)
        document.documentElement.setAttribute("data-theme", "dark");
    } catch {}
  }, []);

  function toggle(e: React.MouseEvent<HTMLButtonElement>) {
    const root = document.documentElement;
    const next = currentTheme() === "dark" ? "light" : "dark";
    const apply = () => {
      root.setAttribute("data-theme", next);
      try {
        localStorage.setItem("theme", next);
      } catch {}
    };

    const rect = e.currentTarget.getBoundingClientRect();
    root.style.setProperty("--reveal-x", `${rect.left + rect.width / 2}px`);
    root.style.setProperty("--reveal-y", `${rect.top + rect.height / 2}px`);

    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!reduced && "startViewTransition" in document) {
      document.startViewTransition(apply);
    } else {
      apply();
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Switch between light and dark theme"
      className="group relative grid size-9 cursor-pointer place-items-center rounded-full text-muted transition-colors hover:bg-chip hover:text-fg"
    >
      <Sun className="hidden size-[19px] transition-transform duration-500 group-hover:rotate-90 dark:block" />
      <Moon className="size-[19px] transition-transform duration-500 group-hover:-rotate-12 dark:hidden" />
    </button>
  );
}
