"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { writeAuditLog } from "@/lib/audit/write";
import { sendNotification } from "@/lib/email/send";
import { ProjectStatus, MilestoneType } from "@/lib/db/types";

const bulkSchema = z.object({
  projectIds: z.array(z.string().uuid()).min(1),
  action: z.enum(["approve", "request_revision", "reject", "start_review"]),
  reason: z.string().optional(),
});

export async function bulkTriageAction(input: z.infer<typeof bulkSchema>) {
  const admin = await requireAdmin();
  const parsed = bulkSchema.safeParse(input);
  if (!parsed.success)
    return { ok: false, error: parsed.error.errors[0]?.message };

  const targetStatus =
    parsed.data.action === "approve"
      ? ProjectStatus.approved
      : parsed.data.action === "request_revision"
        ? ProjectStatus.needs_revision
        : parsed.data.action === "reject"
          ? ProjectStatus.rejected
          : ProjectStatus.under_px_review;

  for (const id of parsed.data.projectIds) {
    const project = await prisma.project.findUnique({ where: { id } });
    if (!project) continue;
    const before = { status: project.status };
    await prisma.project.update({
      where: { id },
      data: { status: targetStatus },
    });

    if (parsed.data.action === "approve") {
      await prisma.milestone.create({
        data: {
          projectId: id,
          type: MilestoneType.approved,
          completedAt: new Date(),
          notes: parsed.data.reason ?? "Approved via bulk triage.",
        },
      });

      // Provisioning hook for Consumer tier
      if (project.tier === "consumer") {
        await prisma.provisioningRequest.create({
          data: {
            projectId: id,
            notes: "Auto-fired on Consumer-tier approval (bulk triage).",
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
            projectId: id,
          });
        }
      }
    }

    await writeAuditLog({
      projectId: id,
      actorUserId: admin.id,
      action: `bulk_${parsed.data.action}`,
      before,
      after: { status: targetStatus },
      reason: parsed.data.reason,
    });

    await sendNotification({
      userId: project.builderUserId,
      kind:
        parsed.data.action === "approve"
          ? "classification_approved"
          : "status_changed",
      title: `${project.name}: ${targetStatus.replace(/_/g, " ")}`,
      body: parsed.data.reason ?? undefined,
      projectId: id,
    });
  }

  revalidatePath("/triage");
  revalidatePath("/registry");
  return { ok: true, count: parsed.data.projectIds.length };
}
