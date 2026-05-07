import type { Metadata } from "next";
import Link from "next/link";
import { SectionHeading } from "@/components/brand/section-heading";
import { Button } from "@/components/ui/button";
import { PortfolioDashboard } from "@/components/admin/portfolio-dashboard";
import { requireAdmin } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { TIER_LABELS } from "@/lib/db/types";

export const metadata: Metadata = { title: "Portfolio dashboard" };

export default async function PortfolioPage() {
  await requireAdmin();
  const projects = await prisma.project.findMany({
    include: {
      productOwnerDept: true,
      executiveSponsor: { include: { user: true } },
      builder: true,
    },
  });

  const byTier: Record<string, number> = {};
  Object.keys(TIER_LABELS).forEach((t) => (byTier[t] = 0));
  byTier.unclassified = 0;

  const byStatus: Record<string, number> = {};
  const byOwner: Record<string, number> = {};
  const bySponsor: Record<string, number> = {};

  const now = Date.now();
  const STALL_THRESHOLD_MS = 21 * 24 * 60 * 60 * 1000; // 21d
  const OVERDUE_REVIEW_MS = 5 * 24 * 60 * 60 * 1000;
  const overdue: Array<{
    id: string;
    name: string;
    status: string;
    age: number;
  }> = [];
  const stalled: Array<{
    id: string;
    name: string;
    status: string;
    age: number;
  }> = [];

  for (const p of projects) {
    byTier[p.tier ?? "unclassified"] =
      (byTier[p.tier ?? "unclassified"] ?? 0) + 1;
    byStatus[p.status] = (byStatus[p.status] ?? 0) + 1;
    if (p.productOwnerDept) {
      byOwner[p.productOwnerDept.name] =
        (byOwner[p.productOwnerDept.name] ?? 0) + 1;
    }
    if (p.executiveSponsor?.user.name) {
      bySponsor[p.executiveSponsor.user.name] =
        (bySponsor[p.executiveSponsor.user.name] ?? 0) + 1;
    }
    const age = now - new Date(p.updatedAt).getTime();
    if (
      ["submitted", "under_px_review"].includes(p.status) &&
      age > OVERDUE_REVIEW_MS
    ) {
      overdue.push({ id: p.id, name: p.name, status: p.status, age });
    } else if (
      ["in_build", "mvp_ready", "in_test", "needs_revision"].includes(p.status) &&
      age > STALL_THRESHOLD_MS
    ) {
      stalled.push({ id: p.id, name: p.name, status: p.status, age });
    }
  }

  return (
    <div className="space-y-8">
      <SectionHeading
        eyebrow="Platform Experience"
        title="Portfolio dashboard"
        description={`${projects.length} projects across the program. Breakdowns by tier, owner, sponsor, and status — plus overdue and stalled flags.`}
        level="h1"
        actions={
          <Button asChild variant="outline">
            <Link href="/api/portfolio/export">Export CSV</Link>
          </Button>
        }
      />

      <PortfolioDashboard
        byTier={byTier}
        byStatus={byStatus}
        byOwner={byOwner}
        bySponsor={bySponsor}
        overdue={overdue}
        stalled={stalled}
      />
    </div>
  );
}
