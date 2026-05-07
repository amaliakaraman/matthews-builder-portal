"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { classify, type ClassifyAnswers } from "@/lib/classification/classify";
import { writeAuditLog } from "@/lib/audit/write";
import { sendNotification } from "@/lib/email/send";
import {
  AudienceType,
  MilestoneType,
  ProjectStatus,
  Tier,
} from "@/lib/db/types";

const wizardSchema = z.object({
  draftId: z.string().uuid().nullable().optional(),
  answers: z
    .object({
      personal_only: z.boolean().nullable(),
      department_use: z.boolean().nullable(),
      cross_department: z.boolean().nullable(),
      read_only: z.boolean().nullable(),
      store_new_data: z.boolean().nullable(),
      edit_artemis: z.boolean().nullable(),
      new_schema: z.boolean().nullable(),
      approved_tooling_ok: z.boolean().nullable(),
      mvp_test_ok: z.boolean().nullable(),
      eng_timeline_ok: z.boolean().nullable(),
    })
    .partial(),
  productOwnerDeptId: z.string().uuid().nullable(),
  audienceType: z.string().nullable(),
  metadata: z.object({
    name: z.string().min(1, "Project name is required.").max(120),
    description: z.string().max(2000).optional().nullable(),
    problemStatement: z.string().max(4000).optional().nullable(),
    expectedUsers: z.string().max(500).optional().nullable(),
    intendedStartDate: z.string().optional().nullable(),
    scopingDocsUrl: z.string().url().optional().nullable().or(z.literal("")),
  }),
  acknowledged: z.boolean(),
});

type WizardSubmitInput = z.infer<typeof wizardSchema>;

/**
 * Save wizard progress as a Draft (no validation enforced beyond name).
 * Returns the project id so the client can persist it for resume.
 */
export async function saveDraftAction(input: WizardSubmitInput) {
  const user = await requireUser();
  const parsed = wizardSchema.safeParse({ ...input, acknowledged: false });
  // Drafts are forgiving — we only require a name >= 1 char.
  if (!parsed.success && !input.metadata?.name) {
    return { ok: false, error: "Add a project name to save a draft." };
  }
  const data = parsed.success ? parsed.data : (input as WizardSubmitInput);

  const result = classify(data.answers as Partial<ClassifyAnswers>);

  const draftPayload = {
    name: data.metadata.name,
    description: data.metadata.description ?? null,
    problemStatement: data.metadata.problemStatement ?? null,
    expectedUsers: data.metadata.expectedUsers ?? null,
    scopingDocsUrl: data.metadata.scopingDocsUrl || null,
    intendedStartDate: data.metadata.intendedStartDate
      ? new Date(data.metadata.intendedStartDate)
      : null,
    builderUserId: user.id,
    tier: (result.tier as Tier | null) ?? null,
    productOwnerDeptId: data.productOwnerDeptId,
    audienceType: data.audienceType as AudienceType | null,
    intakeAnswers: data.answers,
    edgeCase: result.edge_case,
    status: ProjectStatus.draft,
  };

  let project;
  if (data.draftId) {
    project = await prisma.project.update({
      where: { id: data.draftId },
      data: draftPayload,
    });
  } else {
    project = await prisma.project.create({
      data: draftPayload,
    });
  }

  revalidatePath("/my-projects");
  return { ok: true, projectId: project.id };
}

export async function submitWizardAction(input: WizardSubmitInput) {
  const user = await requireUser();
  const parsed = wizardSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.errors[0]?.message ?? "Form invalid.",
    };
  }
  const data = parsed.data;

  if (!data.acknowledged) {
    return { ok: false, error: "Acknowledgment is required to submit." };
  }

  const result = classify(data.answers as ClassifyAnswers);
  if (result.edge_case === "PLATFORM_FEATURE_WORK") {
    return {
      ok: false,
      error:
        "This use case requires platform feature work and can't be submitted as a citizen build.",
    };
  }

  // Determine which sponsor to attach.
  let executiveSponsorId: string | null = null;
  if (data.audienceType) {
    const sponsor = await prisma.sponsor.findFirst({
      where: {
        audienceType: data.audienceType as AudienceType,
        isActive: true,
      },
    });
    executiveSponsorId = sponsor?.id ?? null;
  }

  // Tier-specific initial status (PRD §2.5).
  const tier = result.tier;
  const initialStatus =
    tier === "personal"
      ? ProjectStatus.acknowledged // skip review entirely
      : ProjectStatus.submitted;

  const payload = {
    name: data.metadata.name,
    description: data.metadata.description ?? null,
    problemStatement: data.metadata.problemStatement ?? null,
    expectedUsers: data.metadata.expectedUsers ?? null,
    scopingDocsUrl: data.metadata.scopingDocsUrl || null,
    intendedStartDate: data.metadata.intendedStartDate
      ? new Date(data.metadata.intendedStartDate)
      : null,
    builderUserId: user.id,
    tier: tier as Tier | null,
    productOwnerDeptId: data.productOwnerDeptId,
    audienceType: data.audienceType as AudienceType | null,
    executiveSponsorId,
    intakeAnswers: data.answers,
    edgeCase: result.edge_case,
    status: initialStatus,
    submittedAt: new Date(),
  };

  let project;
  if (data.draftId) {
    project = await prisma.project.update({
      where: { id: data.draftId },
      data: payload,
    });
  } else {
    project = await prisma.project.create({ data: payload });
  }

  // Initial milestone (PRD §6.1 Milestone enum)
  await prisma.milestone.create({
    data: {
      projectId: project.id,
      type:
        tier === "personal"
          ? MilestoneType.approved // personal projects skip review
          : MilestoneType.submitted,
      completedAt: new Date(),
      notes:
        tier === "personal"
          ? "Personal-tier acknowledged — skips PX review per PRD §2.5."
          : "Project submitted to PX for review.",
    },
  });

  await writeAuditLog({
    projectId: project.id,
    actorUserId: user.id,
    action: "project_submitted",
    after: { status: initialStatus, tier, edge_case: result.edge_case },
  });

  // Notify PX admins that there's a new submission to triage.
  if (tier !== "personal") {
    const pxAdmins = await prisma.user.findMany({
      where: { role: "px_admin" },
    });
    for (const admin of pxAdmins) {
      await sendNotification({
        userId: admin.id,
        kind: "submission_received",
        title: `New ${tier ?? "unclassified"} project: ${project.name}`,
        body: `${user.name} submitted "${project.name}" for PX review.`,
        projectId: project.id,
      });
    }
  } else {
    await sendNotification({
      userId: user.id,
      kind: "classification_approved",
      title: `${project.name} acknowledged`,
      body: "Personal-tier projects skip PX review and are immediately active.",
      projectId: project.id,
    });
  }

  revalidatePath("/registry");
  revalidatePath("/my-projects");
  redirect(`/projects/${project.id}`);
}
