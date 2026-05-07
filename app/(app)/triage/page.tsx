import type { Metadata } from "next";
import { SectionHeading } from "@/components/brand/section-heading";
import { TriageQueue } from "@/components/admin/triage-queue";
import { requireAdmin } from "@/lib/auth/session";
import { getTriageQueue } from "@/lib/db/queries";

export const metadata: Metadata = {
  title: "Triage queue",
};

export default async function TriagePage() {
  await requireAdmin();
  const projects = await getTriageQueue();

  return (
    <div className="space-y-8 surface-deep -mx-4 sm:-mx-6 lg:-mx-8 -my-8 lg:-my-12 px-4 sm:px-6 lg:px-8 py-12 min-h-[calc(100vh-4rem)]">
      <SectionHeading
        eyebrow="Platform Experience"
        title="Triage queue"
        description="New registrations awaiting classification review. Sorted by tier and submission date."
        level="h1"
        variant="dark"
      />
      <TriageQueue
        projects={projects.map((p) => ({
          id: p.id,
          name: p.name,
          description: p.description,
          tier: p.tier,
          status: p.status,
          builderName: p.builder?.name ?? "—",
          ownerDept: p.productOwnerDept?.name ?? "—",
          sponsorName: p.executiveSponsor?.user.name ?? "—",
          submittedAt: p.submittedAt?.toISOString() ?? null,
          edgeCase: p.edgeCase,
        }))}
      />
    </div>
  );
}
