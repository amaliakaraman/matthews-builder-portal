"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { StatusChip } from "@/components/brand/status-chip";
import { fulfillProvisioningAction } from "@/lib/projects/project-server";
import { formatRelative } from "@/lib/utils";
import type { ProjectViewModel } from "./project-detail";

interface Props {
  project: ProjectViewModel;
  requests: Array<{
    id: string;
    status: string;
    databaseUrl: string | null;
    endpointUrl: string | null;
    notes: string | null;
    requestedAt: string;
    fulfilledAt: string | null;
  }>;
  isAdmin: boolean;
}

export function ProvisioningPanel({ project, requests, isAdmin }: Props) {
  const pending = requests.find((r) => r.status === "pending");
  const [dbUrl, setDbUrl] = useState("");
  const [endpoint, setEndpoint] = useState("");
  const [notes, setNotes] = useState("");
  const [busy, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  if (requests.length === 0 && !project.databaseUrl && !project.endpointUrl) {
    return (
      <div className="rounded-[var(--radius-matthews)] bg-platinum p-4 text-sm">
        <h4 className="text-xs uppercase tracking-[0.14em] text-matthews-deep/55 mb-2">
          Provisioning
        </h4>
        <p className="text-matthews-deep/60">
          A database + endpoint will be provisioned automatically once this
          project is approved.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-[var(--radius-matthews)] bg-platinum p-4 space-y-3 text-sm">
      <h4 className="text-xs uppercase tracking-[0.14em] text-matthews-deep/55">
        Provisioning
      </h4>
      {project.databaseUrl && project.endpointUrl ? (
        <div className="space-y-1 text-xs">
          <p>
            <span className="text-matthews-deep/55">DB:</span>{" "}
            <code className="break-all">{project.databaseUrl}</code>
          </p>
          <p>
            <span className="text-matthews-deep/55">Endpoint:</span>{" "}
            <code className="break-all">{project.endpointUrl}</code>
          </p>
        </div>
      ) : null}

      {pending ? (
        <div className="rounded-[var(--radius-matthews)] bg-white p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-medium">Request</span>
            <StatusChip variant="warning">Pending</StatusChip>
          </div>
          <p className="text-xs text-matthews-deep/60">
            Requested {formatRelative(pending.requestedAt)}.{" "}
            {pending.notes ? `· ${pending.notes}` : ""}
          </p>
          {isAdmin ? (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                setError(null);
                start(async () => {
                  const res = await fulfillProvisioningAction({
                    requestId: pending.id,
                    databaseUrl: dbUrl,
                    endpointUrl: endpoint,
                    notes: notes || undefined,
                  });
                  if (!res?.ok)
                    setError(res?.error ?? "Could not save fulfillment.");
                });
              }}
              className="space-y-2 pt-2 border-t border-matthews-deep/10"
            >
              <div>
                <Label>Database URL</Label>
                <Input
                  required
                  value={dbUrl}
                  onChange={(e) => setDbUrl(e.target.value)}
                  placeholder="postgres://…"
                />
              </div>
              <div>
                <Label>Endpoint URL</Label>
                <Input
                  required
                  value={endpoint}
                  onChange={(e) => setEndpoint(e.target.value)}
                  placeholder="https://…"
                />
              </div>
              <div>
                <Label>Notes</Label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                />
              </div>
              {error ? (
                <p className="text-xs text-[var(--color-danger)]">{error}</p>
              ) : null}
              <Button type="submit" size="sm" disabled={busy} className="w-full">
                {busy ? "Saving…" : "Mark provisioned"}
              </Button>
            </form>
          ) : null}
        </div>
      ) : null}

      {requests
        .filter((r) => r.status !== "pending")
        .slice(0, 1)
        .map((r) => (
          <div
            key={r.id}
            className="rounded-[var(--radius-matthews)] bg-white p-3 text-xs"
          >
            <div className="flex items-center justify-between">
              <span className="font-medium">Provisioned</span>
              <StatusChip variant="success">Ready</StatusChip>
            </div>
            <p className="mt-1 text-matthews-deep/60">
              {r.fulfilledAt ? formatRelative(r.fulfilledAt) : ""}
            </p>
          </div>
        ))}
    </div>
  );
}
