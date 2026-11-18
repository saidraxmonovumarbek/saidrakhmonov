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
import { publishedArticles } from "@/lib/articles";
import { getContent } from "@/lib/content";
import { edit } from "@/lib/content-path";

function ViewAll({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-1 pb-1 text-[15px] text-muted transition-colors hover:text-fg"
    >
      <span data-edit="copy.home.viewAll">{label}</span>
      <ArrowUpRight className="size-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
    </Link>
  );
}

export default async function Home() {
  const content = await getContent();
  const { site, copy, projects } = content;
  const t = copy.home;
  const featured = projects.filter((p) => p.featured).slice(0, 4);
  const articles = publishedArticles(content.articles).slice(0, 3);

  return (
    <>
      <Hero site={site} copy={copy.hero} />

      <div className="panel">
        <Section id="about" title={t.about} edit="copy.home.about">
          <Stagger as="ul" className="space-y-5 text-[17px] leading-relaxed text-white/85 sm:text-lg">
            {site.about.map((line, i) => (
              <StaggerItem as="li" key={`${i}-${line}`} className="flex gap-3.5">
                <span aria-hidden className="mt-[0.72em] size-1 shrink-0 rounded-full bg-lilac" />
                <span data-edit={edit("site", "about", i)}>
                  <RichText text={line} />
                </span>
              </StaggerItem>
            ))}
          </Stagger>
        </Section>

        <Section id="contact" title={t.contact} edit="copy.home.contact" flush className="p-3 sm:p-4">
          <Stagger as="ul" className="grid grid-cols-2 gap-2 sm:grid-cols-5">
            {site.contact.map((item, i) => (
              <StaggerItem as="li" key={`${i}-${item.label}`}>
                <a
                  href={item.href}
                  target={item.href.startsWith("http") ? "_blank" : undefined}
                  rel="noreferrer"
                  className="group flex items-center gap-2.5 rounded-2xl border border-chip-line bg-chip px-3 py-3 transition-all duration-300 hover:-translate-y-0.5 hover:border-white/25 hover:bg-white/[0.09]"
                >
                  <ContactIcon name={item.icon} className="size-[18px] shrink-0 text-lilac transition-transform duration-300 group-hover:-rotate-6" />
                  <span className="text-[15px] font-medium" data-edit={edit("site", "contact", i, "label")}>
                    {item.label}
                  </span>
                  <ArrowUpRight className="ml-auto size-3.5 shrink-0 text-soft transition-all duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-fg" />
                </a>
              </StaggerItem>
            ))}
          </Stagger>
        </Section>

        <Section
          id="projects"
          title={t.projects}
          edit="copy.home.projects"
          action={<ViewAll href="/projects" label={t.viewAll} />}
          flush
          className="p-2.5"
        >
          <ProjectGrid projects={featured} />
        </Section>

        <TechStack tech={content.tech} title={t.tech} note={t.techNote} />

        <GithubActivity username={site.githubUsername} title={t.activity} />

        <Section id="writing" title={t.writing} edit="copy.home.writing" action={<ViewAll href="/articles" label={t.viewAll} />} flush>
          <ArticleList articles={articles} empty={copy.pages.articles.empty} />
        </Section>

        <Highlights highlights={content.highlights} title={t.highlights} />

        <Section id="talk" title={site.cta.heading} edit="site.cta.heading">
          <Reveal className="py-12 text-center">
            <p data-edit="site.cta.text" className="mx-auto max-w-md text-xl leading-snug text-white/85 sm:text-2xl">
              {site.cta.text}
            </p>
            <div className="mt-8">
              <Magnetic>
                <a
                  href={site.cta.href}
                  className="bg-lava group inline-flex items-center gap-2.5 rounded-full px-8 py-3.5 text-[17px] font-semibold text-[#14061b] shadow-[0_10px_40px_-8px_rgb(255_90_40/0.6)] transition-shadow hover:shadow-[0_14px_50px_-6px_rgb(255_90_40/0.8)]"
                >
                  <span data-edit="site.cta.button">{site.cta.button}</span>
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
