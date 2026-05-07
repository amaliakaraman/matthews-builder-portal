import type { Metadata } from "next";
import { SectionHeading } from "@/components/brand/section-heading";
import { SponsorsAdmin } from "@/components/admin/sponsors-admin";
import { requireAdmin } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";

export const metadata: Metadata = { title: "Sponsors" };

export default async function SponsorsPage() {
  await requireAdmin();
  const sponsors = await prisma.sponsor.findMany({
    include: { user: true },
    orderBy: { audienceType: "asc" },
  });
  return (
    <div className="space-y-8">
      <SectionHeading
        eyebrow="Admin"
        title="Sponsor directory"
        description="Maps each audience type to the named Executive Sponsor with deployment sign-off authority."
        level="h1"
      />
      <SponsorsAdmin
        sponsors={sponsors.map((s) => ({
          id: s.id,
          email: s.user.email,
          name: s.user.name,
          audienceType: s.audienceType,
          isActive: s.isActive,
        }))}
      />
    </div>
  );
}
