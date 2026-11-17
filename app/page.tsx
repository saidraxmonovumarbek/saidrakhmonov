import { ArrowRight, ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { ArticleList } from "@/components/article-list";
import { GithubActivity } from "@/components/github-activity";
import { Hero } from "@/components/hero";
import { Highlights } from "@/components/highlights";
import { ContactIcon } from "@/components/icons";
import { Magnetic } from "@/components/magnetic";
import { Reveal, Stagger, StaggerItem } from "@/components/motion";
import { ProjectGrid } from "@/components/project-grid";
import { Quote } from "@/components/quote";
import { RichText } from "@/components/rich-text";
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
      <Hero />

      <div className="panel">
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
      </div>
    </>
  );
}
