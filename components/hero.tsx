import { ArrowDown, ArrowUpRight, MapPin } from "lucide-react";
import { LocalTime } from "@/components/local-time";
import { Reveal, SplitText } from "@/components/motion";
import { site } from "@/content/site";

/**
 * First screen of the home page. It is transparent: the live scene behind the
 * site (components/scene-background.tsx) shows through, with the intro laid
 * over it.
 */
export function Hero() {
  return (
    <section
      data-hero
      aria-label="Introduction"
      className="hero relative flex h-[calc(100svh-4.25rem)] min-h-[32rem] flex-col justify-end px-2 pb-10 select-none sm:px-3 sm:pb-14"
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
          className="max-w-[11ch] text-[3.4rem] leading-[0.92] font-medium tracking-[-0.055em] [text-shadow:0_2px_40px_rgb(0_0_0/0.4)] sm:text-[6rem]"
        />

        <Reveal delay={0.9} y={10}>
          <p className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-1 text-[15px] text-white/70">
            <span className="flex items-center gap-1.5">
              <MapPin className="size-4" />
              {site.location}
            </span>
            <LocalTime timeZone={site.timeZone} className="flex !text-[15px] !text-white/70" />
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <a
              href="#projects"
              className="group inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-[15px] font-semibold text-[#0c0915] shadow-lg shadow-black/30 transition-transform hover:-translate-y-0.5"
            >
              See my work
              <ArrowDown className="size-4 transition-transform group-hover:translate-y-0.5" />
            </a>
            <a
              href={site.cta.href}
              className="glass group inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-[15px] font-semibold transition-colors hover:bg-white/15"
            >
              Get in touch
              <ArrowUpRight className="size-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </a>
          </div>
          <p aria-hidden className="mt-6 font-mono text-[10px] tracking-[0.2em] text-white/40 uppercase sm:hidden">
            Hold the scene to accelerate · Tap to jump
          </p>
        </Reveal>
      </div>

      <p
        aria-hidden
        className="pointer-events-none absolute right-2 bottom-14 hidden font-mono text-[10.5px] tracking-[0.2em] text-white/45 uppercase [writing-mode:vertical-rl] sm:right-3 sm:block"
      >
        Hold to accelerate · Tap to jump
      </p>
    </section>
  );
}
