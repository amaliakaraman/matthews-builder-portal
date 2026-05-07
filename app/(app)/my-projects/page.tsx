import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { SectionHeading } from "@/components/brand/section-heading";
import { EmptyState } from "@/components/brand/empty-state";
import { DataTable, type Column } from "@/components/brand/data-table";
import {
  ProjectStatusChip,
  TierChip,
} from "@/components/brand/status-chip";
import { requireUser } from "@/lib/auth/session";
import { getProjects } from "@/lib/db/queries";
import { formatRelative } from "@/lib/utils";

export const metadata: Metadata = {
  title: "My Projects",
};

const NEXT_ACTION: Record<string, string> = {
  draft: "Finish the wizard",
  submitted: "Awaiting PX review",
  under_px_review: "PX is reviewing",
  eng_alignment: "Engineering aligning",
  needs_revision: "Revise + resubmit",
  approved: "Build can begin",
  in_build: "Building",
  mvp_ready: "Ship to test audience",
  in_test: "Collecting test feedback",
  px_signoff: "Awaiting PX sign-off",
  deployed: "Monitor deployment",
  active: "Active",
  acknowledged: "Personal — active",
  rejected: "Closed (rejected)",
  archived: "Archived",
};

interface Row {
  id: string;
  name: string;
  tier: string | null;
  status: string;
  nextAction: string;
  updatedAt: string;
}

export default async function MyProjectsPage() {
  const user = await requireUser();
  const projects = await getProjects({ builderUserId: user.id });

  const rows: Row[] = projects.map((p) => ({
    id: p.id,
    name: p.name,
    tier: p.tier,
    status: p.status,
    nextAction: NEXT_ACTION[p.status] ?? "—",
    updatedAt: p.updatedAt.toISOString(),
  }));

  const columns: Column<Row>[] = [
    {
      key: "name",
      header: "Project",
      isLeading: true,
      cell: (r) => (
        <Link
          href={`/projects/${r.id}`}
          className="font-medium text-matthews-deep hover:text-electric-light"
        >
          {r.name}
        </Link>
      ),
    },
    { key: "tier", header: "Tier", cell: (r) => <TierChip tier={r.tier} /> },
    {
      key: "status",
      header: "Status",
      cell: (r) => <ProjectStatusChip status={r.status} />,
    },
    {
      key: "nextAction",
      header: "Next required action",
      cell: (r) =>
        r.status === "draft" ? (
          <Link
            href={`/register?draft=${r.id}`}
            className="text-electric-light hover:underline"
          >
            {r.nextAction} →
          </Link>
        ) : (
          r.nextAction
        ),
    },
    {
      key: "updatedAt",
      header: "Updated",
      cell: (r) => formatRelative(r.updatedAt),
    },
  ];

  return (
    <div className="space-y-8">
      <SectionHeading
        eyebrow="My Projects"
        title={`${user.name.split(" ")[0]}'s registered builds`}
        description="Everything you've registered or co-own. Drafts resume the wizard where you left off."
        level="h1"
        actions={
          <Button asChild>
            <Link href="/register">New project</Link>
          </Button>
        }
      />
      {rows.length === 0 ? (
        <EmptyState
          title="You haven't registered anything yet."
          description="Walk the wizard to classify your build and put it in the registry."
          ctaLabel="Register your first project"
          ctaHref="/register"
        />
      ) : (
        <DataTable
          columns={columns}
          rows={rows}
          rowKey={(r) => r.id}
          rowHref={(r) => `/projects/${r.id}`}
        />
      )}
    </div>
  );
}
