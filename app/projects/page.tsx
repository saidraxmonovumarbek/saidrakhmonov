import type { Metadata } from "next";
import { ProjectGrid } from "@/components/project-grid";
import { PageHeader } from "@/components/section";
import { projects } from "@/content/projects";

export const metadata: Metadata = {
  title: "Projects",
  description: "Things I have designed and built.",
};

export default function ProjectsPage() {
  return (
    <>
      <PageHeader
        eyebrow={`${projects.length} projects`}
        title="Projects"
        text="Things I have designed, built and shipped. Some are live products, some are experiments that taught me something."
      />
      <div className="band" aria-hidden />
      <div className="px-2.5">
        <ProjectGrid projects={projects} />
      </div>
    </>
  );
}
