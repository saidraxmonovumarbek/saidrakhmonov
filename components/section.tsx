import type { ReactNode } from "react";
import { SplitText } from "@/components/motion";
import { cn } from "@/lib/utils";

/**
 * A page section in the "blueprint" style: a tinted band, a serif heading
 * with a dashed rule under it, then the content.
 */
export function Section({
  id,
  title,
  aside,
  action,
  children,
  className,
  flush = false,
}: {
  id?: string;
  title: string;
  /** Small note next to the heading. */
  aside?: ReactNode;
  /** Link or controls on the right side of the heading row. */
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  /** Remove the default padding around the content. */
  flush?: boolean;
}) {
  return (
    <section id={id}>
      <div className="band" aria-hidden />
      <div className="rule-b flex flex-wrap items-end justify-between gap-x-4 gap-y-2 px-5 pt-3.5 pb-2.5 sm:px-6">
        <div className="flex items-baseline gap-3">
          <SplitText text={title} className="font-serif text-[2rem] leading-none tracking-[-0.01em]" />
          {aside}
        </div>
        {action}
      </div>
      <div className={cn(!flush && "px-5 py-7 sm:px-6", className)}>{children}</div>
    </section>
  );
}

/** Title block at the top of the inner pages. */
export function PageHeader({
  eyebrow,
  title,
  text,
}: {
  eyebrow: string;
  title: string;
  text: string;
}) {
  return (
    <header className="px-5 pt-14 pb-9 sm:px-6">
      <p className="font-mono text-xs tracking-wider text-soft">( {eyebrow} )</p>
      <SplitText
        as="h1"
        immediate
        text={title}
        className="mt-3 font-serif text-5xl leading-[1.02] tracking-[-0.015em] sm:text-6xl"
      />
      <p className="mt-4 max-w-xl text-[17px] leading-relaxed text-muted">{text}</p>
    </header>
  );
}
