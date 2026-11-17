import { Stagger, StaggerItem } from "@/components/motion";
import { ProjectCard } from "@/components/project-card";
import type { Project } from "@/content/projects";

/** Two-column grid of project tiles. */
export function ProjectGrid({ projects }: { projects: Project[] }) {
  return (
    <Stagger className="grid gap-2.5 sm:grid-cols-2">
      {projects.map((project) => (
        <StaggerItem
          key={project.slug}
          className="rounded-[1.25rem] border border-chip-line bg-white/[0.03] transition-colors hover:border-white/20 hover:bg-white/[0.06]"
        >
          <ProjectCard project={project} />
        </StaggerItem>
      ))}
    </Stagger>
  );
}
