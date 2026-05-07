import type { Metadata } from "next";
import { SectionHeading } from "@/components/brand/section-heading";
import { WrikeImportForm } from "@/components/admin/wrike-import-form";
import { requireAdmin } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { DataTable, type Column } from "@/components/brand/data-table";
import Link from "next/link";
import { formatRelative } from "@/lib/utils";

export const metadata: Metadata = { title: "Wrike import" };

export default async function WrikeImportPage() {
  await requireAdmin();
  const imported = await prisma.project.findMany({
    where: { wrikeId: { not: null } },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  const columns: Column<(typeof imported)[number]>[] = [
    {
      key: "name",
      header: "Project",
      isLeading: true,
      cell: (p) => (
        <Link
          href={`/projects/${p.id}`}
          className="font-medium hover:text-electric-light"
        >
          {p.name}
        </Link>
      ),
    },
    { key: "wrikeId", header: "Wrike ID", cell: (p) => p.wrikeId },
    {
      key: "needsClassification",
      header: "Needs classification",
      cell: (p) => (p.needsClassification ? "Yes" : "No"),
    },
    {
      key: "createdAt",
      header: "Imported",
      cell: (p) => formatRelative(p.createdAt),
    },
  ];

  return (
    <div className="space-y-8">
      <SectionHeading
        eyebrow="Admin"
        title="Wrike import"
        description="Pull existing project records from Wrike during the transition. Imported projects land flagged 'needs classification' until PX or the builder walks the wizard."
        level="h1"
      />
      <WrikeImportForm
        wrikeConfigured={!!process.env.WRIKE_TOKEN}
      />
      <DataTable
        title="Recently imported"
        columns={columns}
        rows={imported}
        rowKey={(p) => p.id}
        emptyState="No Wrike-imported projects yet."
      />
    </div>
  );
}
