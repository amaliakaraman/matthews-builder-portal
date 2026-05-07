"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser, requireAdmin } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { writeAuditLog } from "@/lib/audit/write";
import { sendNotification } from "@/lib/email/send";
import {
  AssignmentRole,
  AudienceType,
  MilestoneType,
  ProjectStatus,
  Tier,
} from "@/lib/db/types";

export async function addCommentAction(input: {
  projectId: string;
  body: string;
}) {
  const user = await requireUser();
  if (!input.body.trim()) return { ok: false, error: "Comment is empty." };
  await prisma.comment.create({
    data: {
      projectId: input.projectId,
      authorUserId: user.id,
      body: input.body.trim(),
    },
  });
  // Notify the project's builder if a different person commented.
  const project = await prisma.project.findUnique({
    where: { id: input.projectId },
  });
  if (project && project.builderUserId !== user.id) {
    await sendNotification({
      userId: project.builderUserId,
      kind: "comment_added",
      title: `New comment on ${project.name}`,
      body: `${user.name}: "${input.body.slice(0, 120)}"`,
      projectId: project.id,
    });
  }
  revalidatePath(`/projects/${input.projectId}`);
  return { ok: true };
}

const overrideSchema = z.object({
  projectId: z.string().uuid(),
  tier: z.enum(["personal", "consumer", "contributor"]).nullable(),
  productOwnerDeptId: z.string().uuid().nullable(),
  audienceType: z
    .enum(["agents", "market_leaders", "financiers", "marketers", "sales_ops"])
    .nullable(),
  reason: z.string().min(5, "Provide a reason (min 5 chars) for the override."),
});

export async function overrideClassificationAction(
  input: z.infer<typeof overrideSchema>
) {
  const admin = await requireAdmin();
  const parsed = overrideSchema.safeParse(input);
  if (!parsed.success)
    return {
      ok: false,
      error: parsed.error.errors[0]?.message ?? "Invalid input.",
    };

  const project = await prisma.project.findUnique({
    where: { id: parsed.data.projectId },
  });
  if (!project) return { ok: false, error: "Project not found." };

  const before = {
    tier: project.tier,
    productOwnerDeptId: project.productOwnerDeptId,
    audienceType: project.audienceType,
    executiveSponsorId: project.executiveSponsorId,
  };

  let executiveSponsorId = project.executiveSponsorId;
  if (parsed.data.audienceType !== project.audienceType) {
    const sponsor = parsed.data.audienceType
      ? await prisma.sponsor.findFirst({
          where: {
            audienceType: parsed.data.audienceType as AudienceType,
            isActive: true,
          },
        })
      : null;
    executiveSponsorId = sponsor?.id ?? null;
  }

  const updated = await prisma.project.update({
    where: { id: parsed.data.projectId },
    data: {
      tier: (parsed.data.tier as Tier | null) ?? null,
      productOwnerDeptId: parsed.data.productOwnerDeptId,
      audienceType: parsed.data.audienceType as AudienceType | null,
      executiveSponsorId,
    },
  });

  const after = {
    tier: updated.tier,
    productOwnerDeptId: updated.productOwnerDeptId,
    audienceType: updated.audienceType,
    executiveSponsorId: updated.executiveSponsorId,
  };

  await writeAuditLog({
    projectId: project.id,
    actorUserId: admin.id,
    action: "classification_overridden",
    before,
    after,
    reason: parsed.data.reason,
  });

  await sendNotification({
    userId: project.builderUserId,
    kind: "classification_changed",
    title: `${project.name}: classification updated`,
    body: `PX changed your project's classification. Reason: ${parsed.data.reason}`,
    projectId: project.id,
  });

  revalidatePath(`/projects/${project.id}`);
  return { ok: true };
}

const statusSchema = z.object({
  projectId: z.string().uuid(),
  status: z.enum([
    "draft",
    "submitted",
    "under_px_review",
    "eng_alignment",
    "approved",
    "in_build",
    "mvp_ready",
    "in_test",
    "px_signoff",
    "deployed",
    "active",
    "acknowledged",
    "needs_revision",
    "rejected",
    "archived",
  ]),
  reason: z.string().optional(),
});

const STATUS_TO_MILESTONE: Partial<Record<string, MilestoneType>> = {
  submitted: MilestoneType.submitted,
  under_px_review: MilestoneType.px_review,
  eng_alignment: MilestoneType.eng_alignment,
  approved: MilestoneType.approved,
  mvp_ready: MilestoneType.mvp_ready,
  in_test: MilestoneType.test_started,
  px_signoff: MilestoneType.px_signoff,
  deployed: MilestoneType.deployed,
};

