import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProjectDetail } from "@/components/project/project-detail";
import { getProjectById } from "@/lib/db/queries";
import { prisma } from "@/lib/db/prisma";
import { requireUser } from "@/lib/auth/session";
import { getDepartments } from "@/lib/db/queries";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const project = await getProjectById(id);
  return { title: project?.name ?? "Project" };
}

export default async function ProjectDetailPage({ params }: PageProps) {
  const { id } = await params;
  const [user, project, departments] = await Promise.all([
    requireUser(),
    getProjectById(id),
    getDepartments(),
  ]);
  if (!project) notFound();

  // Available users for assignment (PX admin only sees the picker)
  const assignableUsers =
    user.role === "px_admin"
      ? await prisma.user.findMany({
          where: { role: { in: ["px_admin", "builder", "sponsor"] } },
          orderBy: { name: "asc" },
        })
      : [];

  return (
    <ProjectDetail
      currentUser={user}
      project={{
        id: project.id,
        name: project.name,
        description: project.description,
        problemStatement: project.problemStatement,
        expectedUsers: project.expectedUsers,
        scopingDocsUrl: project.scopingDocsUrl,
        intendedStartDate: project.intendedStartDate?.toISOString() ?? null,
        tier: project.tier,
        status: project.status,
        edgeCase: project.edgeCase,
        productOwnerDeptId: project.productOwnerDeptId,
        productOwnerDeptName: project.productOwnerDept?.name ?? null,
        audienceType: project.audienceType,
        executiveSponsorName: project.executiveSponsor?.user.name ?? null,
        builderUserId: project.builderUserId,
        builderName: project.builder.name,
        databaseUrl: project.databaseUrl,
        endpointUrl: project.endpointUrl,
        wrikeId: project.wrikeId,
        createdAt: project.createdAt.toISOString(),
        updatedAt: project.updatedAt.toISOString(),
        submittedAt: project.submittedAt?.toISOString() ?? null,
      }}
      milestones={project.milestones.map((m) => ({
        id: m.id,
        type: m.type,
        completedAt: m.completedAt?.toISOString() ?? null,
        notes: m.notes,
        createdAt: m.createdAt.toISOString(),
      }))}
      assignments={project.assignments.map((a) => ({
        id: a.id,
        role: a.role,
        userId: a.userId,
        userName: a.user.name,
        userEmail: a.user.email,
      }))}
      comments={project.comments.map((c) => ({
        id: c.id,
        body: c.body,
        authorName: c.author.name,
        createdAt: c.createdAt.toISOString(),
      }))}
      auditLog={project.auditLogEntries.map((e) => ({
        id: e.id,
        action: e.action,
        actorName: e.actor.name,
        before: e.before as object | null,
        after: e.after as object | null,
        reason: e.reason,
        createdAt: e.createdAt.toISOString(),
      }))}
      provisioningRequests={project.provisioningRequests.map((r) => ({
        id: r.id,
        status: r.status,
        databaseUrl: r.databaseUrl,
        endpointUrl: r.endpointUrl,
        notes: r.notes,
        requestedAt: r.requestedAt.toISOString(),
        fulfilledAt: r.fulfilledAt?.toISOString() ?? null,
      }))}
      departments={departments.map((d) => ({ id: d.id, name: d.name }))}
      assignableUsers={assignableUsers.map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
      }))}
    />
  );
}
