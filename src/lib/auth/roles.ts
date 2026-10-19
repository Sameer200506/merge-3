import type { OrgRole } from "@/lib/db/types";

/**
 * Role → permission matrix. Drives both nav visibility and per-action
 * authorization in the UI. Mirrors the PRD role definitions.
 */

export type Permission =
  | "org.manage"
  | "users.manage"
  | "crm.manage"
  | "deals.manage"
  | "projects.manage"
  | "tasks.manage"
  | "tasks.assign"
  | "time.track"
  | "time.approve"
  | "payouts.view"
  | "payouts.approve"
  | "settings.view";

export const ROLE_LABELS: Record<OrgRole, string> = {
  owner: "Owner",
  admin: "Admin",
  sales_manager: "Sales Manager",
  project_manager: "Project Manager",
  team_member: "Team Member",
  client: "Client",
};

export const ROLE_PERMISSIONS: Record<OrgRole, Permission[]> = {
  owner: [
    "org.manage",
    "users.manage",
    "crm.manage",
    "deals.manage",
    "projects.manage",
    "tasks.manage",
    "tasks.assign",
    "time.track",
    "time.approve",
    "payouts.view",
    "payouts.approve",
    "settings.view",
  ],
  admin: [
    "users.manage",
    "crm.manage",
    "deals.manage",
    "projects.manage",
    "tasks.manage",
    "tasks.assign",
    "time.track",
    "time.approve",
    "payouts.view",
    "settings.view",
  ],
  sales_manager: ["crm.manage", "deals.manage", "tasks.manage", "time.track"],
  project_manager: ["projects.manage", "tasks.manage", "tasks.assign", "time.track", "time.approve"],
  team_member: ["tasks.manage", "time.track"],
  client: [],
};

export function hasPermission(role: OrgRole | undefined, permission: Permission): boolean {
  if (!role) return false;
  return ROLE_PERMISSIONS[role].includes(permission);
}

export function canAccessRoute(role: OrgRole | undefined, routeRoles: string[] | undefined): boolean {
  if (!routeRoles || routeRoles.length === 0) return true;
  return !!role && routeRoles.includes(role);
}
