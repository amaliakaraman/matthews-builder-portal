"use client";

import Link from "next/link";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { DataTable, type Column } from "@/components/brand/data-table";
import {
  AXIS_COLOR,
  AXIS_NUM_COLOR,
  CHART_SERIES_LIGHT,
  SOURCE_COLOR,
} from "@/components/brand/chart-theme";
import { ProjectStatusChip, TierChip } from "@/components/brand/status-chip";
import { TIER_LABELS } from "@/lib/db/types";
import { titleCase } from "@/lib/utils";

interface Props {
  byTier: Record<string, number>;
  byStatus: Record<string, number>;
  byOwner: Record<string, number>;
  bySponsor: Record<string, number>;
  overdue: Array<{ id: string; name: string; status: string; age: number }>;
  stalled: Array<{ id: string; name: string; status: string; age: number }>;
}

const tickStyle = { fontFamily: "inherit", fontSize: 8 } as const;

export function PortfolioDashboard({
  byTier,
  byStatus,
  byOwner,
  bySponsor,
  overdue,
  stalled,
}: Props) {
  const tierData = Object.entries(byTier).map(([k, v]) => ({
    name: TIER_LABELS[k] ?? titleCase(k),
    value: v,
  }));
  const statusData = Object.entries(byStatus).map(([k, v]) => ({
    name: titleCase(k),
    value: v,
  }));
  const ownerData = Object.entries(byOwner)
    .map(([k, v]) => ({ name: k, value: v }))
    .sort((a, b) => b.value - a.value);
  const sponsorData = Object.entries(bySponsor)
    .map(([k, v]) => ({ name: k, value: v }))
    .sort((a, b) => b.value - a.value);

  return (
    <div className="space-y-8">
      <div className="grid gap-6 lg:grid-cols-2">
        <ChartCard
          title="Projects by tier"
          source="Source: Builder Portal · live data"
        >
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={tierData}
                dataKey="value"
                nameKey="name"
                outerRadius={90}
                label
              >
                {tierData.map((_, i) => (
                  <Cell
                    key={i}
                    fill={CHART_SERIES_LIGHT[i % CHART_SERIES_LIGHT.length]}
                  />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title="Projects by status"
          source="Source: Builder Portal · live data"
        >
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={statusData} margin={{ top: 8, right: 12, bottom: 24, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={`${AXIS_COLOR}20`} />
              <XAxis
                dataKey="name"
                tick={{ ...tickStyle, fill: AXIS_COLOR }}
                axisLine={{ stroke: AXIS_COLOR }}
                interval={0}
                angle={-25}
                textAnchor="end"
                height={50}
              />
              <YAxis
                tick={{ ...tickStyle, fill: AXIS_NUM_COLOR }}
                axisLine={{ stroke: AXIS_COLOR }}
                allowDecimals={false}
              />
              <Tooltip />
              <Bar dataKey="value" fill={CHART_SERIES_LIGHT[0]} radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title="Projects by Product Owner"
          source="Source: Builder Portal · live data"
        >
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={ownerData} layout="vertical" margin={{ top: 8, right: 12, bottom: 8, left: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={`${AXIS_COLOR}20`} />
              <XAxis
                type="number"
                tick={{ ...tickStyle, fill: AXIS_NUM_COLOR }}
                axisLine={{ stroke: AXIS_COLOR }}
                allowDecimals={false}
              />
              <YAxis
                type="category"
                dataKey="name"
                tick={{ ...tickStyle, fill: AXIS_COLOR }}
                width={120}
              />
              <Tooltip />
              <Bar dataKey="value" fill={CHART_SERIES_LIGHT[1]} radius={[0, 2, 2, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title="Projects by Executive Sponsor"
          source="Source: Builder Portal · live data"
        >
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={sponsorData} layout="vertical" margin={{ top: 8, right: 12, bottom: 8, left: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={`${AXIS_COLOR}20`} />
              <XAxis
                type="number"
                tick={{ ...tickStyle, fill: AXIS_NUM_COLOR }}
                axisLine={{ stroke: AXIS_COLOR }}
                allowDecimals={false}
              />
              <YAxis
                type="category"
                dataKey="name"
                tick={{ ...tickStyle, fill: AXIS_COLOR }}
                width={120}
              />
              <Tooltip />
              <Bar dataKey="value" fill={CHART_SERIES_LIGHT[2]} radius={[0, 2, 2, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <FlagTable
          title="Overdue reviews"
          source="Submitted/under-review > 5 days without a status change."
          rows={overdue}
        />
        <FlagTable
          title="Stalled projects"
          source="In-build / MVP / needs-revision > 21 days without an update."
          rows={stalled}
        />
      </div>
    </div>
  );
}

function ChartCard({
  title,
  source,
  children,
}: {
  title: string;
  source: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-[var(--radius-matthews)] border border-matthews-deep/10 bg-white p-5">
      <h3 className="font-bold text-[12pt] leading-[16pt] text-matthews-deep">
        {title}
      </h3>
      <p className="italic text-[10pt] mb-3" style={{ color: SOURCE_COLOR }}>
        {source}
      </p>
      {children}
    </div>
  );
}

function FlagTable({
  title,
  source,
  rows,
}: {
  title: string;
  source: string;
  rows: Array<{ id: string; name: string; status: string; age: number }>;
}) {
  const cols: Column<{
    id: string;
    name: string;
    status: string;
    age: number;
  }>[] = [
    {
      key: "name",
      header: "Project",
      isLeading: true,
      cell: (r) => (
        <Link
          href={`/projects/${r.id}`}
          className="font-medium hover:text-electric-light"
        >
          {r.name}
        </Link>
      ),
    },
    {
      key: "status",
      header: "Status",
      cell: (r) => <ProjectStatusChip status={r.status} />,
    },
    {
      key: "age",
      header: "Age",
      cell: (r) => `${Math.floor(r.age / (24 * 60 * 60 * 1000))}d`,
    },
  ];
  return (
    <DataTable
      title={title}
      source={source}
      columns={cols}
      rows={rows}
      rowKey={(r) => r.id}
      emptyState="None — nice."
    />
  );
}
