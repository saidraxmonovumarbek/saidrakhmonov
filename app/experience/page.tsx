import { ArrowUpRight, MapPin } from "lucide-react";
import type { Metadata } from "next";
import { Stagger, StaggerItem } from "@/components/motion";
import { PageHeader, Section } from "@/components/section";
import { getContent } from "@/lib/content";

export const metadata: Metadata = {
  title: "Experience",
  description: "Where I have worked and studied.",
};

export default async function ExperiencePage() {
  const { jobs, education, copy } = await getContent();
  const t = copy.pages.experience;
  return (
    <>
      <PageHeader eyebrow="experience" title={t.title} text={t.text} edit="copy.pages.experience" />

      <Section title={t.work} edit="copy.pages.experience.work" flush>
        <Stagger as="ol">
          {jobs.map((job, i) => (
            <StaggerItem
              as="li"
              key={`${i}-${job.company}`}
              className={`grid gap-x-8 gap-y-3 px-5 py-8 sm:grid-cols-[9.5rem_1fr] sm:px-7 ${i > 0 ? "rule-t" : ""}`}
            >
              <p data-edit={`jobs.${i}.period`} className="pt-1 font-mono text-xs tracking-wide text-lilac/80">
                {job.period}
              </p>
              <div>
                <h3 data-edit={`jobs.${i}.role`} className="text-xl font-medium tracking-[-0.025em]">
                  {job.role}
                </h3>
                <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[15px] text-muted">
                  {job.href ? (
                    <a
                      href={job.href}
                      target="_blank"
                      rel="noreferrer"
                      className="group inline-flex items-center gap-0.5 font-medium text-fg hover:underline"
                    >
                      <span data-edit={`jobs.${i}.company`}>{job.company}</span>
                      <ArrowUpRight className="size-4 text-soft transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                    </a>
                  ) : (
                    <span data-edit={`jobs.${i}.company`} className="font-medium text-fg">
                      {job.company}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <MapPin className="size-3.5" />
                    <span data-edit={`jobs.${i}.location`}>{job.location}</span>
                  </span>
                </p>
                <ul className="mt-4 space-y-2.5 leading-relaxed text-white/75">
                  {job.points.map((point, p) => (
                    <li key={`${p}-${point}`} className="flex gap-3">
                      <span aria-hidden className="mt-[0.7em] size-1 shrink-0 rounded-full bg-lilac" />
                      <span data-edit={`jobs.${i}.points.${p}`}>{point}</span>
                    </li>
                  ))}
                </ul>
                <ul data-edit={`jobs.${i}.tags`} className="mt-5 flex flex-wrap gap-1.5">
                  {job.tags.map((tag) => (
                    <li
                      key={tag}
                      className="rounded-full border border-chip-line bg-chip px-2.5 py-1 text-[12.5px] leading-none text-white/80"
                    >
                      {tag}
                    </li>
                  ))}
                </ul>
              </div>
            </StaggerItem>
          ))}
        </Stagger>
      </Section>

      <Section title={t.education} edit="copy.pages.experience.education" flush>
        <Stagger as="ol">
          {education.map((item, i) => (
            <StaggerItem
              as="li"
              key={`${i}-${item.school}`}
              className={`grid gap-x-8 gap-y-3 px-5 py-8 sm:grid-cols-[9.5rem_1fr] sm:px-7 ${i > 0 ? "rule-t" : ""}`}
            >
              <p data-edit={`education.${i}.period`} className="pt-1 font-mono text-xs tracking-wide text-lilac/80">
                {item.period}
              </p>
              <div>
                <h3 data-edit={`education.${i}.degree`} className="text-xl font-medium tracking-[-0.025em]">
                  {item.degree}
                </h3>
                <p data-edit={`education.${i}.school`} className="mt-1 text-[15px] font-medium">
                  {item.school}
                </p>
                {item.note && (
                  <p data-edit={`education.${i}.note`} className="mt-3 leading-relaxed text-white/75">
                    {item.note}
                  </p>
                )}
              </div>
            </StaggerItem>
          ))}
        </Stagger>
      </Section>
    </>
  );
}
