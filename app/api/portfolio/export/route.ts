import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";

export async function GET() {
  await requireAdmin();
  const rows = await prisma.project.findMany({
    include: {
      builder: true,
      productOwnerDept: true,
      executiveSponsor: { include: { user: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const header = [
    "id",
    "name",
    "tier",
    "status",
    "product_owner_dept",
    "audience_type",
    "executive_sponsor",
    "builder_name",
    "builder_email",
    "wrike_id",
    "created_at",
    "updated_at",
    "submitted_at",
  ];

  const csv = [
    header.join(","),
    ...rows.map((p) =>
      [
        p.id,
        csvEscape(p.name),
        p.tier ?? "",
        p.status,
        csvEscape(p.productOwnerDept?.name ?? ""),
        p.audienceType ?? "",
        csvEscape(p.executiveSponsor?.user.name ?? ""),
        csvEscape(p.builder?.name ?? ""),
        csvEscape(p.builder?.email ?? ""),
        p.wrikeId ?? "",
        p.createdAt.toISOString(),
        p.updatedAt.toISOString(),
        p.submittedAt?.toISOString() ?? "",
      ].join(",")
    ),
  ].join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="builder-portal-portfolio-${new Date()
        .toISOString()
        .slice(0, 10)}.csv"`,
    },
  });
}

function csvEscape(s: string): string {
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}
