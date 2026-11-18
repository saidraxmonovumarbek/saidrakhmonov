import { BadgeCheck, Pin } from "lucide-react";
import Image from "next/image";
import { XIcon } from "@/components/icons";
import { Section } from "@/components/section";
import type { Highlight } from "@/content/highlights";

function Card({ item, index }: { item: Highlight; index: number }) {
  const body = (
    <figure className="flex h-full w-[19.5rem] shrink-0 flex-col rounded-2xl border border-chip-line bg-chip p-4 transition-colors hover:border-white/25">
      <figcaption className="flex items-start gap-3">
        <span className="relative grid size-10 shrink-0 place-items-center overflow-hidden rounded-full bg-chip text-sm font-semibold text-muted">
          {item.avatar ? (
            <Image src={item.avatar} alt="" fill sizes="40px" className="object-cover" />
          ) : (
            item.name.replace(/^An? /i, "").charAt(0).toUpperCase()
          )}
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-1 text-[15px] leading-tight font-semibold">
            <span className="truncate" data-edit={`highlights.${index}.name`}>
              {item.name}
            </span>
            {item.verified && <BadgeCheck className="size-4 shrink-0 fill-sky-500 text-[#140e24]" />}
          </span>
          <span className="block text-[13px] text-muted" data-edit={`highlights.${index}.handle`}>
            {item.handle}
          </span>
        </span>
        <span className="flex items-center gap-2 text-soft">
          <Pin className="size-3.5 rotate-45 fill-current" />
          <XIcon className="size-3.5" />
        </span>
      </figcaption>
      <blockquote className="mt-3.5 text-[15px] leading-relaxed text-white/80">
        &ldquo;<span data-edit={`highlights.${index}.quote`}>{item.quote}</span>&rdquo;
      </blockquote>
    </figure>
  );
  return item.href ? (
    <a href={item.href} target="_blank" rel="noreferrer" className="block h-full">
      {body}
    </a>
  ) : (
    body
  );
}

/** Auto-scrolling row of kind words. Pauses when you hover it. */
export function Highlights({ highlights, title }: { highlights: Highlight[]; title: string }) {
  if (highlights.length === 0) return null;
  // repeat short lists so the strip is always wider than the page
  const repeat = Math.max(1, Math.ceil(4 / highlights.length));
  const row = Array.from({ length: repeat }, () => highlights.map((item, index) => ({ item, index }))).flat();

  return (
    <Section id="highlights" title={title} edit="copy.home.highlights" flush>
      <div
        className="group overflow-hidden px-5 py-8 sm:px-6"
        style={{
          maskImage: "linear-gradient(to right, transparent 1%, black 9%, black 91%, transparent 99%)",
        }}
      >
        <div
          className="flex w-max animate-marquee gap-5 group-hover:[animation-play-state:paused]"
          style={{ "--marquee-gap": "1.25rem", "--marquee-duration": `${row.length * 9}s` } as React.CSSProperties}
        >
          {row.map(({ item, index }, i) => (
            <Card key={`a-${i}`} item={item} index={index} />
          ))}
          {row.map(({ item, index }, i) => (
            <div key={`b-${i}`} aria-hidden>
              <Card item={item} index={index} />
            </div>
          ))}
        </div>
      </div>
    </Section>
  );
}
