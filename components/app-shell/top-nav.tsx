"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { BrandLogo } from "@/components/brand/brand-logo";
import {
  NotificationBell,
  type BellNotification,
} from "@/components/app-shell/notification-bell";
import type { CurrentUser } from "@/lib/auth/session";

interface TopNavProps {
  user: CurrentUser;
  notifications: BellNotification[];
}

export function TopNav({ user, notifications }: TopNavProps) {
  const pathname = usePathname();
  const isAdmin = user.role === "px_admin";
  const isSponsor = user.role === "sponsor";

  const builderLinks = [
    { href: "/registry", label: "Registry" },
    { href: "/my-projects", label: "My Projects" },
    { href: "/register", label: "Register" },
  ];
  const adminLinks = [
    { href: "/triage", label: "Triage" },
    { href: "/portfolio", label: "Portfolio" },
    { href: "/sponsors", label: "Sponsors" },
    { href: "/departments", label: "Departments" },
    { href: "/wrike-import", label: "Wrike" },
    { href: "/audit-log", label: "Audit log" },
  ];
  const sponsorLinks = [{ href: "/sign-off", label: "Sign-off queue" }];

  return (
    <header className="sticky top-0 z-40 surface-deep border-b border-white/10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex h-16 items-center justify-between gap-4">
        <Link
          href="/registry"
          className="flex items-center gap-3 hover:opacity-90"
        >
          <BrandLogo variant="white" />
        </Link>
        <nav className="hidden md:flex items-center gap-1">
          {builderLinks.map((l) => (
            <NavItem key={l.href} {...l} active={pathname.startsWith(l.href)} />
          ))}
          {isAdmin
            ? adminLinks.map((l) => (
                <NavItem
                  key={l.href}
                  {...l}
                  active={pathname.startsWith(l.href)}
                />
              ))
            : null}
          {isSponsor
            ? sponsorLinks.map((l) => (
                <NavItem
                  key={l.href}
                  {...l}
                  active={pathname.startsWith(l.href)}
                />
              ))
            : null}
        </nav>
        <div className="flex items-center gap-3">
          <NotificationBell notifications={notifications} />
          <div className="hidden sm:flex flex-col items-end leading-tight">
            <span className="text-xs text-white">{user.name}</span>
            <span className="text-[10px] uppercase tracking-[0.12em] text-platinum/70">
              {user.role.replace("_", " ")}
            </span>
          </div>
          <form action="/auth/signout" method="post">
            <button
              type="submit"
              className="text-xs text-platinum/70 hover:text-white"
            >
              Sign out
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}

function NavItem({
  href,
  label,
  active,
}: {
  href: string;
  label: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "px-3 py-2 rounded-[var(--radius-matthews)] text-sm transition-colors",
        active
          ? "bg-electric-dark/20 text-white"
          : "text-platinum/80 hover:text-white hover:bg-white/5"
      )}
    >
      {label}
    </Link>
  );
}
