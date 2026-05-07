"use client";

import { useState, useTransition } from "react";
import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AUDIENCE_LABELS } from "@/lib/db/types";
import { overrideClassificationAction } from "@/lib/projects/project-server";
import type { ProjectViewModel } from "./project-detail";

interface Props {
  project: ProjectViewModel;
  departments: Array<{ id: string; name: string }>;
}

const TIERS = [
  { value: "personal", label: "Tier 1 · Personal" },
  { value: "consumer", label: "Tier 2 · Consumer" },
  { value: "contributor", label: "Tier 3 · Contributor" },
];

export function OverrideDialog({ project, departments }: Props) {
  const [open, setOpen] = useState(false);
  const [tier, setTier] = useState<string | null>(project.tier);
  const [dept, setDept] = useState<string | null>(project.productOwnerDeptId);
  const [audience, setAudience] = useState<string | null>(project.audienceType);
  const [reason, setReason] = useState("");
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    start(async () => {
      const res = await overrideClassificationAction({
        projectId: project.id,
        tier: tier as "personal" | "consumer" | "contributor" | null,
        productOwnerDeptId: dept,
        audienceType: audience as
          | "agents"
          | "market_leaders"
          | "financiers"
          | "marketers"
          | "sales_ops"
          | null,
        reason,
      });
      if (res?.ok) setOpen(false);
      else setError(res?.error ?? "Could not save override.");
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outlineDark" size="sm" className="w-full">
          <Pencil className="h-3.5 w-3.5" strokeWidth={1.5} />
          Override classification
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Override classification</DialogTitle>
          <DialogDescription>
            All overrides are logged with actor, timestamp, before/after, and
            reason. The builder is notified by email.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Tier</Label>
            <Select
              value={tier ?? "unclassified"}
              onValueChange={(v) => setTier(v === "unclassified" ? null : v)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="unclassified">Unclassified</SelectItem>
                {TIERS.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Product Owner</Label>
            <Select
              value={dept ?? "none"}
              onValueChange={(v) => setDept(v === "none" ? null : v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {departments.map((d) => (
                  <SelectItem key={d.id} value={d.id}>
                    {d.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Executive Sponsor (audience)</Label>
            <Select
              value={audience ?? "none"}
              onValueChange={(v) =>
                setAudience(v === "none" ? null : v)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {Object.entries(AUDIENCE_LABELS).map(([k, label]) => (
                  <SelectItem key={k} value={k}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="reason">Reason (required)</Label>
            <Textarea
              id="reason"
              required
              minLength={5}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Audience extends to other departments — moving from Consumer to Contributor."
            />
          </div>
          {error ? (
            <p className="text-sm text-[var(--color-danger)]">{error}</p>
          ) : null}
          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setOpen(false)}
              disabled={pending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? "Saving…" : "Save override"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
