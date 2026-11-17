import { ArrowDown, ArrowUpRight, MapPin } from "lucide-react";
import Image from "next/image";
import { LocalTime } from "@/components/local-time";
import { Reveal, SplitText } from "@/components/motion";
import { RoleRotator } from "@/components/role-rotator";
import { site } from "@/content/site";

/**
 * First screen of the home page. It is transparent: the live scene behind the
 * site (components/scene-background.tsx) shows through, with the intro laid
 * over it. Colours here are fixed light-on-dark because the scene is always
 * dark, whatever the site theme.
 */
export function Hero() {
  return (
    <section
      data-hero
      aria-label="Introduction"
      className="hero relative flex h-[calc(100svh-4rem)] min-h-[34rem] flex-col justify-end px-5 pb-8 text-white select-none sm:px-6 sm:pb-10"
    >
      {/* full-bleed scrim so the text reads over any frame of the scene */}
      <div
        aria-hidden
        className="pointer-events-none absolute bottom-0 left-1/2 h-[62%] w-screen -translate-x-1/2 bg-gradient-to-t from-[#06030c] via-[#06030c]/55 to-transparent"
      />

      <div className="relative">
        <Reveal delay={0.9} y={10} className="flex items-center gap-3">
          <div className="relative size-11 shrink-0 overflow-hidden rounded-xl border border-white/20 bg-white/10 backdrop-blur-md">
            {site.avatar ? (
              <Image src={site.avatar} alt={site.name} fill priority sizes="44px" className="object-cover" />
            ) : (
              <span className="grid size-full place-items-center font-serif text-xl">{site.initials}</span>
            )}
          </div>
          {site.status.text && (
            <p className="flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.07] px-3 py-1 text-[13px] text-white/80 backdrop-blur-md">
              <span
                className={
                  site.status.available ? "size-1.5 animate-pulse-dot rounded-full bg-live" : "size-1.5 rounded-full bg-white/40"
                }
              />
              {site.status.text}
            </p>
          )}
        </Reveal>

        <SplitText
          as="h1"
          immediate
          text={site.name}
          className="mt-5 max-w-[12ch] font-serif text-[3.2rem] leading-[0.95] tracking-[-0.02em] [text-shadow:0_2px_30px_rgb(0_0_0/0.45)] sm:text-[5.2rem]"
        />

        <Reveal delay={1.1} y={10}>
          <p className="mt-4 text-lg font-semibold tracking-wider text-white/75 sm:text-xl">
            <RoleRotator roles={site.roles} />
          </p>
          <p className="mt-1 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-sm font-medium text-white/60">
            <MapPin className="size-3.5" />
            {site.location}
            <LocalTime timeZone={site.timeZone} className="ml-3 flex !text-white/60" />
          </p>

          <div className="mt-7 flex flex-wrap items-center gap-3">
            <a
              href="#projects"
              className="group inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-[15px] font-semibold text-[#0c0915] shadow-lg shadow-black/30 transition-transform hover:-translate-y-0.5"
            >
              See my work
              <ArrowDown className="size-4 transition-transform group-hover:translate-y-0.5" />
            </a>
            <a
              href={site.cta.href}
              className="group inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/[0.08] px-5 py-2.5 text-[15px] font-semibold backdrop-blur-md transition-colors hover:bg-white/15"
            >
              Get in touch
              <ArrowUpRight className="size-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </a>
          </div>
          <p aria-hidden className="mt-5 font-mono text-[10px] tracking-[0.2em] text-white/40 uppercase sm:hidden">
            Hold the scene to accelerate · Tap to jump
          </p>
        </Reveal>
      </div>

      <p
        aria-hidden
        className="pointer-events-none absolute right-5 bottom-8 hidden font-mono text-[10.5px] tracking-[0.2em] text-white/45 uppercase [writing-mode:vertical-rl] sm:right-6 sm:bottom-10 sm:block"
      >
        Hold to accelerate · Tap to jump
      </p>
    </section>
  );
}
