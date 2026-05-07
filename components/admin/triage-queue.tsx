"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { DataTable, type Column } from "@/components/brand/data-table";
import {
  ProjectStatusChip,
  StatusChip,
  TierChip,
} from "@/components/brand/status-chip";
import { bulkTriageAction } from "@/lib/projects/triage-server";
import { formatRelative } from "@/lib/utils";

interface Project {
  id: string;
  name: string;
  description: string | null;
  tier: string | null;
  status: string;
  builderName: string;
  ownerDept: string;
  sponsorName: string;
  submittedAt: string | null;
  edgeCase: string | null;
}

export function TriageQueue({ projects }: { projects: Project[] }) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  const allSelected =
    projects.length > 0 && projects.every((p) => selected.has(p.id));

  const toggleAll = () => {
    if (allSelected) setSelected(new Set());
    else setSelected(new Set(projects.map((p) => p.id)));
  };
  const toggleOne = (id: string) => {
    setSelected((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const onBulk = (action: "approve" | "request_revision" | "reject" | "start_review") => {
    const ids = Array.from(selected);
    if (ids.length === 0) return;
    setError(null);
    setStatusMsg(null);
    start(async () => {
      const res = await bulkTriageAction({
        projectIds: ids,
        action,
      });
      if (res?.ok) {
        setSelected(new Set());
        setStatusMsg(`${res.count} project(s) updated.`);
      } else setError(res?.error ?? "Bulk action failed.");
    });
  };

  const columns: Column<Project>[] = useMemo(
    () => [
      {
        key: "select",
        header: (
          <Checkbox
            checked={allSelected}
            onCheckedChange={toggleAll}
            aria-label="Select all"
          />
        ),
        cell: (r) => (
          <Checkbox
            checked={selected.has(r.id)}
            onCheckedChange={() => toggleOne(r.id)}
            aria-label="Select row"
          />
        ),
        align: "left",
        isLeading: true,
      },
      {
        key: "name",
        header: "Project",
        cell: (r) => (
          <div>
            <Link
              href={`/projects/${r.id}`}
              className="font-medium hover:text-electric-light"
            >
              {r.name}
            </Link>
            {r.description ? (
              <p className="text-[8.5pt] opacity-70 line-clamp-1">{r.description}</p>
            ) : null}
            {r.edgeCase ? (
              <p className="mt-1">
                <StatusChip variant="warning">{r.edgeCase}</StatusChip>
              </p>
            ) : null}
          </div>
        ),
        align: "left",
      },
      {
        key: "tier",
        header: "Tier",
        cell: (r) => <TierChip tier={r.tier} />,
      },
      { key: "ownerDept", header: "Owner" },
      { key: "sponsorName", header: "Sponsor" },
      {
        key: "submittedAt",
        header: "Submitted",
        cell: (r) =>
          r.submittedAt ? formatRelative(r.submittedAt) : "—",
      },
      {
        key: "status",
        header: "Status",
        cell: (r) => <ProjectStatusChip status={r.status} />,
      },
    ],
    [allSelected, selected]
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2 text-sm text-platinum/85">
        <span>{selected.size} selected</span>
        <Button
          size="sm"
          variant="primaryDark"
          onClick={() => onBulk("approve")}
          disabled={selected.size === 0 || pending}
        >
          Approve
        </Button>
        <Button
          size="sm"
          variant="outlineDark"
          onClick={() => onBulk("start_review")}
          disabled={selected.size === 0 || pending}
        >
          Move to PX review
        </Button>
        <Button
          size="sm"
          variant="outlineDark"
          onClick={() => onBulk("request_revision")}
          disabled={selected.size === 0 || pending}
        >
          Request revision
        </Button>
        <Button
          size="sm"
          variant="destructive"
          onClick={() => onBulk("reject")}
          disabled={selected.size === 0 || pending}
        >
          Reject
        </Button>
        {error ? (
          <span className="text-[var(--color-danger)] text-xs ml-2">
            {error}
          </span>
        ) : null}
        {statusMsg ? (
          <span className="text-platinum/70 text-xs ml-2">{statusMsg}</span>
        ) : null}
      </div>
      <div className="bg-white text-matthews-deep rounded-[var(--radius-matthews)] p-1">
        <DataTable
          columns={columns}
          rows={projects}
          rowKey={(r) => r.id}
          headerVariant="electric"
          emptyState="Triage queue is empty. Nice work."
        />
      </div>
    </div>
  );
}
