/**
 * Server-side session resolution for mock auth. There is no real auth cookie in
 * demo mode; instead we resolve the demo org + users from the seed data so server
 * components can render tenant-scoped data immediately. The client-side store
 * (auth-store) drives the active user for interactions.
 */

import { db, getState } from "@/lib/db";
import { ORG_ID } from "@/lib/db/mock/store";
import type { Organization, User } from "@/lib/db/types";

/** The single demo organization used throughout the MVP. */
export async function getCurrentOrganization(): Promise<Organization> {
  const org = await db.organizations.get(ORG_ID, ORG_ID);
  if (!org) throw new Error("Demo organization not found");
  return org;
}

/** All demo users for the role switcher / login picker. */
export async function getDemoUsers(): Promise<User[]> {
  return db.users.list(ORG_ID, { orderBy: { field: "createdAt", direction: "asc" } });
}

/** A sensible default session user (the owner) for initial server renders. */
export async function getDefaultSessionUser(): Promise<User> {
  const users = await getDemoUsers();
  return users.find((u) => u.role === "owner") ?? users[0];
}

/** Synchronous access to the demo org id for server actions / modules. */
export function getOrgId(): string {
  return ORG_ID;
}

/** Convenience: list users synchronously (used in tightly coupled places). */
export function getUsersSync(): User[] {
  return getState().users.filter((u) => u.organizationId === ORG_ID);
}
