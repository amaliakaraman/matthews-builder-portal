import type { Metadata } from "next";
import Link from "next/link";
import { SectionHeading } from "@/components/brand/section-heading";
import { DataTable, type Column } from "@/components/brand/data-table";
import { requireAdmin } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { formatDateTime, titleCase } from "@/lib/utils";

export const metadata: Metadata = { title: "Audit log" };

export default async function AuditLogPage() {
  await requireAdmin();
  const entries = await prisma.auditLogEntry.findMany({
    include: { actor: true, project: true },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  type Row = {
    id: string;
    when: string;
    actor: string;
    project: string;
    projectId: string;
    action: string;
    reason: string | null;
    detail: string;
  };

  const rows: Row[] = entries.map((e) => ({
    id: e.id,
    when: e.createdAt.toISOString(),
    actor: e.actor.name,
    project: e.project.name,
    projectId: e.project.id,
    action: e.action,
    reason: e.reason,
    detail: JSON.stringify({ before: e.before, after: e.after }),
  }));

  const columns: Column<Row>[] = [
    {
      key: "when",
      header: "When",
      isLeading: true,
      cell: (r) => formatDateTime(r.when),
    },
    {
      key: "project",
      header: "Project",
      cell: (r) => (
        <Link
          href={`/projects/${r.projectId}`}
          className="hover:text-electric-light"
        >
          {r.project}
        </Link>
      ),
    },
    { key: "actor", header: "Actor" },
    {
      key: "action",
      header: "Action",
      cell: (r) => titleCase(r.action),
    },
    {
      key: "reason",
      header: "Reason",
      cell: (r) =>
        r.reason ? <span className="italic">"{r.reason}"</span> : "—",
      align: "left",
    },
  ];

  return (
    <div className="space-y-8">
      <SectionHeading
        eyebrow="Admin"
        title="Audit log"
        description="Every classification change, status transition, override, and approval — immutable, with actor, timestamp, and reason."
        level="h1"
      />
      <DataTable
        columns={columns}
        rows={rows}
        rowKey={(r) => r.id}
        emptyState="Nothing logged yet."
      />
    </div>
  );
}
