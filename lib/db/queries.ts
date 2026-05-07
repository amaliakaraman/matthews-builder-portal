import { prisma } from "./prisma";

export async function getDepartments() {
  return prisma.department.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
  });
}

export async function getSponsors() {
  return prisma.sponsor.findMany({
    where: { isActive: true },
    include: { user: true },
    orderBy: { audienceType: "asc" },
  });
}

export async function getSponsorByAudience(audience: string) {
  return prisma.sponsor.findFirst({
    where: {
      audienceType: audience as never,
      isActive: true,
    },
    include: { user: true },
  });
}

export async function getProjects(filters?: {
  tier?: string;
  status?: string;
  productOwnerDeptId?: string;
  sponsorId?: string;
  q?: string;
  builderUserId?: string;
}) {
  return prisma.project.findMany({
    where: {
      ...(filters?.tier ? { tier: filters.tier as never } : {}),
      ...(filters?.status ? { status: filters.status as never } : {}),
      ...(filters?.productOwnerDeptId
        ? { productOwnerDeptId: filters.productOwnerDeptId }
        : {}),
      ...(filters?.sponsorId ? { executiveSponsorId: filters.sponsorId } : {}),
      ...(filters?.builderUserId
        ? { builderUserId: filters.builderUserId }
        : {}),
      ...(filters?.q
        ? {
            OR: [
              { name: { contains: filters.q, mode: "insensitive" } },
              { description: { contains: filters.q, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    include: {
      builder: true,
      productOwnerDept: true,
      executiveSponsor: { include: { user: true } },
    },
    orderBy: { updatedAt: "desc" },
  });
}

export async function getProjectById(id: string) {
  return prisma.project.findUnique({
    where: { id },
    include: {
      builder: true,
      productOwnerDept: true,
      executiveSponsor: { include: { user: true } },
      milestones: { orderBy: { createdAt: "asc" } },
      assignments: { include: { user: true } },
      comments: {
        include: { author: true },
        orderBy: { createdAt: "asc" },
      },
      auditLogEntries: {
        include: { actor: true },
        orderBy: { createdAt: "desc" },
      },
      provisioningRequests: { orderBy: { requestedAt: "desc" } },
    },
  });
}

export async function getTriageQueue() {
  return prisma.project.findMany({
    where: {
      status: { in: ["submitted", "under_px_review", "needs_revision"] },
    },
    include: {
      builder: true,
      productOwnerDept: true,
      executiveSponsor: { include: { user: true } },
    },
    orderBy: [{ tier: "asc" }, { submittedAt: "asc" }],
  });
}
