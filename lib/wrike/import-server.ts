"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { writeAuditLog } from "@/lib/audit/write";
import { getWrikeClient } from "./client";
import { ProjectStatus } from "@/lib/db/types";

const importSchema = z.object({
  mode: z.enum(["project", "folder"]),
  wrikeId: z.string().min(1),
});

export async function importFromWrikeAction(
  input: z.infer<typeof importSchema>
) {
  const admin = await requireAdmin();
  const parsed = importSchema.safeParse(input);
  if (!parsed.success)
    return { ok: false, error: parsed.error.errors[0]?.message };

  const wrike = getWrikeClient();
  const tasks =
    parsed.data.mode === "project"
      ? [await wrike.getProject(parsed.data.wrikeId)]
      : await wrike.listFolder(parsed.data.wrikeId);

  let imported = 0;
  let skipped = 0;
  for (const t of tasks) {
    if (!t) {
      skipped++;
      continue;
    }
    const existing = await prisma.project.findUnique({
      where: { wrikeId: t.id },
    });
    if (existing) {
      skipped++;
      continue;
    }
    const project = await prisma.project.create({
      data: {
        name: t.title,
        description: t.description,
        builderUserId: admin.id,
        status: ProjectStatus.draft,
        wrikeId: t.id,
        needsClassification: true,
        scopingDocsUrl: t.url,
      },
    });
    await writeAuditLog({
      projectId: project.id,
      actorUserId: admin.id,
      action: "imported_from_wrike",
      after: { wrikeId: t.id, source: "wrike" },
    });
    imported++;
  }

  revalidatePath("/wrike-import");
  revalidatePath("/registry");
  return { ok: true, imported, skipped };
}
