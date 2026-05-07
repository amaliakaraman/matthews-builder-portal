"use client";

import { Bell } from "lucide-react";
import Link from "next/link";
import { useState, useTransition } from "react";
import { cn, formatRelative } from "@/lib/utils";
import { markNotificationsReadAction } from "@/lib/notifications/notifications-server";

export interface BellNotification {
  id: string;
  title: string;
  body: string | null;
  projectId: string | null;
  readAt: string | null;
  createdAt: string;
  kind: string;
}

export function NotificationBell({
  notifications,
}: {
  notifications: BellNotification[];
}) {
  const [open, setOpen] = useState(false);
  const [, start] = useTransition();
  const unread = notifications.filter((n) => !n.readAt).length;

  const onOpen = () => {
    setOpen((o) => {
      const next = !o;
      if (next && unread > 0) {
        start(async () => {
          await markNotificationsReadAction();
        });
      }
      return next;
    });
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={onOpen}
        className="relative h-9 w-9 grid place-items-center rounded-[var(--radius-matthews)] hover:bg-white/5 text-platinum/80 hover:text-white"
        aria-label="Notifications"
      >
        <Bell className="h-4 w-4" strokeWidth={1.5} />
        {unread > 0 ? (
          <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-electric-dark" />
        ) : null}
      </button>
      {open ? (
        <div
          className="absolute right-0 mt-2 w-80 rounded-[var(--radius-matthews)] bg-white text-matthews-deep shadow-xl border border-matthews-deep/10 z-50"
          onMouseLeave={() => setOpen(false)}
        >
          <div className="p-3 border-b border-matthews-deep/10 flex items-center justify-between">
            <h4 className="text-xs uppercase tracking-[0.14em] text-matthews-deep/55">
              Notifications
            </h4>
            <span className="text-[10px] text-matthews-deep/45">
              {notifications.length}
            </span>
          </div>
          <ul className="max-h-80 overflow-y-auto divide-y divide-matthews-deep/10">
            {notifications.length === 0 ? (
              <li className="p-4 text-sm text-matthews-deep/60">
                Nothing new.
              </li>
            ) : (
              notifications.map((n) => (
                <li
                  key={n.id}
                  className={cn(
                    "p-3",
                    !n.readAt && "bg-electric-light/5"
                  )}
                >
                  <Link
                    href={n.projectId ? `/projects/${n.projectId}` : "/registry"}
                    onClick={() => setOpen(false)}
                    className="block"
                  >
                    <p className="text-sm font-medium leading-tight">
                      {n.title}
                    </p>
                    {n.body ? (
                      <p className="mt-1 text-xs text-matthews-deep/65 line-clamp-2">
                        {n.body}
                      </p>
                    ) : null}
                    <p className="mt-1 text-[10px] text-matthews-deep/50">
                      {formatRelative(n.createdAt)}
                    </p>
                  </Link>
                </li>
              ))
            )}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
