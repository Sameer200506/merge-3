/**
 * Live mutable state container. The seed data is loaded once per process into
 * this singleton, and all mutations (repository CRUD, automation triggers) flow
 * through `getState()` so they share one source of truth — exactly as a real
 * backend would across requests in a session.
 */

import type {
  Activity,
  AppNotification,
  AuditLog,
  Comment,
  Contact,
  Customer,
  Deal,
  FileRef,
  Organization,
  Payout,
  Pipeline,
  Project,
  Subscription,
  Task,
  TimeEntry,
  User,
} from "../types";
import * as seed from "./store";

export interface StoreState {
  organizations: Organization[];
  users: User[];
  customers: Customer[];
  contacts: Contact[];
  pipelines: Pipeline[];
  deals: Deal[];
  projects: Project[];
  tasks: Task[];
  timeEntries: TimeEntry[];
  payouts: Payout[];
  activities: Activity[];
  comments: Comment[];
  notifications: AppNotification[];
  files: FileRef[];
  subscriptions: Subscription[];
  auditLogs: AuditLog[];
}

// Use globalThis so the store survives hot-reloads in dev (Next.js re-evaluates
// modules on save; this keeps demo data stable across edits).
const GLOBAL_KEY = "__STARTUPOS_MOCK_STORE__";

type GlobalWithStore = typeof globalThis & { [GLOBAL_KEY]?: StoreState };

function buildState(): StoreState {
  return {
    organizations: [structuredClone(seed.organization)],
    users: structuredClone(seed.users),
    customers: structuredClone(seed.customers),
    contacts: structuredClone(seed.contacts),
    pipelines: structuredClone(seed.pipelines),
    deals: structuredClone(seed.deals),
    projects: structuredClone(seed.projects),
    tasks: structuredClone(seed.tasks),
    timeEntries: structuredClone(seed.timeEntries),
    payouts: structuredClone(seed.payouts),
    activities: structuredClone(seed.activities),
    comments: structuredClone(seed.comments),
    notifications: structuredClone(seed.notifications),
    files: structuredClone(seed.files),
    subscriptions: structuredClone(seed.subscriptions),
    auditLogs: structuredClone(seed.auditLogs),
  };
}

export function getState(): StoreState {
  const g = globalThis as GlobalWithStore;
  if (!g[GLOBAL_KEY]) {
    g[GLOBAL_KEY] = buildState();
  }
  return g[GLOBAL_KEY]!;
}

/** Test/reset hook — wipes the store back to seed data. */
export function resetState() {
  (globalThis as GlobalWithStore)[GLOBAL_KEY] = buildState();
}
