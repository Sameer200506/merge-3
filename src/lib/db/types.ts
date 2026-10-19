/**
 * StartupOS domain types.
 *
 * Every Firestore-style document extends BaseDoc, mirroring the security-rule
 * requirement that all docs carry organizationId + audit fields. The shapes are
 * intentionally identical to what a real Firestore implementation would use, so
 * swapping the mock repository for a live one is a localized change.
 */

export type ID = string;
export type ISODate = string; // ISO timestamp

/** Fields enforced by Firestore Security Rules on every tenant-scoped document. */
export interface BaseDoc {
  id: ID;
  organizationId: ID;
  createdBy: ID;
  updatedBy: ID;
  createdAt: ISODate;
  updatedAt: ISODate;
}

// ---- Organizations & users ---------------------------------------------------

export type PlatformRole = "super_owner";

export type OrgRole =
  | "owner"
  | "admin"
  | "sales_manager"
  | "project_manager"
  | "team_member"
  | "client";

export interface Organization extends BaseDoc {
  name: string;
  slug: string;
  plan: "free" | "starter" | "growth" | "enterprise";
  logoUrl?: string;
  suspended?: boolean;
}

export interface User extends BaseDoc {
  name: string;
  email: string;
  avatarUrl?: string;
  role: OrgRole;
  /** Hourly rate in USD — used by the payouts module. */
  hourlyRate?: number;
  jobTitle?: string;
}

// ---- CRM: customers & deals --------------------------------------------------

export interface Contact extends BaseDoc {
  customerId: ID;
  name: string;
  email: string;
  phone?: string;
  position?: string;
  isPrimary?: boolean;
}

export interface Customer extends BaseDoc {
  name: string;
  company?: string;
  email?: string;
  phone?: string;
  website?: string;
  status: "lead" | "active" | "churned";
  tags: string[];
  avatarUrl?: string;
  /** Derived lifecycle: where this customer sits in Lead→Deal→Project. */
  lifecycleStage: "lead" | "deal" | "customer" | "delivered";
}

export interface Pipeline extends BaseDoc {
  name: string;
  stages: string[]; // ordered
}

export interface Deal extends BaseDoc {
  title: string;
  customerId: ID;
  pipelineId: ID;
  stage: string;
  value: number; // USD
  currency: string;
  expectedCloseDate?: ISODate;
  ownerId: ID;
  probability: number; // 0-100
  won?: boolean;
  lost?: boolean;
  projectId?: ID; // set when Deal Won automation runs
}

// ---- Delivery: projects & tasks ----------------------------------------------

export interface Project extends BaseDoc {
  name: string;
  description?: string;
  customerId: ID;
  dealId?: ID;
  status: (typeof import("@/lib/constants").PROJECT_STATUSES)[number];
  managerId: ID;
  memberIds: ID[];
  startDate?: ISODate;
  dueDate?: ISODate;
  /** 0-100, recomputed by the Task Completion trigger. */
  progress: number;
  budgetHours?: number;
  color?: string;
}

export interface Subtask {
  id: ID;
  title: string;
  done: boolean;
}

export interface Task extends BaseDoc {
  title: string;
  description?: string;
  projectId?: ID;
  customerId?: ID;
  assigneeId?: ID;
  reporterId?: ID;
  status: (typeof import("@/lib/constants").TASK_STATUSES)[number];
  priority: (typeof import("@/lib/constants").TASK_PRIORITIES)[number];
  type: (typeof import("@/lib/constants").TASK_TYPES)[number];
  subtasks: Subtask[];
  dependencies: ID[]; // other task ids
  estimateHours?: number;
  dueDate?: ISODate;
  recurrence?: "none" | "daily" | "weekly" | "monthly";
  tags: string[];
  order: number;
  completedAt?: ISODate;
}

export interface TimeEntry extends BaseDoc {
  userId: ID;
  taskId?: ID;
  projectId?: ID;
  description?: string;
  /** Seconds. */
  duration: number;
  startedAt?: ISODate;
  endedAt?: ISODate;
  billable: boolean;
  hourlyRate?: number;
  approval: (typeof import("@/lib/constants").TIME_APPROVAL_STATUSES)[number];
  approvedBy?: ID;
  approvedAt?: ISODate;
}

