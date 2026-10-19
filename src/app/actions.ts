"use server";

/**
 * Server actions — the single mutation surface for the app. Every write goes
 * through here so audit fields, tenant scoping, and automation triggers are
 * applied consistently. After a mutation we revalidate the router path so the
 * next server render reflects the change (and TanStack Query refetches).
 */

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getOrgId } from "@/lib/auth/session";
import { triggers } from "@/lib/automation";
import type { Comment, ID, Task } from "@/lib/db/types";
import { logActivity } from "@/lib/activity";

const ORG = () => getOrgId();

function refresh(path?: string) {
  if (path) revalidatePath(path);
  else revalidatePath("/", "layout");
}

// ---- CRM --------------------------------------------------------------------

export async function createCustomer(
  actorId: ID,
  data: { name: string; company?: string; email?: string; phone?: string; website?: string; tags?: string[] },
) {
  const customer = await db.customers.create(ORG(), actorId, {
    name: data.name,
    company: data.company,
    email: data.email,
    phone: data.phone,
    website: data.website,
    status: "lead",
    tags: data.tags ?? [],
    lifecycleStage: "lead",
  });
  await logActivity(ORG(), actorId, "customer_created", "customer", customer.id, customer.name);
  refresh("/customers");
  return customer;
}

export async function updateCustomer(actorId: ID, id: ID, patch: Parameters<typeof db.customers.update>[3]) {
  const updated = await db.customers.update(ORG(), actorId, id, patch);
  refresh(`/customers`);
  return updated;
}

export async function deleteCustomer(actorId: ID, id: ID) {
  await db.customers.remove(ORG(), id);
  refresh("/customers");
}

export async function createDeal(
  actorId: ID,
  data: {
    title: string;
    customerId: ID;
    pipelineId: ID;
    stage: string;
    value: number;
    ownerId: ID;
    expectedCloseDate?: string;
    probability?: number;
  },
) {
  const deal = await db.deals.create(ORG(), actorId, {
    title: data.title,
    customerId: data.customerId,
    pipelineId: data.pipelineId,
    stage: data.stage,
    value: data.value,
    currency: "USD",
    ownerId: data.ownerId,
    expectedCloseDate: data.expectedCloseDate,
    probability: data.probability ?? 10,
  });
  await logActivity(ORG(), actorId, "deal_created", "deal", deal.id, deal.title);
  refresh("/pipeline");
  return deal;
}

export async function updateDeal(actorId: ID, id: ID, patch: Parameters<typeof db.deals.update>[3]) {
  const before = await db.deals.get(ORG(), id);
  const updated = await db.deals.update(ORG(), actorId, id, patch);
  if (before && before.stage !== updated.stage) {
    await logActivity(
      ORG(),
      actorId,
      "deal_stage_changed",
      "deal",
      id,
      `${updated.title} → ${updated.stage}`,
      { from: before.stage, to: updated.stage },
    );
  }
  refresh("/pipeline");
  return updated;
}

/**
 * Move a deal to a new pipeline stage. Used by the drag-and-drop kanban.
 * If the target stage is "Won", fire the Deal Won automation.
 */
export async function moveDeal(actorId: ID, id: ID, stage: string) {
  const deal = await db.deals.get(ORG(), id);
  if (!deal) throw new Error("Deal not found");

  const isWon = stage === "Won" || stage === "Onboarding" || stage === "Delivery" || stage === "Completed";

  if (!deal.won && isWon) {
    // Deal Won automation creates the project, links it back, etc.
    await triggers.dealWon(ORG(), actorId, id);
  } else {
    await updateDeal(actorId, id, { stage });
  }
  refresh("/pipeline");
}

export async function deleteDeal(actorId: ID, id: ID) {
  await db.deals.remove(ORG(), id);
  refresh("/pipeline");
}

// ---- Projects ---------------------------------------------------------------

