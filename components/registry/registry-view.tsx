"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, Table as TableIcon, LayoutGrid } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DataTable, type Column } from "@/components/brand/data-table";
import {
  ProjectStatusChip,
  StatusChip,
  TierChip,
} from "@/components/brand/status-chip";
import { AUDIENCE_LABELS } from "@/lib/db/types";
import { cn, formatDate } from "@/lib/utils";

interface Project {
  id: string;
  name: string;
  description: string | null;
  tier: string | null;
  status: string;
  builderName: string;
  ownerDept: string;
  sponsorName: string;
  audienceType: string | null;
  updatedAt: string;
}

interface RegistryViewProps {
  projects: Project[];
  departments: Array<{ id: string; name: string }>;
  sponsors: Array<{ id: string; name: string; audienceType: string }>;
  tierOptions: string[];
  activeFilters: {
    tier?: string;
    status?: string;
    productOwnerDeptId?: string;
    sponsorId?: string;
    q?: string;
    view?: string;
  };
}

const TIER_FILTERS = [
  { id: "personal", label: "Personal" },
  { id: "consumer", label: "Consumer" },
  { id: "contributor", label: "Contributor" },
];

const STATUS_FILTERS = [
  { id: "draft", label: "Draft" },
  { id: "submitted", label: "Submitted" },
  { id: "under_px_review", label: "PX Review" },
  { id: "approved", label: "Approved" },
  { id: "in_build", label: "In Build" },
  { id: "deployed", label: "Deployed" },
  { id: "active", label: "Active" },
  { id: "needs_revision", label: "Needs Revision" },
];

