/**
 * Data-access facade. This is the ONLY import the application uses to reach data.
 *
 * It currently points at the mock repository, but the whole point of the
 * Repository interface is that flipping to a real Firebase backend means
 * implementing `createFirestoreRepository` for each collection and swapping the
 * exports below — nothing in the app layer changes.
 */

import type { CollectionName } from "./types";
import type { Repository } from "./repository";
import { createMockRepository } from "./mock/repository";
import { getState, resetState } from "./mock/store-state";

export type { Repository, QueryOptions, WhereClause } from "./repository";
export * from "./types";

/** Typed repository accessor for any collection. */
export function repo<C extends CollectionName>(collection: C): Repository<C> {
  return createMockRepository(collection);
}

/** Convenience repositories used across modules. */
export const db = {
  organizations: repo("organizations"),
  users: repo("users"),
  customers: repo("customers"),
  contacts: repo("contacts"),
  pipelines: repo("pipelines"),
  deals: repo("deals"),
  projects: repo("projects"),
  tasks: repo("tasks"),
  timeEntries: repo("timeEntries"),
  payouts: repo("payouts"),
  activities: repo("activities"),
  comments: repo("comments"),
  notifications: repo("notifications"),
  files: repo("files"),
  subscriptions: repo("subscriptions"),
  auditLogs: repo("auditLogs"),
};

export { getState, resetState };
