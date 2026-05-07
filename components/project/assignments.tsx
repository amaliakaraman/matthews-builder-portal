"use client";

import { useState, useTransition } from "react";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  assignResourceAction,
  unassignResourceAction,
} from "@/lib/projects/project-server";
import type { ProjectViewModel } from "./project-detail";
import { titleCase } from "@/lib/utils";

interface Props {
  project: ProjectViewModel;
  assignments: Array<{
    id: string;
    role: string;
    userId: string;
    userName: string;
    userEmail: string;
  }>;
  assignableUsers: Array<{ id: string; name: string; email: string }>;
  isAdmin: boolean;
}

const ROLES_BY_TIER: Record<string, string[]> = {
  consumer: ["px_coach"],
  contributor: ["pm", "design", "eng_coordinator"],
};

export function Assignments({ project, assignments, assignableUsers, isAdmin }: Props) {
  const allowed: string[] = project.tier
    ? (ROLES_BY_TIER[project.tier] ?? [])
    : [];
  const [role, setRole] = useState<string>(allowed[0] ?? "px_coach");
  const [userId, setUserId] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const onAdd = () => {
    if (!userId) return;
    start(async () => {
      await assignResourceAction({
        projectId: project.id,
        userId,
        role: role as "px_coach" | "pm" | "design" | "eng_coordinator",
      });
      setUserId(null);
    });
  };

  return (
    <div className="rounded-[var(--radius-matthews)] surface-platinum p-4 space-y-3">
      <h4 className="text-xs uppercase tracking-[0.14em] text-matthews-deep/55">
        Assigned people
      </h4>
      {assignments.length === 0 ? (
        <p className="text-sm text-matthews-deep/60">No one assigned yet.</p>
      ) : (
        <ul className="space-y-2">
          {assignments.map((a) => (
            <li
              key={a.id}
              className="flex items-center justify-between gap-2 text-sm"
            >
              <div>
                <span className="block font-medium">{a.userName}</span>
                <span className="text-xs text-matthews-deep/55">
                  {titleCase(a.role)}
                </span>
              </div>
              {isAdmin ? (
                <button
                  type="button"
                  className="text-matthews-deep/50 hover:text-[var(--color-danger)]"
                  onClick={() =>
                    start(async () => {
                      await unassignResourceAction({ assignmentId: a.id });
                    })
                  }
                  aria-label="Remove assignment"
                  disabled={pending}
                >
                  <X className="h-4 w-4" strokeWidth={1.5} />
                </button>
              ) : null}
            </li>
          ))}
        </ul>
      )}

      {isAdmin && allowed.length > 0 ? (
        <div className="space-y-2 pt-3 border-t border-matthews-deep/10">
          <p className="text-xs uppercase tracking-[0.14em] text-matthews-deep/55">
            Add assignment
          </p>
          <Select value={role} onValueChange={setRole}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {allowed.map((r) => (
                <SelectItem key={r} value={r}>
                  {titleCase(r)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={userId ?? undefined}
            onValueChange={(v) => setUserId(v)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Pick a person" />
            </SelectTrigger>
            <SelectContent>
              {assignableUsers.map((u) => (
                <SelectItem key={u.id} value={u.id}>
                  {u.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            size="sm"
            onClick={onAdd}
            disabled={!userId || pending}
            className="w-full"
          >
            <Plus className="h-3.5 w-3.5" strokeWidth={1.5} />
            Assign
          </Button>
        </div>
      ) : null}
    </div>
  );
}
