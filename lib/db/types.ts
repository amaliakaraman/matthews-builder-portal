/**
 * Centralised re-exports of Prisma enums + types so the rest of the app
 * imports from a single place. This also lets us swap the data layer
 * (e.g. to Drizzle or a mock) without touching every consumer.
 */
export {
  Tier,
  AudienceType,
  ProjectStatus,
  UserRole,
  MilestoneType,
  AssignmentRole,
  NotificationKind,
  ProvisioningStatus,
  type Project,
  type User,
  type Department,
  type Sponsor,
  type Milestone,
  type Assignment,
  type AuditLogEntry,
  type Comment,
  type ProvisioningRequest,
  type Notification,
} from "@prisma/client";

export const AUDIENCE_LABELS: Record<string, string> = {
  agents: "Agents",
  market_leaders: "Market Leaders",
  financiers: "Financiers & Accountants",
  marketers: "Marketers",
  sales_ops: "Sales Operations Facilitators",
};

export const TIER_LABELS: Record<string, string> = {
  personal: "Tier 1 · Personal Project",
  consumer: "Tier 2 · Platform Consumer",
  contributor: "Tier 3 · Platform Contributor",
};

export const TIER_DESCRIPTIONS: Record<string, string> = {
  personal:
    "Personal use only. No data dependencies. Fully self-serve, no PX involvement.",
  consumer:
    "Department use. Reads from the platform, stores new data in an app-owned DB. Early direction + coaching from PX, then self-directed.",
  contributor:
    "Cross-department value AND writes back to Artemis. Engineering alignment required before build; PX involved from start.",
};
