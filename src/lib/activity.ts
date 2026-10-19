import "server-only";

import { db } from "@/lib/db";
import type { Activity, ActivityType, ID } from "@/lib/db/types";

/**
 * Activity-log writer used by server actions. The automation triggers have
 * their own copy for cohesion; this one is the shared entry point for ad-hoc
 * mutations (deal created, comment added, etc.).
 */
export async function logActivity(
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
