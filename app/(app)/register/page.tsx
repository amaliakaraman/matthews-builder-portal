import type { Metadata } from "next";
import { Wizard } from "@/components/wizard/wizard";
import { getDepartments, getSponsors } from "@/lib/db/queries";
import { prisma } from "@/lib/db/prisma";
import { requireUser } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Register a project",
};

interface PageProps {
  searchParams: Promise<{ draft?: string }>;
}

export default async function RegisterPage({ searchParams }: PageProps) {
  const user = await requireUser();
  const params = await searchParams;
  const [departments, sponsors] = await Promise.all([
    getDepartments(),
    getSponsors(),
  ]);

  let draft = null;
  if (params.draft) {
    draft = await prisma.project.findFirst({
      where: { id: params.draft, builderUserId: user.id },
    });
  }

  return (
    <div className="space-y-8">
      <Wizard
        departments={departments.map((d) => ({ id: d.id, name: d.name }))}
        sponsors={sponsors.map((s) => ({
          audienceType: s.audienceType,
          name: s.user.name,
        }))}
        draft={
          draft
            ? {
                id: draft.id,
                name: draft.name,
                description: draft.description,
                problemStatement: draft.problemStatement,
                expectedUsers: draft.expectedUsers,
                scopingDocsUrl: draft.scopingDocsUrl,
                intendedStartDate: draft.intendedStartDate?.toISOString().slice(0, 10) ?? null,
                productOwnerDeptId: draft.productOwnerDeptId,
                audienceType: draft.audienceType,
                intakeAnswers: (draft.intakeAnswers as object) ?? {},
              }
            : null
        }
      />
    </div>
  );
}
