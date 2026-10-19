/**
 * Server-side query helpers. These read from the mock repository (org-scoped)
 * and assemble the joined/derived shapes the UI needs. Server components call
 * these directly; client components go through `actions.ts` for mutations and
 * re-fetch via TanStack Query / router refresh.
 */

import "server-only";

import { db, getState } from "@/lib/db";
import type { QueryOptions, WhereClause } from "@/lib/db";
import { getOrgId } from "@/lib/auth/session";
import type {
  Activity,
  Comment,
  Contact,
  Customer,
  Deal,
  FileRef,
  ID,
  Pipeline,
  Project,
  Payout,
  Task,
  TimeEntry,
  User,
} from "@/lib/db/types";

const DESC = { field: "createdAt", direction: "desc" } as const;
const ASC = { field: "createdAt", direction: "asc" } as const;

export async function getUsers(): Promise<User[]> {
  return db.users.list(getOrgId(), { orderBy: ASC });
}
export async function getUserMap(): Promise<Record<ID, User>> {
  const users = await getUsers();
  return Object.fromEntries(users.map((u) => [u.id, u]));
}

export async function getCustomers(): Promise<Customer[]> {
  return db.customers.list(getOrgId(), { orderBy: DESC });
}
export async function getCustomer(id: ID): Promise<Customer | null> {
  return db.customers.get(getOrgId(), id);
}

export async function getContacts(customerId?: ID): Promise<Contact[]> {
  const where: WhereClause<Contact>[] | undefined = customerId
    ? [{ field: "customerId", op: "==", value: customerId }]
    : undefined;
  return db.contacts.list(getOrgId(), { where, orderBy: DESC });
}

export async function getPipelines(): Promise<Pipeline[]> {
  return db.pipelines.list(getOrgId());
}

export async function getDeals(pipelineId?: ID): Promise<Deal[]> {
  const where: WhereClause<Deal>[] | undefined = pipelineId
    ? [{ field: "pipelineId", op: "==", value: pipelineId }]
    : undefined;
  return db.deals.list(getOrgId(), { where, orderBy: DESC });
}
export async function getDeal(id: ID): Promise<Deal | null> {
  return db.deals.get(getOrgId(), id);
}

export async function getProjects(): Promise<Project[]> {
  return db.projects.list(getOrgId(), { orderBy: DESC });
}
export async function getProject(id: ID): Promise<Project | null> {
  return db.projects.get(getOrgId(), id);
}

export async function getTasks(projectId?: ID): Promise<Task[]> {
  const where: WhereClause<Task>[] | undefined = projectId
    ? [{ field: "projectId", op: "==", value: projectId }]
    : undefined;
  return db.tasks.list(getOrgId(), { where, orderBy: DESC });
}

export async function getTimeEntries(opts?: {
  userId?: ID;
  approval?: string;
}): Promise<TimeEntry[]> {
  const where: WhereClause<TimeEntry>[] = [];
  if (opts?.userId) where.push({ field: "userId", op: "==", value: opts.userId });
  if (opts?.approval) where.push({ field: "approval", op: "==", value: opts.approval });
  return db.timeEntries.list(getOrgId(), { where, orderBy: DESC });
}

export async function getPayouts(): Promise<Payout[]> {
  return db.payouts.list(getOrgId(), { orderBy: DESC });
}

export async function getActivities(limit = 50): Promise<Activity[]> {
  return db.activities.list(getOrgId(), { orderBy: DESC, limit });
}

export async function getNotifications(
  userId?: ID,
): Promise<import("@/lib/db/types").AppNotification[]> {
  const where: WhereClause<import("@/lib/db/types").AppNotification>[] | undefined = userId
    ? [{ field: "userId", op: "==", value: userId }]
    : undefined;
  return db.notifications.list(getOrgId(), { where, orderBy: DESC });
}