export async function createProject(
  actorId: ID,
  data: {
    name: string;
    description?: string;
    customerId: ID;
    status: (typeof import("@/lib/constants").PROJECT_STATUSES)[number];
    managerId: ID;
    memberIds: ID[];
    budgetHours?: number;
    startDate?: string;
    dueDate?: string;
  },
) {
  const project = await db.projects.create(ORG(), actorId, {
    name: data.name,
    description: data.description,
    customerId: data.customerId,
    status: data.status,
    managerId: data.managerId,
    memberIds: data.memberIds,
    progress: 0,
    budgetHours: data.budgetHours,
    startDate: data.startDate,
    dueDate: data.dueDate,
    color: "#4f46e5",
  });
  await logActivity(ORG(), actorId, "project_created", "project", project.id, project.name);
  refresh("/projects");
  return project;
}

export async function updateProject(actorId: ID, id: ID, patch: Parameters<typeof db.projects.update>[3]) {
  const updated = await db.projects.update(ORG(), actorId, id, patch);
  refresh(`/projects`);
  return updated;
}

export async function deleteProject(actorId: ID, id: ID) {
  await db.projects.remove(ORG(), id);
  refresh("/projects");
}

// ---- Tasks ------------------------------------------------------------------

export async function createTask(
  actorId: ID,
  data: {
    title: string;
    description?: string;
    projectId?: ID;
    customerId?: ID;
    assigneeId?: ID;
    status: string;
    priority: string;
    type: string;
    estimateHours?: number;
    dueDate?: string;
    tags?: string[];
  },
) {
  const task = await db.tasks.create(ORG(), actorId, {
    title: data.title,
    description: data.description,
    projectId: data.projectId,
    customerId: data.customerId,
    assigneeId: data.assigneeId,
    reporterId: actorId,
    status: data.status as Task["status"],
    priority: data.priority as Task["priority"],
    type: data.type as Task["type"],
    subtasks: [],
    dependencies: [],
    tags: data.tags ?? [],
    order: 0,
    estimateHours: data.estimateHours,
    dueDate: data.dueDate,
  });

  await logActivity(ORG(), actorId, "task_created", "task", task.id, task.title);
  if (task.assigneeId && task.assigneeId !== actorId) {
    await db.notifications.create(ORG(), actorId, {
      userId: task.assigneeId,
      type: "task_assigned",
      title: "New task assigned",
      body: `You were assigned “${task.title}”.`,
      read: false,
      targetType: "task",
      targetId: task.id,
    });
    await logActivity(ORG(), actorId, "task_assigned", "task", task.id, task.title, { assigneeId: task.assigneeId });
  }
  refresh("/tasks");
  return task;
}

export async function updateTask(actorId: ID, id: ID, patch: Parameters<typeof db.tasks.update>[3]) {
  const updated = await db.tasks.update(ORG(), actorId, id, patch);
  refresh("/tasks");
  return updated;
}

/** Toggle a task's done state, firing the Task Completion automation on done. */
export async function toggleTaskDone(actorId: ID, id: ID, done: boolean) {
  if (done) {
    await triggers.taskComplete(ORG(), actorId, id);
  } else {
    await db.tasks.update(ORG(), actorId, id, { status: "To Do", completedAt: undefined });
  }
  refresh("/tasks");
}

export async function moveTask(actorId: ID, id: ID, status: string) {
  if (status === "Done") {
    await triggers.taskComplete(ORG(), actorId, id);
  } else {
    await db.tasks.update(ORG(), actorId, id, { status: status as Task["status"], completedAt: undefined });
  }
  refresh("/tasks");
}

export async function deleteTask(actorId: ID, id: ID) {
  await db.tasks.remove(ORG(), id);
  refresh("/tasks");
}

// ---- Time tracking ----------------------------------------------------------