// ---- Finance: payouts (demo mode) --------------------------------------------

export interface PayoutLine {
  userId: ID;
  hours: number;
  rate: number;
  amount: number;
  timeEntryIds: ID[];
}

export interface Payout extends BaseDoc {
  /** ISO date of the week this batch belongs to (Monday). */
  weekStart: ISODate;
  status: (typeof import("@/lib/constants").PAYOUT_STATUSES)[number];
  lines: PayoutLine[];
  total: number;
  currency: string;
  /** Simulated Wise transfer reference (demo only). */
  transferRef?: string;
  approvedBy?: ID;
  paidAt?: ISODate;
  provider: "wise_demo";
}

// ---- Cross-cutting -----------------------------------------------------------

export type ActivityType =
  | "deal_created"
  | "deal_stage_changed"
  | "deal_won"
  | "deal_lost"
  | "customer_created"
  | "project_created"
  | "task_created"
  | "task_completed"
  | "task_assigned"
  | "time_logged"
  | "time_approved"
  | "time_rejected"
  | "payout_created"
  | "payout_approved"
  | "payout_paid"
  | "comment_added"
  | "file_uploaded";

export interface Activity extends BaseDoc {
  type: ActivityType;
  actorId: ID;
  targetType: "deal" | "customer" | "project" | "task" | "time" | "payout" | "comment" | "file";
  targetId: ID;
  targetLabel: string;
  meta?: Record<string, unknown>;
}

export interface Comment extends BaseDoc {
  targetType: "task" | "project" | "deal" | "customer";
  targetId: ID;
  authorId: ID;
  body: string;
}

export type NotificationType =
  | "task_assigned"
  | "deal_won"
  | "time_approved"
  | "time_rejected"
  | "payout_generated"
  | "mention";

export interface AppNotification extends BaseDoc {
  userId: ID; // recipient
  type: NotificationType;
  title: string;
  body?: string;
  read: boolean;
  targetType?: string;
  targetId?: ID;
}

export interface FileRef extends BaseDoc {
  name: string;
  mimeType: string;
  sizeBytes: number;
  url: string; // mock url
  targetType?: "customer" | "project" | "task";
  targetId?: ID;
}

export interface Subscription extends BaseDoc {
  status: "trialing" | "active" | "past_due" | "canceled";
  plan: Organization["plan"];
  seats: number;
  currentPeriodEnd: ISODate;
}

export interface AuditLog extends BaseDoc {
  actorId: ID;
  action: string;
  targetType: string;
  targetId?: ID;
  before?: unknown;
  after?: unknown;
}

// ---- Collection registry -----------------------------------------------------
// Single source of truth for collection names → mirrors Firestore collections.

export type CollectionName =
  | "organizations"
  | "users"
  | "customers"
  | "contacts"
  | "pipelines"
  | "deals"
  | "projects"
  | "tasks"
  | "timeEntries"
  | "payouts"
  | "activities"
  | "comments"
  | "notifications"
  | "files"
  | "subscriptions"
  | "auditLogs";

export type EntityOf<C extends CollectionName> = C extends "organizations"
  ? Organization
  : C extends "users"
    ? User
    : C extends "customers"
      ? Customer
      : C extends "contacts"
        ? Contact
        : C extends "pipelines"
          ? Pipeline
          : C extends "deals"
            ? Deal
            : C extends "projects"
              ? Project
              : C extends "tasks"
                ? Task
                : C extends "timeEntries"
                  ? TimeEntry
                  : C extends "payouts"
                    ? Payout
                    : C extends "activities"
                      ? Activity
                      : C extends "comments"
                        ? Comment
                        : C extends "notifications"
                          ? AppNotification
                          : C extends "files"
                            ? FileRef
                            : C extends "subscriptions"
                              ? Subscription
                              : AuditLog;