export async function transitionStatusAction(
  input: z.infer<typeof statusSchema>
) {
  const admin = await requireAdmin();
  const parsed = statusSchema.safeParse(input);
  if (!parsed.success)
    return { ok: false, error: parsed.error.errors[0]?.message };

  const project = await prisma.project.findUnique({
    where: { id: parsed.data.projectId },
  });
  if (!project) return { ok: false, error: "Project not found." };

  const before = { status: project.status };

  const updated = await prisma.project.update({
    where: { id: project.id },
    data: { status: parsed.data.status as ProjectStatus },
  });

  const milestoneType = STATUS_TO_MILESTONE[parsed.data.status];
  if (milestoneType) {
    await prisma.milestone.create({
      data: {
        projectId: project.id,
        type: milestoneType,
        completedAt: new Date(),
        notes: parsed.data.reason ?? null,
      },
    });
  }

  await writeAuditLog({
    projectId: project.id,
    actorUserId: admin.id,
    action: "status_changed",
    before,
    after: { status: updated.status },
    reason: parsed.data.reason,
  });

  // Provisioning hook — fire on Consumer-tier approval.
  if (
    parsed.data.status === "approved" &&
    project.tier === "consumer" &&
    project.status !== "approved"
  ) {
    await prisma.provisioningRequest.create({
      data: {
        projectId: project.id,
        notes: "Auto-fired on Consumer-tier approval per PRD §4.3.1.",
      },
    });
    const pxAdmins = await prisma.user.findMany({
      where: { role: "px_admin" },
    });
    for (const a of pxAdmins) {
      await sendNotification({
        userId: a.id,
        kind: "provisioning_requested",
        title: `Provisioning requested: ${project.name}`,
        body: "A Consumer-tier project was approved. A database + endpoint need to be provisioned.",
        projectId: project.id,
      });
    }
  }

  await sendNotification({
    userId: project.builderUserId,
    kind: "status_changed",
    title: `${project.name}: status now ${parsed.data.status.replace(/_/g, " ")}`,
    body: parsed.data.reason ?? undefined,
    projectId: project.id,
  });

  revalidatePath(`/projects/${project.id}`);
  revalidatePath("/triage");
  revalidatePath("/portfolio");
  return { ok: true };
}

const assignSchema = z.object({
  projectId: z.string().uuid(),
  userId: z.string().uuid(),
  role: z.enum(["px_coach", "pm", "design", "eng_coordinator"]),
});

export async function assignResourceAction(
  input: z.infer<typeof assignSchema>
) {
  const admin = await requireAdmin();
  const parsed = assignSchema.safeParse(input);
  if (!parsed.success)
    return { ok: false, error: parsed.error.errors[0]?.message };

  await prisma.assignment.upsert({
    where: {
      projectId_userId_role: {
        projectId: parsed.data.projectId,
        userId: parsed.data.userId,
        role: parsed.data.role as AssignmentRole,
      },
    },
    update: {},
    create: {
      projectId: parsed.data.projectId,
      userId: parsed.data.userId,
      role: parsed.data.role as AssignmentRole,
    },
  });

  await writeAuditLog({
    projectId: parsed.data.projectId,
    actorUserId: admin.id,
    action: "resource_assigned",
    after: { userId: parsed.data.userId, role: parsed.data.role },
  });

  await sendNotification({
    userId: parsed.data.userId,
    kind: "milestone_updated",
    title: "You've been assigned to a project",
    body: `Role: ${parsed.data.role.replace(/_/g, " ")}`,
    projectId: parsed.data.projectId,
  });

  revalidatePath(`/projects/${parsed.data.projectId}`);
  return { ok: true };
}

export async function unassignResourceAction(input: { assignmentId: string }) {
  const admin = await requireAdmin();
  const a = await prisma.assignment.findUnique({
    where: { id: input.assignmentId },
  });
  if (!a) return { ok: false, error: "Assignment not found." };
  await prisma.assignment.delete({ where: { id: input.assignmentId } });
  await writeAuditLog({
    projectId: a.projectId,
    actorUserId: admin.id,
    action: "resource_unassigned",
    before: { userId: a.userId, role: a.role },
  });
  revalidatePath(`/projects/${a.projectId}`);
  return { ok: true };
}

const fulfillSchema = z.object({
  requestId: z.string().uuid(),
  databaseUrl: z.string().min(1),
  endpointUrl: z.string().min(1),
  notes: z.string().optional(),
});

export async function fulfillProvisioningAction(
  input: z.infer<typeof fulfillSchema>
) {
  const admin = await requireAdmin();
  const parsed = fulfillSchema.safeParse(input);
  if (!parsed.success)
    return { ok: false, error: parsed.error.errors[0]?.message };
  const req = await prisma.provisioningRequest.update({
    where: { id: parsed.data.requestId },
    data: {
      status: "ready",
      databaseUrl: parsed.data.databaseUrl,
      endpointUrl: parsed.data.endpointUrl,
      notes: parsed.data.notes,
      fulfilledAt: new Date(),
    },
  });
  await prisma.project.update({
    where: { id: req.projectId },
    data: {
      databaseUrl: parsed.data.databaseUrl,
      endpointUrl: parsed.data.endpointUrl,
    },
  });
  const project = await prisma.project.findUnique({
    where: { id: req.projectId },
  });
  if (project) {
    await sendNotification({
      userId: project.builderUserId,
      kind: "provisioning_requested",
      title: `${project.name}: database and endpoint ready`,
      body: "Your Consumer-tier project has been provisioned. See the project page for connection details.",
      projectId: project.id,
    });
    await writeAuditLog({
      projectId: project.id,
      actorUserId: admin.id,
      action: "provisioning_fulfilled",
      after: { databaseUrl: parsed.data.databaseUrl },
    });
  }
  revalidatePath(`/projects/${req.projectId}`);
  return { ok: true };
}
