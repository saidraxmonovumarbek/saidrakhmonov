import Link from "next/link";
import { ContactIcon } from "@/components/icons";
import { nav, site } from "@/content/site";

const YEAR = new Date().getFullYear();

export function SiteFooter() {
  return (
    <footer>
      <div className="band" aria-hidden />
      <div className="flex flex-col gap-6 px-5 pt-8 pb-2 sm:flex-row sm:items-start sm:justify-between sm:px-6">
        <div>
          <p className="text-[15px] font-medium">{site.name}</p>
          <p className="mt-1 text-sm text-muted">
            © {YEAR} · Designed and built with care.
          </p>
          <div className="mt-4 flex items-center gap-1">
            {site.contact
              .filter((c) => c.icon !== "resume")
              .map((c) => (
                <a
                  key={c.label}
                  href={c.href}
                  target={c.href.startsWith("http") ? "_blank" : undefined}
                  rel="noreferrer"
                  aria-label={c.label}
                  className="grid size-9 place-items-center rounded-lg text-muted transition-colors hover:bg-chip hover:text-fg"
                >
                  <ContactIcon name={c.icon} className="size-[18px]" />
                </a>
              ))}
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
        <p className="-mb-[0.22em] text-center font-serif text-[clamp(5rem,26vw,13.5rem)] leading-none whitespace-nowrap text-fg/15">
          {site.shortName}
        </p>
      </div>
    </footer>
  );
}
