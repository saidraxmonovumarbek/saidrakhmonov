import { ArrowDown, ArrowUpRight, Hand, MapPin, MousePointerClick } from "lucide-react";
import { LocalTime } from "@/components/local-time";
import { Reveal, SplitText } from "@/components/motion";
import type { Content } from "@/lib/content-defaults";

/**
 * First screen of the home page. It is transparent: the live scene behind the
 * site (components/scene-background.tsx) shows through, with the intro laid
 * over it, and a small hint at the bottom says how to play with the scene.
 */
export function Hero({ site, copy }: { site: Content["site"]; copy: Content["copy"]["hero"] }) {
  return (
    <section
      data-hero
      aria-label="Introduction"
      className="hero relative flex h-[calc(100svh-4.25rem)] min-h-[32rem] flex-col justify-end px-2 pb-24 select-none sm:px-3 sm:pb-28"
    >
      {/* full-bleed scrim so the text reads over any frame of the scene */}
      <div
        aria-hidden
        className="pointer-events-none absolute bottom-0 left-1/2 h-[60%] w-screen -translate-x-1/2 bg-gradient-to-t from-[#06030c]/90 via-[#06030c]/45 to-transparent"
      />

      <div className="relative">
        <SplitText
          as="h1"
          immediate
          text={site.name}
          edit="site.name"
          className="max-w-[11ch] text-[3.4rem] leading-[0.92] font-medium tracking-[-0.055em] [text-shadow:0_2px_40px_rgb(0_0_0/0.4)] sm:text-[6rem]"
        />

        <Reveal delay={0.9} y={10}>
          <p className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-1 text-[15px] text-white/70">
            <span className="flex items-center gap-1.5">
              <MapPin className="size-4" />
              <span data-edit="site.location">{site.location}</span>
            </span>
            <LocalTime timeZone={site.timeZone} className="flex !text-[15px] !text-white/70" />
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <a
              href="#projects"
              className="group inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-[15px] font-semibold text-[#0c0915] shadow-lg shadow-black/30 transition-transform hover:-translate-y-0.5"
            >
              <span data-edit="copy.hero.primaryButton">{copy.primaryButton}</span>
              <ArrowDown className="size-4 transition-transform group-hover:translate-y-0.5" />
            </a>
            <a
              href={site.cta.href}
              className="glass group inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-[15px] font-semibold transition-colors hover:bg-white/15"
            >
              <span data-edit="copy.hero.secondaryButton">{copy.secondaryButton}</span>
              <ArrowUpRight className="size-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </a>
          </div>
        </Reveal>
      </div>

      {/* how to play with the scene, centred at the bottom of the screen */}
      <div className="hero-hint absolute inset-x-0 bottom-6 flex justify-center px-4 sm:bottom-8">
        <p className="glass flex items-center gap-1 rounded-full py-1.5 pr-4 pl-1.5 text-[13.5px] font-medium text-white/85 sm:text-sm">
          <span className="flex items-center gap-2 rounded-full bg-white/[0.08] py-1 pr-3 pl-2.5">
            <Hand aria-hidden className="size-4 text-lilac" />
            <span data-edit="copy.hero.hintHold">{copy.hintHold}</span>
          </span>
          <span className="flex items-center gap-2 pl-2.5">
            <MousePointerClick aria-hidden className="size-4 text-lilac" />
            <span data-edit="copy.hero.hintTap">{copy.hintTap}</span>
          </span>
        </p>
      </div>
    </section>
  );
}
