import type { Metadata } from "next";
import Link from "next/link";
import { SectionHeading } from "@/components/brand/section-heading";
import { DataTable, type Column } from "@/components/brand/data-table";
import {
  ProjectStatusChip,
  TierChip,
} from "@/components/brand/status-chip";
import { requireRole } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { AUDIENCE_LABELS } from "@/lib/db/types";
import { formatRelative } from "@/lib/utils";

export const metadata: Metadata = { title: "Sign-off queue" };

export default async function SignOffPage() {
  const user = await requireRole(["sponsor", "px_admin"]);

  // Find sponsor record (if user is sponsor)
  const sponsor = await prisma.sponsor.findUnique({
    where: { userId: user.id },
  });

  // Sponsor sees projects awaiting sign-off for their audience(s)
  const projects = await prisma.project.findMany({
    where: {
      status: "px_signoff",
      ...(sponsor
        ? { audienceType: sponsor.audienceType }
        : {}),
    },
    include: {
      builder: true,
      productOwnerDept: true,
      executiveSponsor: { include: { user: true } },
    },
    orderBy: { updatedAt: "asc" },
  });

  type Row = {
    id: string;
    name: string;
    tier: string | null;
    status: string;
    audience: string | null;
    builder: string;
    waitingFor: string;
  };
  const rows: Row[] = projects.map((p) => ({
    id: p.id,
    name: p.name,
    tier: p.tier,
    status: p.status,
    audience: p.audienceType,
    builder: p.builder.name,
    waitingFor: formatRelative(p.updatedAt),
  }));

  const columns: Column<Row>[] = [
    {
      key: "name",
      header: "Project",
      isLeading: true,
      cell: (r) => (
        <Link
          href={`/projects/${r.id}`}
          className="font-medium hover:text-electric-light"
        >
          {r.name}
        </Link>
      ),
    },
    { key: "tier", header: "Tier", cell: (r) => <TierChip tier={r.tier} /> },
    {
      key: "audience",
      header: "Audience",
      cell: (r) => (r.audience ? AUDIENCE_LABELS[r.audience] : "—"),
    },
    { key: "builder", header: "Builder" },
    {
      key: "status",
      header: "Status",
      cell: (r) => <ProjectStatusChip status={r.status} />,
    },
    { key: "waitingFor", header: "Waiting" },
  ];

  return (
    <div className="space-y-8">
      <SectionHeading
        eyebrow="Sponsor"
        title="Sign-off queue"
        description="Projects awaiting your deployment approval. Open a project to review the MVP, leave comments, or sign off."
        level="h1"
      />
      <DataTable
        columns={columns}
        rows={rows}
        rowKey={(r) => r.id}
        rowHref={(r) => `/projects/${r.id}`}
        emptyState="No projects waiting on you."
      />
    </div>
  );
}
