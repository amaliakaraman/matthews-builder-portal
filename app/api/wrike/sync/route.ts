import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getWrikeClient } from "@/lib/wrike/client";

/**
 * Scheduled Wrike sync. Configure as a Vercel Cron (or any scheduler that
 * can hit this URL daily). It walks the configured Wrike folder(s) and
 * upserts portal projects flagged needs_classification = true.
 *
 * Auth: requires header `x-cron-secret: <CRON_SECRET>` to prevent open
 * invocation.
 */
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const provided = request.headers.get("x-cron-secret");
  if (secret && provided !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const folderId = process.env.WRIKE_SYNC_FOLDER_ID;
  if (!folderId) {
    return NextResponse.json({
      ok: true,
      skipped: true,
      reason: "WRIKE_SYNC_FOLDER_ID not set.",
    });
  }

  const wrike = getWrikeClient();
  const tasks = await wrike.listFolder(folderId);

  let imported = 0;
  let updated = 0;
  for (const t of tasks) {
    const existing = await prisma.project.findUnique({
      where: { wrikeId: t.id },
    });
    if (!existing) {
      // Find a system PX admin to attribute import to.
      const admin = await prisma.user.findFirst({ where: { role: "px_admin" } });
      if (!admin) continue;
      await prisma.project.create({
        data: {
          name: t.title,
          description: t.description,
          builderUserId: admin.id,
          status: "draft",
          wrikeId: t.id,
          needsClassification: true,
          scopingDocsUrl: t.url,
        },
      });
      imported++;
    } else if (
      existing.name !== t.title ||
      existing.description !== t.description
    ) {
      await prisma.project.update({
        where: { id: existing.id },
        data: { name: t.title, description: t.description },
      });
      updated++;
    }
  }

  return NextResponse.json({
    ok: true,
    folderId,
    imported,
    updated,
    total: tasks.length,
  });
}
