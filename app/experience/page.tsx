import { ArrowUpRight, MapPin } from "lucide-react";
import type { Metadata } from "next";
import { Stagger, StaggerItem } from "@/components/motion";
import { PageHeader, Section } from "@/components/section";
import { education, jobs } from "@/content/experience";

export const metadata: Metadata = {
  title: "Experience",
  description: "Where I have worked and studied.",
};

export default function ExperiencePage() {
  return (
    <>
      <PageHeader
        eyebrow="experience"
        title="Experience"
        text="Where I have worked and studied, and what I did there."
      />

      <Section title="Work" flush>
        <Stagger as="ol">
          {jobs.map((job, i) => (
            <StaggerItem
              as="li"
              key={`${job.company}-${job.period}`}
              className={`grid gap-x-8 gap-y-3 px-5 py-8 sm:grid-cols-[9.5rem_1fr] sm:px-6 ${i > 0 ? "rule-t" : ""}`}
            >
              <p className="pt-1 font-mono text-xs tracking-wide text-soft">{job.period}</p>
              <div>
                <h3 className="text-xl font-semibold tracking-tight">{job.role}</h3>
                <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[15px] text-muted">
                  {job.href ? (
                    <a
                      href={job.href}
                      target="_blank"
                      rel="noreferrer"
                      className="group inline-flex items-center gap-0.5 font-medium text-fg hover:underline"
                    >
                      {job.company}
                      <ArrowUpRight className="size-4 text-soft transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                    </a>
                  ) : (
                    <span className="font-medium text-fg">{job.company}</span>
                  )}
                  <span className="flex items-center gap-1">
                    <MapPin className="size-3.5" />
                    {job.location}
                  </span>
                </p>
                <ul className="mt-4 space-y-2.5 leading-relaxed text-muted">
                  {job.points.map((point) => (
                    <li key={point} className="flex gap-3">
                      <span aria-hidden className="mt-[0.7em] size-1 shrink-0 rounded-full bg-soft" />
                      {point}
                    </li>
                  ))}
                </ul>
                <ul className="mt-5 flex flex-wrap gap-1.5">
                  {job.tags.map((tag) => (
                    <li
                      key={tag}
                      className="rounded-md border border-chip-line bg-chip px-2 py-1 text-[13px] leading-none"
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

      <Section title="Education" flush>
        <Stagger as="ol">
          {education.map((item, i) => (
            <StaggerItem
              as="li"
              key={item.school}
              className={`grid gap-x-8 gap-y-3 px-5 py-8 sm:grid-cols-[9.5rem_1fr] sm:px-6 ${i > 0 ? "rule-t" : ""}`}
            >
              <p className="pt-1 font-mono text-xs tracking-wide text-soft">{item.period}</p>
              <div>
                <h3 className="text-xl font-semibold tracking-tight">{item.degree}</h3>
                <p className="mt-1 text-[15px] font-medium">{item.school}</p>
                {item.note && <p className="mt-3 leading-relaxed text-muted">{item.note}</p>}
              </div>
            </StaggerItem>
          ))}
        </Stagger>
      </Section>
    </>
  );
}