export async function getComments(targetType: string, targetId: ID): Promise<Comment[]> {
  return db.comments.list(getOrgId(), {
    where: [
      { field: "targetType", op: "==", value: targetType },
      { field: "targetId", op: "==", value: targetId },
    ],
    orderBy: { field: "createdAt", direction: "asc" },
  });
}

export async function getFiles(targetType?: string, targetId?: ID): Promise<FileRef[]> {
  const where: WhereClause<FileRef>[] = [];
  if (targetType) where.push({ field: "targetType", op: "==", value: targetType });
  if (targetId) where.push({ field: "targetId", op: "==", value: targetId });
  return db.files.list(getOrgId(), { where, orderBy: DESC });
}

export async function getSubscription() {
  const list = await db.subscriptions.list(getOrgId());
  return list[0] ?? null;
}

export async function getOrganization() {
  return db.organizations.get(getOrgId(), getOrgId());
}

/**
 * Aggregated dashboard metrics. Computed synchronously from the live store so
 * every widget reflects the most recent mutations (e.g. a deal just won).
 */
export interface DashboardData {
  pipelineValue: number;
  weightedPipeline: number;
  wonValue: number;
  leadsCreated: number;
  activeProjects: number;
  overdueTasks: number;
  teamWorkload: Array<{ user: User; openTasks: number; pendingHours: number }>;
  dealsByStage: Array<{ stage: string; count: number; value: number }>;
  recentActivities: Activity[];
  upcomingTasks: Task[];
  revenueByWeek: Array<{ week: string; revenue: number }>;
}

export async function getDashboardData(): Promise<DashboardData> {
  const orgId = getOrgId();
  const state = getState();
  const [users, customers, deals, projects, tasks, activities] = await Promise.all([
    getUsers(),
    getCustomers(),
    getDeals(),
    getProjects(),
    getTasks(),
    getActivities(8),
  ]);

  const openDeals = deals.filter((d) => !d.won && !d.lost && d.stage !== "Completed");
  const pipelineValue = openDeals.reduce((s, d) => s + d.value, 0);
  const weightedPipeline = openDeals.reduce((s, d) => s + (d.value * d.probability) / 100, 0);
  const wonValue = deals.filter((d) => d.won).reduce((s, d) => s + d.value, 0);

  const now = Date.now();
  const weekMs = 7 * 86400000;
  const leadsCreated = customers.filter(
    (c) => now - Date.parse(c.createdAt) < weekMs,
  ).length;

  const activeProjects = projects.filter((p) => p.status === "Active").length;

  const overdueTasks = tasks.filter(
    (t) => t.status !== "Done" && t.dueDate && Date.parse(t.dueDate) < now,
  );

  // Team workload — open tasks + pending unapproved hours per user.
  const teamWorkload = users
    .filter((u) => u.role !== "client")
    .map((user) => {
      const openTasks = tasks.filter((t) => t.assigneeId === user.id && t.status !== "Done").length;
      const pendingHours = state.timeEntries
        .filter((e) => e.userId === user.id && e.approval === "Pending")
        .reduce((s, e) => s + e.duration, 0) / 3600;
      return { user, openTasks, pendingHours };
    })
    .filter((w) => w.openTasks > 0 || w.pendingHours > 0)
    .sort((a, b) => b.openTasks - a.openTasks);

  // Deals grouped by stage (for the pipeline funnel chart).
  const stageMap = new Map<string, { count: number; value: number }>();
  for (const d of deals) {
    const entry = stageMap.get(d.stage) ?? { count: 0, value: 0 };
    entry.count += 1;
    entry.value += d.value;
    stageMap.set(d.stage, entry);
  }
  const dealsByStage = [...stageMap.entries()].map(([stage, v]) => ({ stage, ...v }));

  // Upcoming tasks (due soon, not done).
  const upcomingTasks = tasks
    .filter((t) => t.status !== "Done" && t.dueDate)
    .sort((a, b) => Date.parse(a.dueDate!) - Date.parse(b.dueDate!))
    .slice(0, 6);

  // Revenue by week — synthetic last-8-weeks series from approved time + won deals.
  const revenueByWeek = buildRevenueSeries(state.timeEntries, deals);

  return {
    pipelineValue,
    weightedPipeline,
    wonValue,
    leadsCreated,
    activeProjects,
    overdueTasks: overdueTasks.length,
    teamWorkload,
    dealsByStage,
    recentActivities: activities,
    upcomingTasks,
    revenueByWeek,
  };
}

