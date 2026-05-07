import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { SectionHeading } from "@/components/brand/section-heading";
import { EmptyState } from "@/components/brand/empty-state";
import { RegistryView } from "@/components/registry/registry-view";
import { getDepartments, getProjects, getSponsors } from "@/lib/db/queries";
import { TIER_LABELS } from "@/lib/db/types";

export const metadata: Metadata = {
  title: "Registry",
};

interface PageProps {
  searchParams: Promise<{
    tier?: string;
    status?: string;
    productOwnerDeptId?: string;
    sponsorId?: string;
    q?: string;
    view?: string;
  }>;
}

export default async function RegistryPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const [projects, departments, sponsors] = await Promise.all([
    getProjects({
      tier: params.tier,
      status: params.status,
      productOwnerDeptId: params.productOwnerDeptId,
      sponsorId: params.sponsorId,
      q: params.q,
    }),
    getDepartments(),
    getSponsors(),
  ]);

  return (
    <div className="space-y-8">
      <SectionHeading
        eyebrow="Registry"
        title="Every registered project at Matthews."
        description="Browse before you build. Search, filter, and click through to any project's detail page to see the three dimensions, timeline, and approvals."
        level="h1"
        actions={
          <Button asChild>
            <Link href="/register">Register a project</Link>
          </Button>
        }
      />

      {projects.length === 0 && !params.q && !params.tier && !params.status ? (
        <EmptyState
          title="No projects registered yet."
          description="Be the first to file a build through Builder Portal. The wizard takes about 3 minutes."
          ctaLabel="Start a registration"
          ctaHref="/register"
        />
      ) : (
        <RegistryView
          projects={projects.map((p) => ({
            id: p.id,
            name: p.name,
            description: p.description,
            tier: p.tier,
            status: p.status,
            builderName: p.builder?.name ?? "—",
            ownerDept: p.productOwnerDept?.name ?? "—",
            sponsorName: p.executiveSponsor?.user.name ?? "—",
            audienceType: p.audienceType,
            updatedAt: p.updatedAt.toISOString(),
          }))}
          departments={departments.map((d) => ({ id: d.id, name: d.name }))}
          sponsors={sponsors.map((s) => ({
            id: s.id,
            name: s.user.name,
            audienceType: s.audienceType,
          }))}
          tierOptions={Object.keys(TIER_LABELS)}
          activeFilters={{
            tier: params.tier,
            status: params.status,
            productOwnerDeptId: params.productOwnerDeptId,
            sponsorId: params.sponsorId,
            q: params.q,
            view: params.view,
          }}
        />
      )}
    </div>
  );
}
