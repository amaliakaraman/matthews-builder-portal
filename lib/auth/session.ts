import { redirect } from "next/navigation";
import { cache } from "react";
import { prisma } from "@/lib/db/prisma";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { UserRole } from "@/lib/db/types";

export type CurrentUser = {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  departmentId: string | null;
};

/**
 * Resolve the current user by joining the Supabase Auth session against our
 * own User table (which carries the role + department). Cached per request.
 *
 * On first sign-in we may need to create the User row. We do that lazily
 * here so a magic-link user has a portal record without an explicit
 * "complete signup" step.
 */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  let authUser: { id: string; email: string | null; user_metadata?: Record<string, unknown> } | null = null;

  try {
    const supabase = await createSupabaseServerClient();
    const { data } = await supabase.auth.getUser();
    if (!data.user) return null;
    authUser = {
      id: data.user.id,
      email: data.user.email ?? null,
      user_metadata: data.user.user_metadata,
    };
  } catch {
    // Supabase env not configured — fall through.
    return null;
  }

  if (!authUser?.email) return null;

  // Look up portal record by email; create on first sign-in.
  let portalUser = await prisma.user.findUnique({
    where: { email: authUser.email },
  });
  if (!portalUser) {
    const fallbackName =
      (authUser.user_metadata?.full_name as string | undefined) ??
      (authUser.user_metadata?.name as string | undefined) ??
      authUser.email.split("@")[0];
    portalUser = await prisma.user.create({
      data: {
        email: authUser.email,
        name: fallbackName,
        role: "builder",
      },
    });
  }

  return {
    id: portalUser.id,
    email: portalUser.email,
    name: portalUser.name,
    role: portalUser.role,
    departmentId: portalUser.departmentId,
  };
});

export async function requireUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

export async function requireRole(
  roles: UserRole[]
): Promise<CurrentUser> {
  const user = await requireUser();
  if (!roles.includes(user.role)) redirect("/registry");
  return user;
}

export async function requireAdmin(): Promise<CurrentUser> {
  return requireRole(["px_admin"]);
}

export function canManage(role: UserRole): boolean {
  return role === "px_admin";
}
