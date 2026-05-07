import { TopNav } from "@/components/app-shell/top-nav";
import { requireUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();
  const notifications = await prisma.notification.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  return (
    <div className="min-h-screen bg-white text-matthews-deep">
      <TopNav
        user={user}
        notifications={notifications.map((n) => ({
          id: n.id,
          title: n.title,
          body: n.body,
          projectId: n.projectId,
          readAt: n.readAt?.toISOString() ?? null,
          createdAt: n.createdAt.toISOString(),
          kind: n.kind,
        }))}
      />
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
        {children}
      </main>
      <footer className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 text-xs text-matthews-deep/60 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-t border-matthews-deep/10 mt-12">
        <span>Builder Portal · Matthews™ confidential, internal use only.</span>
        <span>Citizen Builder Program · v1</span>
      </footer>
    </div>
  );
}
