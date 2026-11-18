import type { Metadata } from "next";
import { ProjectGrid } from "@/components/project-grid";
import { PageHeader } from "@/components/section";
import { getContent } from "@/lib/content";

export const metadata: Metadata = {
  title: "Projects",
  description: "Things I have designed and built.",
};

export default async function ProjectsPage() {
  const { projects, copy } = await getContent();
  return (
    <>
      <PageHeader
        eyebrow={`${projects.length} projects`}
        title={copy.pages.projects.title}
        text={copy.pages.projects.text}
        edit="copy.pages.projects"
      />
      <div data-panel className="card p-2.5">
        <ProjectGrid projects={projects} />
      </div>
    </>
  );
}
