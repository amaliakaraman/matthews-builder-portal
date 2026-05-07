"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";

export async function getMyNotifications(limit = 20) {
  const user = await requireUser();
  return prisma.notification.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

export async function markNotificationsReadAction() {
  const user = await requireUser();
  await prisma.notification.updateMany({
    where: { userId: user.id, readAt: null },
    data: { readAt: new Date() },
  });
  revalidatePath("/(app)", "layout");
  return { ok: true };
}
