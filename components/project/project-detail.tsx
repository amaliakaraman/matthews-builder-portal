"use client";

import {
  ProjectStatusChip,
  StatusChip,
  TierChip,
} from "@/components/brand/status-chip";
import { SectionHeading } from "@/components/brand/section-heading";
import { AUDIENCE_LABELS, TIER_DESCRIPTIONS } from "@/lib/db/types";
import { formatDate, formatRelative, titleCase } from "@/lib/utils";
import type { CurrentUser } from "@/lib/auth/session";
import { CommentsThread } from "./comments-thread";
import { Timeline } from "./timeline";
import { OverrideDialog } from "./override-dialog";
import { StatusActions } from "./status-actions";
import { Assignments } from "./assignments";
import { ProvisioningPanel } from "./provisioning-panel";
import { AuditLogList } from "./audit-log";

export interface ProjectViewModel {
  id: string;
  name: string;
  description: string | null;
  problemStatement: string | null;
  expectedUsers: string | null;
  scopingDocsUrl: string | null;
  intendedStartDate: string | null;
  tier: string | null;
  status: string;
  edgeCase: string | null;
  productOwnerDeptId: string | null;
  productOwnerDeptName: string | null;
  audienceType: string | null;
  executiveSponsorName: string | null;
  builderUserId: string;
  builderName: string;
  databaseUrl: string | null;
  endpointUrl: string | null;
  wrikeId: string | null;
  createdAt: string;
  updatedAt: string;
  submittedAt: string | null;
}

interface Props {
  currentUser: CurrentUser;
  project: ProjectViewModel;
  milestones: Array<{
    id: string;
    type: string;
    completedAt: string | null;
    notes: string | null;
    createdAt: string;
  }>;
  assignments: Array<{
    id: string;
    role: string;
    userId: string;
    userName: string;
    userEmail: string;
  }>;
  comments: Array<{
    id: string;
    body: string;
    authorName: string;
    createdAt: string;
  }>;
  auditLog: Array<{
    id: string;
    action: string;
    actorName: string;
    before: object | null;
    after: object | null;
    reason: string | null;
    createdAt: string;
  }>;
  provisioningRequests: Array<{
    id: string;
    status: string;
    databaseUrl: string | null;
    endpointUrl: string | null;
    notes: string | null;
    requestedAt: string;
    fulfilledAt: string | null;
  }>;
  departments: Array<{ id: string; name: string }>;
  assignableUsers: Array<{ id: string; name: string; email: string }>;
}

