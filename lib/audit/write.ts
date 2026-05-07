import { prisma } from "@/lib/db/prisma";
import type { Prisma } from "@prisma/client";

export interface WriteAuditLogInput {
  projectId: string;
  actorUserId: string;
  action: string;
  before?: Prisma.InputJsonValue;
  after?: Prisma.InputJsonValue;
  /** Required for overrides; the UI enforces the requirement. */
  reason?: string;
}

export async function writeAuditLog(entry: WriteAuditLogInput) {
  return prisma.auditLogEntry.create({
    data: {
      projectId: entry.projectId,
      actorUserId: entry.actorUserId,
      action: entry.action,
      before: entry.before,
      after: entry.after,
      reason: entry.reason,
    },
  });
}
