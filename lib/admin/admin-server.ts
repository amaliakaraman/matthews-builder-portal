"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { AudienceType, UserRole } from "@/lib/db/types";

const deptSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1).max(80),
  coreJobsDescription: z.string().max(500).optional().nullable(),
  isActive: z.boolean().optional(),
});

export async function upsertDepartmentAction(
  input: z.infer<typeof deptSchema>
) {
  await requireAdmin();
  const parsed = deptSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid input." };
  if (parsed.data.id) {
    await prisma.department.update({
      where: { id: parsed.data.id },
      data: {
        name: parsed.data.name,
        coreJobsDescription: parsed.data.coreJobsDescription ?? null,
        isActive: parsed.data.isActive ?? true,
      },
    });
  } else {
    await prisma.department.create({
      data: {
        name: parsed.data.name,
        coreJobsDescription: parsed.data.coreJobsDescription ?? null,
        isActive: parsed.data.isActive ?? true,
      },
    });
  }
  revalidatePath("/departments");
  return { ok: true };
}

export async function toggleDepartmentActiveAction(input: {
  id: string;
  isActive: boolean;
}) {
  await requireAdmin();
  await prisma.department.update({
    where: { id: input.id },
    data: { isActive: input.isActive },
  });
  revalidatePath("/departments");
  return { ok: true };
}

const sponsorSchema = z.object({
  id: z.string().uuid().optional(),
  email: z.string().email(),
  name: z.string().min(1),
  audienceType: z.enum([
    "agents",
    "market_leaders",
    "financiers",
    "marketers",
    "sales_ops",
  ]),
  isActive: z.boolean().optional(),
});

export async function upsertSponsorAction(
  input: z.infer<typeof sponsorSchema>
) {
  await requireAdmin();
  const parsed = sponsorSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid input." };

  // Find or create the underlying user with role=sponsor.
  let user = await prisma.user.findUnique({
    where: { email: parsed.data.email },
  });
  if (!user) {
    user = await prisma.user.create({
      data: {
        email: parsed.data.email,
        name: parsed.data.name,
        role: UserRole.sponsor,
      },
    });
  } else if (user.role !== "sponsor") {
    user = await prisma.user.update({
      where: { id: user.id },
      data: { role: UserRole.sponsor, name: parsed.data.name },
    });
  }

  if (parsed.data.id) {
    await prisma.sponsor.update({
      where: { id: parsed.data.id },
      data: {
        userId: user.id,
        audienceType: parsed.data.audienceType as AudienceType,
        isActive: parsed.data.isActive ?? true,
      },
    });
  } else {
    await prisma.sponsor.upsert({
      where: { userId: user.id },
      update: {
        audienceType: parsed.data.audienceType as AudienceType,
        isActive: parsed.data.isActive ?? true,
      },
      create: {
        userId: user.id,
        audienceType: parsed.data.audienceType as AudienceType,
        isActive: parsed.data.isActive ?? true,
      },
    });
  }

  revalidatePath("/sponsors");
  return { ok: true };
}

export async function toggleSponsorActiveAction(input: {
  id: string;
  isActive: boolean;
}) {
  await requireAdmin();
  await prisma.sponsor.update({
    where: { id: input.id },
    data: { isActive: input.isActive },
  });
  revalidatePath("/sponsors");
  return { ok: true };
}
