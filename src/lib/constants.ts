import {
  LayoutDashboard,
  Users,
  KanbanSquare,
  FolderKanban,
  ListChecks,
  Timer,
  Wallet,
  Activity,
  Bell,
  Search,
  Settings,
} from "lucide-react";

export const APP_NAME = "StartupOS";

export type NavItem = {
  title: string;
  href: string;
  icon: typeof LayoutDashboard;
  /** Roles allowed to see this item. Empty = all roles. */
  roles?: string[];
};

export type NavGroup = {
  label: string;
  items: NavItem[];
};

export const NAV_GROUPS: NavGroup[] = [
  {
    label: "Workspace",
    items: [
      { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
      { title: "Search", href: "/search", icon: Search },
      { title: "Activity", href: "/activity", icon: Activity },
      { title: "Notifications", href: "/notifications", icon: Bell },
    ],
  },
  {
    label: "CRM",
    items: [
      { title: "Customers", href: "/customers", icon: Users },
      { title: "Pipeline", href: "/pipeline", icon: KanbanSquare },
    ],
  },
  {
    label: "Delivery",
    items: [
      { title: "Projects", href: "/projects", icon: FolderKanban },
      { title: "Tasks", href: "/tasks", icon: ListChecks },
      { title: "Time Tracking", href: "/time", icon: Timer },
    ],
  },
  {
    label: "Finance",
    items: [
      {
        title: "Payouts",
        href: "/payouts",
        icon: Wallet,
        roles: ["owner", "admin"],
      },
    ],
  },
  {
    label: "System",
    items: [
      {
        title: "Settings",
        href: "/settings",
        icon: Settings,
        roles: ["owner", "admin"],
      },
    ],
  },
];

/** All top-level routes for the global command palette + search indexing. */
export const ALL_NAV_ITEMS = NAV_GROUPS.flatMap((g) => g.items);

// ---- Domain enums ------------------------------------------------------------

export const PIPELINE_STAGES = [
  "Lead",
  "Qualified",
  "Demo",
  "Proposal",
  "Negotiation",
  "Won",
  "Onboarding",
  "Delivery",
  "Completed",
] as const;

export const PROJECT_STATUSES = ["Planning", "Active", "Review", "Completed"] as const;

export const TASK_STATUSES = ["Backlog", "To Do", "In Progress", "Review", "Done"] as const;

export const TASK_PRIORITIES = ["Low", "Medium", "High", "Urgent"] as const;

export const TASK_TYPES = ["Sales", "Project", "Support"] as const;

export const PAYOUT_STATUSES = ["Pending", "Approved", "Processing", "Paid"] as const;

export const TIME_APPROVAL_STATUSES = ["Pending", "Approved", "Rejected"] as const;

/** Stage colors for the kanban board. Indigo accent for Won. */
export const STAGE_COLORS: Record<string, string> = {
  Lead: "bg-slate-400",
  Qualified: "bg-sky-500",
  Demo: "bg-cyan-500",
  Proposal: "bg-violet-500",
  Negotiation: "bg-amber-500",
  Won: "bg-indigo-600",
  Onboarding: "bg-emerald-500",
  Delivery: "bg-teal-500",
  Completed: "bg-green-600",
};

export const PROJECT_STATUS_COLORS: Record<string, string> = {
  Planning: "bg-sky-500",
  Active: "bg-indigo-600",
  Review: "bg-amber-500",
  Completed: "bg-green-600",
};

export const PRIORITY_COLORS: Record<string, string> = {
  Low: "bg-slate-400",
  Medium: "bg-sky-500",
  High: "bg-amber-500",
  Urgent: "bg-red-500",
};