export function RegistryView({
  projects,
  departments,
  sponsors,
  activeFilters,
}: RegistryViewProps) {
  const router = useRouter();
  const search = useSearchParams();
  const [q, setQ] = useState(activeFilters.q ?? "");

  const view = activeFilters.view === "card" ? "card" : "table";

  const setParam = (key: string, value: string | null) => {
    const next = new URLSearchParams(search.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    router.push(`/registry?${next.toString()}`);
  };

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setParam("q", q.trim() || null);
  };

  const columns: Column<Project>[] = useMemo(
    () => [
      {
        key: "name",
        header: "Project",
        isLeading: true,
        cell: (row) => (
          <div className="flex flex-col">
            <Link
              href={`/projects/${row.id}`}
              className="font-medium text-matthews-deep hover:text-electric-light"
            >
              {row.name}
            </Link>
            {row.description ? (
              <span className="text-[8.5pt] text-matthews-deep/60 line-clamp-1">
                {row.description}
              </span>
            ) : null}
          </div>
        ),
      },
      {
        key: "tier",
        header: "Tier",
        cell: (row) => <TierChip tier={row.tier} />,
      },
      { key: "ownerDept", header: "Product Owner" },
      {
        key: "sponsorName",
        header: "Executive Sponsor",
        cell: (row) => (
          <div className="flex flex-col items-center">
            <span>{row.sponsorName}</span>
            {row.audienceType ? (
              <span className="text-[8pt] text-matthews-deep/55">
                {AUDIENCE_LABELS[row.audienceType] ?? row.audienceType}
              </span>
            ) : null}
          </div>
        ),
      },
      {
        key: "status",
        header: "Status",
        cell: (row) => <ProjectStatusChip status={row.status} />,
      },
      { key: "builderName", header: "Builder" },
      {
        key: "updatedAt",
        header: "Updated",
        cell: (row) => formatDate(row.updatedAt),
      },
    ],
    []
  );

  return (
    <div className="space-y-5">
      {/* Filters row */}
      <div className="flex flex-wrap items-center gap-3">
        <form onSubmit={submitSearch} className="flex items-center gap-2">
          <div className="relative">
            <Search
              className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-matthews-deep/40"
              strokeWidth={1.5}
            />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search name or description"
              className="pl-9 w-72"
            />
          </div>
          <Button type="submit" variant="outline" size="sm">
            Search
          </Button>
        </form>

        <div className="flex flex-wrap gap-1.5 no-scrollbar">
          {TIER_FILTERS.map((t) => (
            <FilterChip
              key={t.id}
              active={activeFilters.tier === t.id}
              onClick={() =>
                setParam("tier", activeFilters.tier === t.id ? null : t.id)
              }
            >
              {t.label}
            </FilterChip>
          ))}
        </div>

        <div className="flex flex-wrap gap-1.5">
          {STATUS_FILTERS.map((s) => (
            <FilterChip
              key={s.id}
              active={activeFilters.status === s.id}
              onClick={() =>
                setParam("status", activeFilters.status === s.id ? null : s.id)
              }
            >
              {s.label}
            </FilterChip>
          ))}
        </div>

        <div className="ml-auto flex items-center gap-2">
          <Select
            value={activeFilters.productOwnerDeptId ?? "all"}
            onValueChange={(v) =>
              setParam("productOwnerDeptId", v === "all" ? null : v)
            }
          >
            <SelectTrigger className="w-44">
              <SelectValue placeholder="Owner" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All owners</SelectItem>
              {departments.map((d) => (
                <SelectItem key={d.id} value={d.id}>
                  {d.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={activeFilters.sponsorId ?? "all"}
            onValueChange={(v) =>
              setParam("sponsorId", v === "all" ? null : v)
            }
          >
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Sponsor" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All sponsors</SelectItem>
              {sponsors.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex rounded-[var(--radius-matthews)] border border-matthews-deep/15 overflow-hidden">
            <button
              type="button"
              className={cn(
                "px-2 py-2 text-xs",
                view === "table"
                  ? "bg-matthews-deep text-white"
                  : "text-matthews-deep hover:bg-platinum"
              )}
              onClick={() => setParam("view", null)}
              aria-label="Table view"
            >
              <TableIcon className="h-4 w-4" strokeWidth={1.5} />
            </button>
            <button
              type="button"
              className={cn(
                "px-2 py-2 text-xs",
                view === "card"
                  ? "bg-matthews-deep text-white"
                  : "text-matthews-deep hover:bg-platinum"
              )}
              onClick={() => setParam("view", "card")}
              aria-label="Card view"
            >
              <LayoutGrid className="h-4 w-4" strokeWidth={1.5} />
            </button>
          </div>
        </div>
      </div>

      {view === "table" ? (
        <DataTable
          columns={columns}
          rows={projects}
          rowKey={(r) => r.id}
          emptyState={
            <span>
              No projects match these filters.{" "}
              <Link
                href="/registry"
                className="text-electric-light underline"
              >
                Clear filters
              </Link>
              .
            </span>
          }
          rowHref={(r) => `/projects/${r.id}`}
        />
      ) : (
        <CardGrid projects={projects} />
      )}
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-[var(--radius-matthews)] px-3 pt-[7px] pb-[5px] text-[10px] uppercase tracking-[0.12em] font-medium border",
        active
          ? "bg-electric-light text-white border-electric-light"
          : "bg-transparent text-matthews-deep border-matthews-deep/20 hover:bg-platinum"
      )}
    >
      {children}
    </button>
  );
}

function CardGrid({ projects }: { projects: Project[] }) {
  if (projects.length === 0) {
    return (
      <p className="text-sm text-matthews-deep/60 py-12 text-center">
        No projects match these filters.
      </p>
    );
  }
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {projects.map((p) => (
        <Link
          key={p.id}
          href={`/projects/${p.id}`}
          className="block rounded-[var(--radius-matthews)] border border-matthews-deep/10 bg-white p-5 hover:border-electric-light transition-colors"
        >
          <div className="flex items-start justify-between gap-2 mb-3">
            <TierChip tier={p.tier} />
            <ProjectStatusChip status={p.status} />
          </div>
          <h3 className="font-bold text-matthews-deep">{p.name}</h3>
          {p.description ? (
            <p className="mt-1 text-sm text-matthews-deep/70 line-clamp-2">
              {p.description}
            </p>
          ) : null}
          <div className="mt-4 flex flex-wrap gap-2">
            <StatusChip variant="muted">{p.ownerDept}</StatusChip>
            {p.audienceType ? (
              <StatusChip variant="muted">
                {AUDIENCE_LABELS[p.audienceType] ?? p.audienceType}
              </StatusChip>
            ) : null}
          </div>
        </Link>
      ))}
    </div>
  );
}