export function ProjectDetail(props: Props) {
  const { currentUser, project } = props;
  const isAdmin = currentUser.role === "px_admin";
  const isBuilder = currentUser.id === project.builderUserId;

  return (
    <div className="space-y-8">
      <SectionHeading
        eyebrow={`Project · updated ${formatRelative(project.updatedAt)}`}
        title={project.name}
        description={project.description ?? undefined}
        level="h1"
        actions={
          <div className="flex flex-wrap gap-2">
            <ProjectStatusChip status={project.status} />
            {project.wrikeId ? (
              <StatusChip variant="muted">Imported from Wrike</StatusChip>
            ) : null}
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-12">
        {/* LEFT — three dimensions card on Deep Blue */}
        <aside className="lg:col-span-4">
          <div className="surface-deep rounded-[var(--radius-matthews)] p-6 space-y-5 sticky top-24">
            <div className="relative pl-4">
              <span
                aria-hidden
                className="absolute left-0 top-0 bottom-0 w-[2px] bg-electric-dark"
              />
              <h2 className="font-display text-2xl font-black text-white">
                {project.name}
              </h2>
              <p className="text-xs text-platinum/70 mt-1">
                Builder · {project.builderName}
              </p>
            </div>
            <Dim
              label="Classification"
              value={
                <span className="flex items-center gap-2">
                  <TierChip tier={project.tier} />
                </span>
              }
            />
            {project.tier ? (
              <p className="text-xs text-platinum/70 -mt-3">
                {TIER_DESCRIPTIONS[project.tier]}
              </p>
            ) : null}
            <Dim
              label="Product Owner"
              value={project.productOwnerDeptName ?? "—"}
            />
            <Dim
              label="Executive Sponsor"
              value={
                project.executiveSponsorName ? (
                  <>
                    <span className="block">{project.executiveSponsorName}</span>
                    {project.audienceType ? (
                      <span className="text-xs text-platinum/60">
                        Audience:{" "}
                        {AUDIENCE_LABELS[project.audienceType] ??
                          project.audienceType}
                      </span>
                    ) : null}
                  </>
                ) : (
                  "—"
                )
              }
            />
            {isAdmin ? (
              <OverrideDialog
                project={project}
                departments={props.departments}
              />
            ) : null}
            {project.edgeCase ? (
              <div className="rounded-[var(--radius-matthews)] bg-white/5 p-3 text-xs text-platinum/85">
                <span className="block uppercase tracking-[0.14em] text-platinum/60 mb-1">
                  Edge case flag
                </span>
                {project.edgeCase}
              </div>
            ) : null}
          </div>
        </aside>

        {/* CENTER — timeline / problem / comments */}
        <section className="lg:col-span-5 space-y-8">
          {project.problemStatement ? (
            <div>
              <h3 className="text-xs uppercase tracking-[0.14em] text-matthews-deep/55 mb-2">
                Problem statement
              </h3>
              <p className="text-sm text-matthews-deep/85 max-w-prose">
                {project.problemStatement}
              </p>
            </div>
          ) : null}

          <div className="grid gap-4 sm:grid-cols-2 text-sm">
            <Pair
              label="Expected users"
              value={project.expectedUsers ?? "—"}
            />
            <Pair
              label="Intended start"
              value={
                project.intendedStartDate
                  ? formatDate(project.intendedStartDate)
                  : "—"
              }
            />
            <Pair
              label="Scoping docs"
              value={
                project.scopingDocsUrl ? (
                  <a
                    href={project.scopingDocsUrl}
                    className="text-electric-light hover:underline break-all"
                    target="_blank"
                    rel="noreferrer"
                  >
                    {project.scopingDocsUrl}
                  </a>
                ) : (
                  "—"
                )
              }
            />
            <Pair
              label="Submitted"
              value={
                project.submittedAt
                  ? formatRelative(project.submittedAt)
                  : "—"
              }
            />
            {project.databaseUrl ? (
              <Pair label="Database URL" value={<code>{project.databaseUrl}</code>} />
            ) : null}
            {project.endpointUrl ? (
              <Pair label="Endpoint URL" value={<code>{project.endpointUrl}</code>} />
            ) : null}
          </div>

          <Timeline
            milestones={props.milestones}
            currentStatus={project.status}
            tier={project.tier}
          />

          {isAdmin ? (
            <StatusActions project={project} />
          ) : null}

          <CommentsThread
            projectId={project.id}
            comments={props.comments}
            currentUserName={currentUser.name}
          />

          <AuditLogList entries={props.auditLog} />
        </section>

        {/* RIGHT — assigned people / resources, Platinum Grey */}
        <aside className="lg:col-span-3 space-y-5">
          <Assignments
            project={project}
            assignments={props.assignments}
            assignableUsers={props.assignableUsers}
            isAdmin={isAdmin}
          />

          {project.tier === "consumer" ? (
            <ProvisioningPanel
              project={project}
              requests={props.provisioningRequests}
              isAdmin={isAdmin}
            />
          ) : null}

          {/* Builder-side reminders for tier-specific requirements */}
          {isBuilder && project.tier ? (
            <div className="rounded-[var(--radius-matthews)] bg-platinum p-4 text-sm">
              <h4 className="text-xs uppercase tracking-[0.14em] text-matthews-deep/55 mb-2">
                What's required of you
              </h4>
              <ul className="space-y-1.5 text-matthews-deep/80">
                {project.tier === "consumer" ? (
                  <>
                    <li>Use approved tools, accounts, and brand standards.</li>
                    <li>Ship MVP to a test audience first.</li>
                  </>
                ) : null}
                {project.tier === "contributor" ? (
                  <>
                    <li>Engineering alignment before build.</li>
                    <li>MVP review + sign-off before broad rollout.</li>
                  </>
                ) : null}
                {project.tier === "personal" ? (
                  <li>Personal-only — re-register if you share with teammates.</li>
                ) : null}
              </ul>
            </div>
          ) : null}
        </aside>
      </div>
    </div>
  );
}

function Dim({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-[0.14em] text-platinum/60 mb-1">
        {label}
      </p>
      <div className="text-sm text-white">{value}</div>
    </div>
  );
}

function Pair({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-[0.14em] text-matthews-deep/55">
        {titleCase(label)}
      </dt>
      <dd className="mt-1 text-sm text-matthews-deep break-words">{value}</dd>
    </div>
  );
}
