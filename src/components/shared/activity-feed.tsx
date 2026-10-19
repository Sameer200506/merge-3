"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { formatRelative } from "@/lib/format";
import { UserAvatar } from "@/components/shared/user-avatar";
import type { Activity, ActivityType, User } from "@/lib/db/types";
import {
  Trophy,
  UserPlus,
  FolderPlus,
  CheckSquare,
  Clock,
  CircleDollarSign,
  MessageSquare,
  TrendingUp,
  ArrowRightLeft,
  XCircle,
} from "lucide-react";

const ICONS: Partial<Record<ActivityType, typeof Trophy>> = {
  deal_won: Trophy,
  deal_created: TrendingUp,
  deal_stage_changed: ArrowRightLeft,
  deal_lost: XCircle,
  customer_created: UserPlus,
  project_created: FolderPlus,
  task_created: CheckSquare,
  task_completed: CheckSquare,
  task_assigned: CheckSquare,
  time_logged: Clock,
  time_approved: CircleDollarSign,
  time_rejected: XCircle,
  payout_created: CircleDollarSign,
  payout_approved: CircleDollarSign,
  payout_paid: CircleDollarSign,
  comment_added: MessageSquare,
  file_uploaded: MessageSquare,
};

const ACCENTS: Partial<Record<ActivityType, string>> = {
  deal_won: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
  payout_paid: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
  payout_approved: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
  time_approved: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
  deal_lost: "bg-red-500/15 text-red-600 dark:text-red-400",
  time_rejected: "bg-red-500/15 text-red-600 dark:text-red-400",
  customer_created: "bg-sky-500/15 text-sky-600 dark:text-sky-400",
  project_created: "bg-violet-500/15 text-violet-600 dark:text-violet-400",
  deal_stage_changed: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
};

interface ActivityFeedProps {
  activities: Activity[];
  users: Record<string, User>;
  /** Optional link target for each item; falls back to no link. */
  hrefFor?: (a: Activity) => string | null;
  className?: string;
  emptyLabel?: string;
}

/** Renders the cross-cutting activity timeline used on the dashboard + /activity. */
export function ActivityFeed({ activities, users, hrefFor, className, emptyLabel }: ActivityFeedProps) {
  if (activities.length === 0) {
    return (
      <p className={cn("py-8 text-center text-sm text-muted-foreground", className)}>
        {emptyLabel ?? "No activity yet."}
      </p>
    );
  }
  return (
    <ol className={cn("space-y-1", className)}>
      {activities.map((a, i) => {
        const actor = users[a.actorId];
        const Icon = ICONS[a.type] ?? TrendingUp;
        const accent = ACCENTS[a.type] ?? "bg-muted text-muted-foreground";
        const href = hrefFor?.(a) ?? null;
        const node = (
          <div className="flex items-start gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-accent/40">
            <div className="relative mt-0.5">
              <UserAvatar user={actor} size="sm" />
              <span
                className={cn(
                  "absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full border-2 border-background",
                  accent,
                )}
              >
                <Icon className="h-2.5 w-2.5" />
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm leading-snug">
                <span className="font-medium">{actor?.name ?? "Someone"}</span>{" "}
                <span className="text-muted-foreground">{verbFor(a.type)}</span>{" "}
                <span className="font-medium">{a.targetLabel}</span>
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">{formatRelative(a.createdAt)}</p>
            </div>
          </div>
        );
        return (
          <li key={a.id}>
            {href ? <Link href={href}>{node}</Link> : node}
            {i < activities.length - 1 && <div className="ml-[15px] h-3 w-px bg-border" />}
          </li>
        );
      })}
    </ol>
  );
}

function verbFor(type: ActivityType): string {
  switch (type) {
    case "deal_won":
      return "won the deal";
    case "deal_lost":
      return "lost the deal";
    case "deal_created":
      return "created deal";
    case "deal_stage_changed":
      return "moved";
    case "customer_created":
      return "added customer";
    case "project_created":
      return "created project";
    case "task_created":
      return "created task";
    case "task_completed":
      return "completed";
    case "task_assigned":
      return "assigned";
    case "time_logged":
      return "logged time on";
    case "time_approved":
      return "approved time on";
    case "time_rejected":
      return "rejected time on";
    case "payout_created":
      return "generated payout";
    case "payout_approved":
      return "approved payout";
    case "payout_paid":
      return "paid payout";
    case "comment_added":
      return "commented on";
    case "file_uploaded":
      return "uploaded";
    default:
      return "updated";
  }
}
