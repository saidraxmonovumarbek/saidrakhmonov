"use client";

import { X } from "lucide-react";
import { useEffect, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

export const buttonClass = {
  primary:
    "inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-full bg-[#ff7a1a] px-4 py-2 text-[13.5px] font-semibold text-[#160a05] transition-colors hover:bg-[#ff8f3d] disabled:cursor-default disabled:opacity-50",
  ghost:
    "inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-full border border-white/12 px-4 py-2 text-[13.5px] font-medium text-fg transition-colors hover:bg-white/[0.07] disabled:cursor-default disabled:opacity-50",
  danger:
    "inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-full px-3 py-2 text-[13.5px] font-medium text-red-300 transition-colors hover:bg-red-500/15 disabled:cursor-default disabled:opacity-50",
};

/** Marks editor UI so the page's edit-mode click handler leaves it alone. */
export const EDITOR_UI = "data-editor-ui";

/** A centred panel over a dimmed page. Esc or a click outside closes it. */
export function Dialog({
  title,
  onClose,
  children,
  footer,
  wide,
}: {
  title: ReactNode;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  wide?: boolean;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
    };
  }, [onClose]);

  return createPortal(
    <div
      {...{ [EDITOR_UI]: "" }}
      className="fixed inset-0 z-[90] flex items-end justify-center bg-[#05030a]/70 backdrop-blur-sm sm:items-center sm:p-6"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        role="dialog"
        aria-modal="true"
        className={cn(
          "glass flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-3xl !bg-[#0f0a1c]/95 sm:rounded-3xl",
          wide ? "sm:max-w-3xl" : "sm:max-w-xl",
        )}
      >
        <header className="flex items-center justify-between gap-3 border-b border-white/[0.08] py-3 pr-3 pl-5">
          <h2 className="min-w-0 truncate text-[17px] font-medium tracking-[-0.01em]">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="grid size-9 shrink-0 cursor-pointer place-items-center rounded-full text-muted transition-colors hover:bg-white/[0.08] hover:text-fg"
          >
            <X className="size-5" />
          </button>
        </header>
        <div className="flex-1 overflow-y-auto px-5 py-5">{children}</div>
        {footer && (
          <footer className="flex flex-wrap items-center gap-2 border-t border-white/[0.08] px-5 py-3">{footer}</footer>
        )}
      </div>
    </div>,
    document.body,
  );
}

export function ErrorText({ children }: { children: ReactNode }) {
  if (!children) return null;
  return (
    <p role="alert" className="text-[13px] text-red-300">
      {children}
    </p>
  );
}
