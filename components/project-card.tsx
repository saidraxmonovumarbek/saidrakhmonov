import { Globe } from "lucide-react";
import Image from "next/image";
import { GithubIcon } from "@/components/icons";
import type { Project } from "@/content/projects";
import { cn } from "@/lib/utils";

const STATUS: Record<Project["status"], string> = {
  Live: "bg-live animate-pulse-dot",
  Building: "bg-amber-500",
  Archived: "bg-soft",
};

/** Gradient frame with a little browser window, used when there is no screenshot. */
function Cover({ project }: { project: Project }) {
  const { cover } = project;
  const [first, second] = cover.headline.split("\n");
  return (
    <div
      className="relative aspect-[16/10] overflow-hidden rounded-xl"
      style={{
        background: `radial-gradient(130% 130% at 0% 0%, #ffffff 0%, ${cover.from} 30%, ${cover.to} 100%)`,
      }}
    >
      <div className="absolute top-[20%] right-0 bottom-0 left-[12%] overflow-hidden rounded-tl-2xl bg-white shadow-[0_20px_50px_-10px_rgba(0,0,0,0.35)] transition-transform duration-500 ease-out group-hover:-translate-x-1.5 group-hover:-translate-y-1.5">
        {project.image ? (
          <Image
            src={project.image}
            alt={`Screenshot of ${project.title}`}
            fill
            sizes="(min-width: 640px) 330px, 90vw"
            className="object-cover object-left-top"
          />
        ) : (
          <div className="flex h-full flex-col text-neutral-900">
            <div className="flex items-center justify-between px-[7%] pt-[5%] text-[7px] font-semibold">
              <span className="flex items-center gap-1">
                <span className="size-1.5 rounded-full" style={{ background: cover.accent }} />
                {project.title}
              </span>
              <span className="flex items-center gap-2 font-normal text-neutral-400">
                <span>Features</span>
                <span>Docs</span>
                <span className="rounded-full bg-neutral-900 px-1.5 py-0.5 text-white">Open</span>
              </span>
            </div>
            <div className="flex flex-1 flex-col items-center justify-center px-4 pb-[6%] text-center">
              <p className="text-[clamp(15px,4.4cqw,22px)] leading-[1.08] font-medium tracking-tight">
                {first}
                {second && (
                  <>
                    <br />
                    <span style={{ color: cover.accent }}>{second}</span>
                  </>
                )}
              </p>
              <p className="mt-2 max-w-[80%] text-[6px] leading-snug text-neutral-400">
                {project.tagline}
              </p>
              <div className="mt-2.5 flex gap-1.5 text-[6px] font-semibold">
                <span className="rounded-full bg-neutral-900 px-2 py-1 text-white">Get started</span>
                <span
                  className="rounded-full px-2 py-1 text-white"
                  style={{ background: cover.accent }}
                >
                  Live demo
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
      {cover.ribbon && (
        <div className="absolute top-[13%] -right-[19%] w-[62%] rotate-[38deg] border-y border-dashed border-black/40 bg-amber-300 py-1 text-center text-[10px] font-medium text-neutral-900 shadow-sm">
          <span className="mr-1 inline-block size-1.5 rounded-full bg-emerald-600 align-middle" />
          {cover.ribbon}
        </div>
      )}
    </div>
  );
}

export function ProjectCard({ project }: { project: Project }) {
  return (
    <article className="group flex h-full flex-col p-2.5 [container-type:inline-size]">
      <Cover project={project} />
      <div className="mt-4 flex items-start justify-between gap-3 px-0.5">
        <div className="min-w-0">
          <h3 className="text-[1.35rem] leading-tight font-semibold tracking-tight">{project.title}</h3>
          <p className="mt-0.5 text-sm text-muted">{project.tagline}</p>
        </div>
        <span className="mt-1.5 flex shrink-0 items-center gap-2 text-sm font-medium text-muted">
          <span className={cn("size-1.5 rounded-full", STATUS[project.status])} />
          {project.status}
        </span>
      </div>
      <p className="mt-4 flex-1 px-0.5 leading-relaxed text-muted">{project.description}</p>
      <div className="mt-5 flex items-end justify-between gap-3 px-0.5 pb-1">
        <ul className="flex flex-wrap gap-1.5">
          {project.tags.map((tag) => (
            <li
              key={tag}
              className="rounded-md border border-chip-line bg-chip px-2 py-1 text-[13px] leading-none"
            >
              {tag}
            </li>
          ))}
        </ul>
        <div className="flex shrink-0 items-center gap-1 text-muted">
          {project.links.live && (
            <a
              href={project.links.live}
              target="_blank"
              rel="noreferrer"
              aria-label={`Open ${project.title} website`}
              className="grid size-9 place-items-center rounded-lg transition-all hover:-translate-y-0.5 hover:bg-chip hover:text-fg"
            >
              <Globe className="size-5" />
            </a>
          )}
          {project.links.repo && (
            <a
              href={project.links.repo}
              target="_blank"
              rel="noreferrer"
              aria-label={`Open ${project.title} source code`}
              className="grid size-9 place-items-center rounded-lg transition-all hover:-translate-y-0.5 hover:bg-chip hover:text-fg"
            >
              <GithubIcon className="size-5" />
            </a>
          )}
        </div>
      </div>
    </article>
  );
}
