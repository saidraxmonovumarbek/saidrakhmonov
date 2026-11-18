import type { Metadata } from "next";
import { MilestoneTimeline } from "@/components/milestone-timeline";
import { PageHeader } from "@/components/section";
import { getContent } from "@/lib/content";

export const metadata: Metadata = {
  title: "Milestones",
  description: "The journey so far, one step at a time.",
};

export default async function MilestonesPage() {
  const { milestones, copy } = await getContent();
  return (
    <>
      <PageHeader
        eyebrow={`${milestones.length} milestones`}
        title={copy.pages.milestones.title}
        text={copy.pages.milestones.text}
        edit="copy.pages.milestones"
      />
      <div data-panel className="card">
        <MilestoneTimeline milestones={milestones} />
      </div>
    </>
  );
}
