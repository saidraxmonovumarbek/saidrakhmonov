import { ArrowRight, ArrowUpRight, MapPin } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { ArticleList } from "@/components/article-list";
import { Banner } from "@/components/banner";
import { GithubActivity } from "@/components/github-activity";
import { Highlights } from "@/components/highlights";
import { ContactIcon } from "@/components/icons";
import { LocalTime } from "@/components/local-time";
import { Magnetic } from "@/components/magnetic";
import { Reveal, SplitText, Stagger, StaggerItem } from "@/components/motion";
import { ProjectGrid } from "@/components/project-grid";
import { Quote } from "@/components/quote";
import { RichText } from "@/components/rich-text";
import { RoleRotator } from "@/components/role-rotator";
import { Section } from "@/components/section";
import { TechStack } from "@/components/tech-stack";
import { projects } from "@/content/projects";
import { site } from "@/content/site";
import { getArticles } from "@/lib/articles";

function ViewAll({ href }: { href: string }) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-1 pb-1 text-[15px] text-muted transition-colors hover:text-fg"
    >
      View all
      <ArrowUpRight className="size-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
    </Link>
  );
}

export default async function Home() {
  const featured = projects.filter((p) => p.featured).slice(0, 4);
  const articles = (await getArticles()).slice(0, 3);

  return (
    <>
      <Banner />

      {/* Profile */}
      <Reveal className="flex items-start gap-5 px-5 py-6 sm:gap-7 sm:px-6">
        <div className="relative size-24 shrink-0 overflow-hidden rounded-2xl border-4 border-chip bg-fg shadow-md ring-1 ring-chip-line sm:size-[7.25rem]">
          {site.avatar ? (
            <Image src={site.avatar} alt={site.name} fill priority sizes="116px" className="object-cover" />
          ) : (
            <span className="grid size-full place-items-center font-serif text-5xl text-bg">
              {site.initials}
            </span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex min-h-6 items-center justify-between gap-3">
            {site.status.text ? (
              <p className="flex items-center gap-2 text-[13px] text-muted">
                <span
                  className={
                    site.status.available
                      ? "size-1.5 animate-pulse-dot rounded-full bg-live"
                      : "size-1.5 rounded-full bg-soft"
                  }
                />
                {site.status.text}
              </p>
            ) : (
              <span />
            )}
            <LocalTime timeZone={site.timeZone} className="hidden sm:flex" />
          </div>
          <SplitText
            as="h1"
            immediate
            text={site.name}
            className="mt-1.5 font-serif text-[2.1rem] leading-[1.05] tracking-[-0.01em] sm:text-[2.6rem]"
          />
          <p className="mt-1.5 text-lg font-semibold tracking-wider text-muted">
            <RoleRotator roles={site.roles} />
          </p>
          <p className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-sm font-medium text-muted">
            <MapPin className="size-3.5" />
            {site.location}
            <LocalTime timeZone={site.timeZone} className="ml-2 flex font-normal sm:hidden" />
          </p>
        </div>
      </Reveal>

      <Section id="about" title="About">
        <Stagger as="ul" className="space-y-4 text-[17px] leading-relaxed">
          {site.about.map((line) => (
            <StaggerItem as="li" key={line} className="flex gap-3">
              <span aria-hidden className="mt-[0.7em] size-1 shrink-0 rounded-full bg-soft" />
              <span>
                <RichText text={line} />
              </span>
            </StaggerItem>
          ))}
        </Stagger>
      </Section>

      <Section id="contact" title="Contact" flush>
        <Stagger as="ul" className="grid grid-cols-2 px-2 sm:flex">
          {site.contact.map((item) => (
            <StaggerItem
              as="li"
              key={item.label}
              className="border-dashed border-line sm:flex-auto sm:not-last:border-r"
            >
              <a
                href={item.href}
                target={item.href.startsWith("http") ? "_blank" : undefined}
                rel="noreferrer"
                className="group flex items-center gap-2 px-2.5 py-2.5"
              >
                <span className="grid size-9 shrink-0 place-items-center rounded-[10px] border border-chip-line bg-card shadow-sm transition-all duration-300 group-hover:-translate-y-0.5 group-hover:-rotate-6 group-hover:border-fg group-hover:shadow-md">
                  <ContactIcon name={item.icon} className="size-[18px]" />
                </span>
                <span className="text-[15px] font-medium">{item.label}</span>
                <ArrowUpRight className="size-3.5 shrink-0 text-soft transition-all duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-fg" />
              </a>
            </StaggerItem>
          ))}
        </Stagger>
      </Section>

      <Section id="projects" title="Projects" action={<ViewAll href="/projects" />} className="!px-2.5 !py-0">
        <ProjectGrid projects={featured} />
      </Section>

      <TechStack />

      <GithubActivity />

      <Section id="writing" title="Writing" action={<ViewAll href="/articles" />} flush>
        <ArticleList articles={articles} />
      </Section>

      <Highlights />

      <Section id="talk" title={site.cta.heading}>
        <Reveal className="py-14 text-center">
          <p className="text-xl text-muted sm:text-[1.35rem]">{site.cta.text}</p>
          <div className="mt-7">
            <Magnetic>
              <a
                href={site.cta.href}
                className="group inline-flex items-center gap-2.5 rounded-full bg-fg px-8 py-3.5 text-[17px] font-semibold text-bg shadow-lg shadow-black/10 transition-shadow hover:shadow-xl hover:shadow-black/20"
              >
                {site.cta.button}
                <ArrowRight className="size-5 transition-transform duration-300 group-hover:translate-x-1" />
              </a>
            </Magnetic>
          </div>
        </Reveal>
      </Section>

      <Quote text={site.quote.text} author={site.quote.author} />
    </>
  );
}