function buildRevenueSeries(
  timeEntries: TimeEntry[],
  deals: Deal[],
): Array<{ week: string; revenue: number }> {
  const weeks: Array<{ week: string; revenue: number }> = [];
  const now = new Date();
  for (let i = 7; i >= 0; i--) {
    const end = new Date(now.getTime() - i * 7 * 86400000);
    const label = end.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    weeks.push({ week: label, revenue: 0 });
  }
  const oldest = now.getTime() - 8 * 7 * 86400000;

  for (const e of timeEntries) {
    if (e.approval !== "Approved") continue;
    const t = Date.parse(e.startedAt ?? e.createdAt);
    if (t < oldest) continue;
    const idx = Math.min(7, Math.floor((t - oldest) / (7 * 86400000)));
    if (idx >= 0 && idx < weeks.length) {
      weeks[idx].revenue += (e.duration / 3600) * (e.hourlyRate ?? 0);
    }
  }
  for (const d of deals) {
    if (!d.won) continue;
    const t = Date.parse(d.updatedAt);
    if (t < oldest) continue;
    const idx = Math.min(7, Math.floor((t - oldest) / (7 * 86400000)));
    if (idx >= 0 && idx < weeks.length) {
      weeks[idx].revenue += d.value;
    }
  }
  return weeks;
}

/**
 * Global search across customers, deals, projects, tasks, users, files.
 * Returns ranked, typed result groups for the command palette + /search page.
 */
export type SearchGroup = "Customers" | "Deals" | "Projects" | "Tasks" | "Users" | "Files";

export interface SearchResult {
  group: SearchGroup;
  id: ID;
  label: string;
  sublabel?: string;
  href: string;
}

export async function globalSearch(query: string): Promise<SearchResult[]> {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const [customers, deals, projects, tasks, users, files] = await Promise.all([
    getCustomers(),
    getDeals(),
    getProjects(),
    getTasks(),
    getUsers(),
    getFiles(),
  ]);

  const results: SearchResult[] = [];
  const match = (s?: string) => !!s && s.toLowerCase().includes(q);

  for (const c of customers) {
    if (match(c.name) || match(c.company) || match(c.email)) {
      results.push({
        group: "Customers",
        id: c.id,
        label: c.company || c.name,
        sublabel: c.email,
        href: `/customers/${c.id}`,
      });
    }
  }
  for (const d of deals) {
    if (match(d.title)) {
      results.push({ group: "Deals", id: d.id, label: d.title, sublabel: d.stage, href: `/pipeline` });
    }
  }
  for (const p of projects) {
    if (match(p.name) || match(p.description)) {
      results.push({ group: "Projects", id: p.id, label: p.name, sublabel: p.status, href: `/projects/${p.id}` });
    }
  }
  for (const t of tasks) {
    if (match(t.title)) {
      results.push({ group: "Tasks", id: t.id, label: t.title, sublabel: t.status, href: `/tasks` });
    }
  }
  for (const u of users) {
    if (match(u.name) || match(u.email) || match(u.jobTitle)) {
      results.push({ group: "Users", id: u.id, label: u.name, sublabel: u.jobTitle, href: `/settings` });
    }
  }
  for (const f of files) {
    if (match(f.name)) {
      results.push({ group: "Files", id: f.id, label: f.name, sublabel: f.mimeType, href: `#` });
    }
  }

  return results.slice(0, 40);
}
