import type { ReactNode } from "react";
import { SplitText } from "@/components/motion";
import { cn } from "@/lib/utils";

/**
 * A page section: a pane of dark glass floating over the live scene, with a
 * heading row and the content below it.
 */
export function Section({
  id,
  title,
  aside,
  action,
  children,
  className,
  flush = false,
  strong = false,
  edit,
}: {
  id?: string;
  title: string;
  /** Content address of the title, for the on-page editor. */
  edit?: string;
  /** Small note next to the heading. */
  aside?: ReactNode;
  /** Link or controls on the right side of the heading row. */
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  /** Remove the default padding around the content. */
  flush?: boolean;
  /** Denser glass, for long text. */
  strong?: boolean;
}) {
  return (
    <section id={id} data-panel className={cn("card", strong && "card-strong")}>
      <div className="rule-b flex flex-wrap items-end justify-between gap-x-4 gap-y-2 px-5 pt-5 pb-4 sm:px-7 sm:pt-6">
        <div className="flex items-center gap-3">
          <span aria-hidden className="bg-lava size-1.5 shrink-0 rounded-full shadow-[0_0_12px_#ff7a1a]" />
          <SplitText text={title} edit={edit} className="text-[1.6rem] leading-none font-medium tracking-[-0.03em]" />
          {aside}
        </div>
        {action}
      </div>
      <div className={cn(!flush && "px-5 py-7 sm:px-7", className)}>{children}</div>
    </section>
  );
}

/** Title block at the top of the inner pages. */
export function PageHeader({
  eyebrow,
  title,
  text,
  edit,
}: {
  eyebrow: string;
  title: string;
  text: string;
  /** Content address of the title and text, e.g. "copy.pages.projects". */
  edit?: string;
}) {
  return (
    <header data-panel className="card mt-6 px-5 pt-12 pb-10 sm:px-7 sm:pt-16">
      <p className="font-mono text-xs tracking-[0.18em] text-lilac uppercase">{eyebrow}</p>
      <SplitText
        as="h1"
        immediate
        text={title}
        edit={edit && `${edit}.title`}
        className="mt-4 text-5xl leading-[0.98] font-medium tracking-[-0.045em] sm:text-7xl"
      />
      <p data-edit={edit && `${edit}.text`} className="mt-5 max-w-xl text-[17px] leading-relaxed text-muted">
        {text}
      </p>
    </header>
  );
}
