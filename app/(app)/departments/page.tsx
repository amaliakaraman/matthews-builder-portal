import type { Metadata } from "next";
import { SectionHeading } from "@/components/brand/section-heading";
import { DepartmentsAdmin } from "@/components/admin/departments-admin";
import { requireAdmin } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";

export const metadata: Metadata = { title: "Departments" };

export default async function DepartmentsPage() {
  await requireAdmin();
  const departments = await prisma.department.findMany({
    orderBy: { name: "asc" },
  });
  return (
    <div className="space-y-8">
      <SectionHeading
        eyebrow="Admin"
        title="Departments"
        description="The list of Product Owner departments shown in the wizard. Add, rename, or deactivate as the org changes."
        level="h1"
      />
      <DepartmentsAdmin
        departments={departments.map((d) => ({
          id: d.id,
          name: d.name,
          coreJobsDescription: d.coreJobsDescription,
          isActive: d.isActive,
        }))}
      />
    </div>
  );
}
