"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { transitionStatusAction } from "@/lib/projects/project-server";
import type { ProjectViewModel } from "./project-detail";
import { titleCase } from "@/lib/utils";

const NEXT_STATUSES_BY_TIER: Record<string, string[]> = {
  personal: ["acknowledged", "active", "archived"],
  consumer: [
    "submitted",
    "under_px_review",
    "approved",
    "needs_revision",
    "in_build",
    "mvp_ready",
    "in_test",
    "px_signoff",
    "deployed",
    "active",
    "rejected",
    "archived",
  ],
  contributor: [
    "submitted",
    "under_px_review",
    "eng_alignment",
    "approved",
    "needs_revision",
    "in_build",
    "mvp_ready",
    "in_test",
    "px_signoff",
    "deployed",
    "active",
    "rejected",
    "archived",
  ],
};

interface Props {
  project: ProjectViewModel;
}

export function StatusActions({ project }: Props) {
  const [status, setStatus] = useState<string>(project.status);
  const [reason, setReason] = useState("");
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const allowed =
    (project.tier && NEXT_STATUSES_BY_TIER[project.tier]) ??
    NEXT_STATUSES_BY_TIER.contributor;

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    start(async () => {
      const res = await transitionStatusAction({
        projectId: project.id,
        status: status as
          | "draft"
          | "submitted"
          | "under_px_review"
          | "eng_alignment"
          | "approved"
          | "in_build"
          | "mvp_ready"
          | "in_test"
          | "px_signoff"
          | "deployed"
          | "active"
          | "acknowledged"
          | "needs_revision"
          | "rejected"
          | "archived",
        reason: reason || undefined,
      });
      if (!res?.ok) setError(res?.error ?? "Could not change status.");
      else setReason("");
    });
  };

  return (
    <form
      onSubmit={onSubmit}
      className="rounded-[var(--radius-matthews)] border border-matthews-deep/10 p-4 space-y-3"
    >
      <h3 className="text-xs uppercase tracking-[0.14em] text-matthews-deep/55">
        Change status (PX admin)
      </h3>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Next status</Label>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {allowed.map((s) => (
                <SelectItem key={s} value={s}>
                  {titleCase(s)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Note (optional)</Label>
          <Textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="What changed?"
            rows={2}
          />
        </div>
      </div>
      {error ? (
        <p className="text-sm text-[var(--color-danger)]">{error}</p>
      ) : null}
      <div className="flex justify-end">
        <Button type="submit" size="sm" disabled={pending || status === project.status}>
          {pending ? "Saving…" : "Apply status"}
        </Button>
      </div>
    </form>
  );
}
