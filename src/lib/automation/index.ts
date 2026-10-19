/**
 * Automation triggers. These mirror what Firebase Cloud Functions would do in
 * production, but run synchronously against the mock store so the UI updates
 * instantly. Each trigger also writes an Activity log entry, which is what makes
 * the Activity Feed and notifications feel "live".
 *
 * Triggers are invoked by server actions right after a mutation, passing the
 * orgId + actor so the created docs are correctly tenanted.
 */

import { db, getState } from "@/lib/db";
import { ORG_ID } from "@/lib/db/mock/store";
import type {
  Activity,
  ActivityType,
  AppNotification,
  Deal,
  ID,
  NotificationType,
  Payout,
  Project,
  Task,
} from "@/lib/db/types";

function nowISO() {
  return new Date().toISOString();
}

function uid(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

/** Generic activity-log writer shared by every trigger. */
async function logActivity(
  orgId: ID,
  actorId: ID,
  type: ActivityType,
  targetType: Activity["targetType"],
  targetId: ID,
  targetLabel: string,
  meta?: Record<string, unknown>,
): Promise<Activity> {
  return db.activities.create(orgId, actorId, {
    type,
    actorId,
    targetType,
    targetId,
    targetLabel,
    meta,
  }) as Promise<Activity>;
}

async function notify(
  orgId: ID,
  userId: ID,
  type: NotificationType,
  title: string,
  body: string,
  targetType?: string,
  targetId?: ID,
): Promise<AppNotification> {
  return db.notifications.create(orgId, "system", {
    userId,
    type,
    title,
    body,
    read: false,
    targetType,
    targetId,
  }) as Promise<AppNotification>;
}

// ---- Deal Won ---------------------------------------------------------------

/**
 * Deal Won trigger:
 *  1. Promote customer to "customer" lifecycle + active status
 *  2. Create a project for the deal
 *  3. Assign a project manager (default: first PM in the org)
 *  4. Generate a starter task template
 *  5. Link deal.projectId back to the new project
 *  6. Activity log + notify the PM
 */
export async function onDealWon(orgId: ID, actorId: ID, dealId: ID): Promise<{ project: Project }> {
  const deal = (await db.deals.get(orgId, dealId)) as Deal | null;
  if (!deal) throw new Error("Deal not found");

  // 1. Promote customer
  if (deal.customerId) {
    await db.customers.update(orgId, actorId, deal.customerId, {
      status: "active",
      lifecycleStage: "customer",
    });
  }

  // 3. Find a project manager in the org
  const pm = getState().users.find((u) => u.role === "project_manager") ?? null;
  const managerId = pm?.id ?? actorId;

  // 2. Create project
  const project = (await db.projects.create(orgId, actorId, {
    name: deal.title,
    description: `Auto-created from deal “${deal.title}”.`,
    customerId: deal.customerId,
    dealId: deal.id,
    status: "Planning",
    managerId,
    memberIds: [managerId],
    progress: 0,
    budgetHours: Math.max(40, Math.round(deal.value / 1500)),
    color: "#4f46e5",
  })) as Project;

  // 4. Generate task template
  const template: Array<Pick<Task, "title" | "type" | "priority">> = [
    { title: "Kickoff & requirements gathering", type: "Project", priority: "High" },
    { title: "Discovery workshop", type: "Project", priority: "Medium" },
    { title: "Design & architecture", type: "Project", priority: "High" },
    { title: "Implementation", type: "Project", priority: "Medium" },
    { title: "QA & launch", type: "Project", priority: "High" },
  ];
  for (const t of template) {
    await db.tasks.create(orgId, actorId, {
      title: t.title,
      projectId: project.id,
      customerId: deal.customerId,
      assigneeId: managerId,
      reporterId: actorId,
      status: "Backlog",
      priority: t.priority,
      type: t.type,
      subtasks: [],
      dependencies: [],
      tags: ["auto-generated"],
      order: 0,
      estimateHours: 16,
    });
  }

  // 5. Link back
  await db.deals.update(orgId, actorId, deal.id, {
    stage: "Onboarding",
    won: true,
    probability: 100,
    projectId: project.id,
  });

  // 6. Activity + notify PM
  await logActivity(
    orgId,
    actorId,
    "deal_won",
    "deal",
    deal.id,
    `${deal.title} · $${deal.value.toLocaleString()}`,
    { projectId: project.id },
  );
  await logActivity(
    orgId,
    actorId,
    "project_created",
    "project",
    project.id,
    `Project “${project.name}” auto-created`,
    { dealId: deal.id },
  );
  if (pm) {
    await notify(
      orgId,
      pm.id,
      "deal_won",
      "Deal won 🎉",
      `“${deal.title}” was won. A new project was created for you.`,
      "project",
      project.id,
    );
  }

  return { project };
}

// ---- Task Completion --------------------------------------------------------

/**
 * Task Completion trigger:
 *  1. Mark task done + completedAt
 *  2. Recompute parent project progress (done/total)
 *  3. Activity log
 */
export async function onTaskComplete(orgId: ID, actorId: ID, taskId: ID): Promise<void> {
  const task = (await db.tasks.get(orgId, taskId)) as Task | null;
  if (!task) return;

  await db.tasks.update(orgId, actorId, taskId, {
    status: "Done",
    completedAt: nowISO(),
  });

  if (task.projectId) {
    const projectTasks = getState().tasks.filter(
      (t) => t.projectId === task.projectId && t.organizationId === orgId,
    );
    const done = projectTasks.filter((t) => t.status === "Done").length + 1; // incl. this one
    const total = projectTasks.length;
    const progress = total > 0 ? Math.round((done / total) * 100) : 0;
    await db.projects.update(orgId, actorId, task.projectId, { progress });
  }

  await logActivity(
    orgId,
    actorId,
    "task_completed",
    "task",
    task.id,
    task.title,
    { projectId: task.projectId },
  );
}

// ---- Time Approval ----------------------------------------------------------

/**
 * Time Approval trigger:
 *  1. Approve the time entry (set status + approver)
 *  2. Find or create the current weekly payout batch
 *  3. Add (or merge) a payout line for this user → rate × hours
 *  4. Recompute batch total
 *  5. Activity log + notify the user
 */
export async function onTimeApproved(
  orgId: ID,
  actorId: ID,
  timeEntryId: ID,
): Promise<void> {
  const entry = getState().timeEntries.find((e) => e.id === timeEntryId);
  if (!entry) return;

  await db.timeEntries.update(orgId, actorId, timeEntryId, {
    approval: "Approved",
    approvedBy: actorId,
    approvedAt: nowISO(),
  });

  const hours = entry.duration / 3600;
  const rate = entry.hourlyRate ?? 0;
  const amount = +(hours * rate).toFixed(2);

  // Current ISO week (Monday)
  const d = new Date();
  const day = d.getUTCDay(); // 0 Sun .. 6 Sat
  const diff = (day + 6) % 7; // days since Monday
  const monday = new Date(d);
  monday.setUTCDate(d.getUTCDate() - diff);
  monday.setUTCHours(0, 0, 0, 0);
  const weekStart = monday.toISOString();

  let batch = getState().payouts.find(
    (p) => p.organizationId === orgId && p.weekStart === weekStart,
  );

  if (!batch) {
    const created = await db.payouts.create(orgId, actorId, {
      weekStart,
      status: "Pending",
      lines: [],
      total: 0,
      currency: "USD",
      provider: "wise_demo",
    });
    batch = created as Payout;
  }

  // Merge into an existing line for the same user, else append.
  const lines = [...batch.lines];
  const existing = lines.find((l) => l.userId === entry.userId);
  if (existing) {
    existing.hours = +(existing.hours + hours).toFixed(2);
    existing.amount = +(existing.amount + amount).toFixed(2);
    existing.timeEntryIds.push(entry.id);
  } else {
    lines.push({ userId: entry.userId, hours, rate, amount, timeEntryIds: [entry.id] });
  }
  const total = +lines.reduce((sum, l) => sum + l.amount, 0).toFixed(2);

  await db.payouts.update(orgId, actorId, batch.id, { lines, total });

  await logActivity(
    orgId,
    actorId,
    "time_approved",
    "time",
    entry.id,
    `${hours}h${entry.description ? ` · ${entry.description}` : ""} → +$${amount}`,
    { payoutId: batch.id, userId: entry.userId },
  );
  await notify(
    orgId,
    entry.userId,
    "time_approved",
    "Time approved",
    `Your ${hours}h entry was approved and added to this week's payout.`,
    "time",
    entry.id,
  );
}

/** Trigger runner keyed by event name — used by server actions. */
export const triggers = {
  dealWon: onDealWon,
  taskComplete: onTaskComplete,
  timeApproved: onTimeApproved,
};

export const SYSTEM_ACTOR = "system" satisfies ID;
export const ORG = ORG_ID;
