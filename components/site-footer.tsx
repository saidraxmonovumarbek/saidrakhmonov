import Link from "next/link";
import { ContactIcon } from "@/components/icons";
import { ViewCount } from "@/components/view-count";
import type { Content } from "@/lib/content-defaults";
import { SOUNDTRACK } from "@/lib/sound";

const YEAR = new Date().getFullYear();

export function SiteFooter({ content }: { content: Content }) {
  const { site, nav, copy } = content;
  return (
    <footer data-panel className="card">
      <div className="flex flex-col gap-6 px-5 pt-8 pb-2 sm:flex-row sm:items-start sm:justify-between sm:px-7">
        <div>
          <p className="text-[15px] font-medium" data-edit="site.name">
            {site.name}
          </p>
          <p className="mt-1 flex flex-wrap items-center gap-x-1.5 text-sm text-muted">
            <span>© {YEAR}</span>
            <span aria-hidden>·</span>
            <span data-edit="copy.footer.tagline">{copy.footer.tagline}</span>
          </p>
          <p className="mt-1 text-[13px] text-soft">
            Soundtrack: {SOUNDTRACK.title} by {SOUNDTRACK.artist}
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-1">
            {site.contact
              .filter((c) => c.icon !== "resume")
              .map((c) => (
                <a
                  key={c.label}
                  href={c.href}
                  target={c.href.startsWith("http") ? "_blank" : undefined}
                  rel="noreferrer"
                  aria-label={c.label}
                  className="grid size-9 place-items-center rounded-full text-muted transition-colors hover:bg-white/[0.08] hover:text-fg"
                >
                  <ContactIcon name={c.icon} className="size-[18px]" />
                </a>
              ))}
            <ViewCount className="ml-2 flex h-9 items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3 text-[13px] text-muted tabular-nums" />
          </div>
        </div>
        <ul className="grid grid-cols-2 gap-x-10 gap-y-2 text-[15px]">
          {[...nav.main, ...nav.more].map((item) => (
            <li key={item.href}>
              <Link href={item.href} className="text-muted transition-colors hover:text-fg">
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
      <div
        aria-hidden
        className="pointer-events-none overflow-hidden px-4 select-none"
        style={{ maskImage: "linear-gradient(to bottom, black 10%, transparent 92%)" }}
      >
        <p className="-mb-[0.2em] text-center text-[clamp(4rem,21vw,10.5rem)] leading-none font-medium tracking-[-0.06em] whitespace-nowrap text-white/[0.09]">
          {site.shortName}
        </p>
      </div>
    </footer>
  );
}
