import { Stagger, StaggerItem } from "@/components/motion";
import { ProjectCard } from "@/components/project-card";
import type { Project } from "@/content/projects";
import { cn } from "@/lib/utils";

/** Two-column grid with the dashed gutters between cards. */
export function ProjectGrid({ projects }: { projects: Project[] }) {
  const lastRowStart = projects.length - (projects.length % 2 === 0 ? 2 : 1);
  return (
    <Stagger className="grid gap-x-6 gap-y-6 sm:grid-cols-2">
      {projects.map((project, i) => (
        <StaggerItem
          key={project.slug}
          className={cn(
            "border-dashed border-line",
            i % 2 === 0 ? "sm:border-r" : "sm:border-l",
            i >= 2 && "sm:border-t",
            i > 0 && "max-sm:border-t",
            i < lastRowStart && "sm:border-b",
            i < projects.length - 1 && "max-sm:border-b",
          )}
        >
          <ProjectCard project={project} />
        </StaggerItem>
      ))}
    </Stagger>
  );
}