export async function createTimeEntry(
  actorId: ID,
  data: {
    taskId?: ID;
    projectId?: ID;
    description?: string;
    durationSeconds: number;
    billable?: boolean;
    hourlyRate?: number;
    startedAt?: string;
    endedAt?: string;
  },
) {
  const entry = await db.timeEntries.create(ORG(), actorId, {
    userId: actorId,
    taskId: data.taskId,
    projectId: data.projectId,
    description: data.description,
    duration: data.durationSeconds,
    startedAt: data.startedAt,
    endedAt: data.endedAt,
    billable: data.billable ?? true,
    hourlyRate: data.hourlyRate,
    approval: "Pending",
  });
  await logActivity(
    ORG(),
    actorId,
    "time_logged",
    "time",
    entry.id,
    `${Math.round(data.durationSeconds / 3600 * 10) / 10}h logged`,
  );
  refresh("/time");
  return entry;
}

export async function updateTimeEntry(actorId: ID, id: ID, patch: Parameters<typeof db.timeEntries.update>[3]) {
  const updated = await db.timeEntries.update(ORG(), actorId, id, patch);
  refresh("/time");
  return updated;
}

/** Approve a time entry → fires the Time Approval automation (adds to payout batch). */
export async function approveTimeEntry(actorId: ID, id: ID) {
  await triggers.timeApproved(ORG(), actorId, id);
  refresh("/time");
  refresh("/payouts");
}

export async function rejectTimeEntry(actorId: ID, id: ID) {
  await db.timeEntries.update(ORG(), actorId, id, { approval: "Rejected" });
  await logActivity(ORG(), actorId, "time_rejected", "time", id, "Time entry rejected");
  refresh("/time");
}

export async function deleteTimeEntry(actorId: ID, id: ID) {
  await db.timeEntries.remove(ORG(), id);
  refresh("/time");
}

// ---- Payouts ----------------------------------------------------------------

export async function approvePayout(actorId: ID, id: ID) {
  const updated = await db.payouts.update(ORG(), actorId, id, {
    status: "Approved",
    approvedBy: actorId,
  });
  await logActivity(ORG(), actorId, "payout_approved", "payout", id, "Payout batch approved");
  refresh("/payouts");
  return updated;
}

/** Simulate a Wise transfer — marks the batch Paid with a fake transfer ref. */
export async function payPayout(actorId: ID, id: ID) {
  const updated = await db.payouts.update(ORG(), actorId, id, {
    status: "Paid",
    approvedBy: actorId,
    paidAt: new Date().toISOString(),
    transferRef: `WISE-DEMO-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
  });
  await logActivity(ORG(), actorId, "payout_paid", "payout", id, `Payout paid · $${updated.total.toLocaleString()}`);
  refresh("/payouts");
  return updated;
}

export async function generateWeeklyBatch(actorId: ID) {
  const now = new Date();
  const day = now.getUTCDay();
  const diff = (day + 6) % 7;
  const monday = new Date(now);
  monday.setUTCDate(now.getUTCDate() - diff);
  monday.setUTCHours(0, 0, 0, 0);
  const weekStart = monday.toISOString();

  const batch = await db.payouts.create(ORG(), actorId, {
    weekStart,
    status: "Pending",
    lines: [],
    total: 0,
    currency: "USD",
    provider: "wise_demo",
  });
  await logActivity(ORG(), actorId, "payout_created", "payout", batch.id, "Weekly payout batch generated");
  refresh("/payouts");
  return batch;
}

// ---- Comments / notifications ----------------------------------------------

export async function addComment(
  actorId: ID,
  data: { targetType: Comment["targetType"]; targetId: ID; body: string },
) {
  const comment = await db.comments.create(ORG(), actorId, {
    targetType: data.targetType,
    targetId: data.targetId,
    authorId: actorId,
    body: data.body,
  });
  await logActivity(ORG(), actorId, "comment_added", "comment", comment.id, "Comment added");
  refresh("/");
  return comment;
}

export async function markNotificationRead(actorId: ID, id: ID, read = true) {
  await db.notifications.update(ORG(), actorId, id, { read });
  refresh("/notifications");
}

export async function markAllNotificationsRead(actorId: ID, userId: ID) {
  const notifs = await db.notifications.list(ORG(), {
    where: [{ field: "userId", op: "==", value: userId }],
  });
  for (const n of notifs) {
    if (!n.read) await db.notifications.update(ORG(), actorId, n.id, { read: true });
  }
  refresh("/notifications");
}
