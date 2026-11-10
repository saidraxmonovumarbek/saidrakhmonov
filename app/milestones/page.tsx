import type { Metadata } from "next";
import { MilestoneTimeline } from "@/components/milestone-timeline";
import { PageHeader } from "@/components/section";
import { milestones } from "@/content/milestones";

export const metadata: Metadata = {
  title: "Milestones",
  description: "The journey so far, one step at a time.",
};

export default function MilestonesPage() {
  return (
    <>
      <PageHeader
        eyebrow={`${milestones.length} milestones`}
        title="Milestones"
        text="The journey so far. Small steps and big moments, newest first. Scroll to walk back through time."
      />
      <div className="band" aria-hidden />
      <MilestoneTimeline milestones={milestones} />
    </>
  );
}
