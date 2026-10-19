"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Bell, Trophy, Clock, CircleDollarSign, AtSign } from "lucide-react";
import { cn } from "@/lib/utils";
import { markNotificationRead } from "@/app/actions";
import { useAuthStore } from "@/store/auth-store";
import { formatRelative } from "@/lib/format";
import type { AppNotification, NotificationType } from "@/lib/db/types";

const ICONS: Partial<Record<NotificationType, typeof Bell>> = {
  task_assigned: Bell,
  deal_won: Trophy,
  time_approved: Clock,
  time_rejected: Clock,
  payout_generated: CircleDollarSign,
  mention: AtSign,
};

/** Single notification row. Clicking marks it read and navigates to its target. */
export function NotificationItem({ notification }: { notification: AppNotification }) {
  const [pending, startTransition] = useTransition();
  const user = useAuthStore((s) => s.user);
  const router = useRouter();
  const Icon = ICONS[notification.type] ?? Bell;
  const href = notification.targetType && notification.targetId ? targetHref(notification) : null;

  const handleClick = () => {
    if (!notification.read) {
      startTransition(async () => {
        await markNotificationRead(user!.id, notification.id);
        router.refresh();
      });
    }
  };

  const content = (
    <div
      className={cn(
        "flex items-start gap-3 rounded-lg border p-4 transition-colors hover:bg-accent/40",
        !notification.read && "border-primary/30 bg-primary/5",
      )}
    >
      <div className={cn("mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full", !notification.read ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground")}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium">{notification.title}</p>
          {!notification.read && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />}
        </div>
        {notification.body ? <p className="mt-0.5 text-sm text-muted-foreground">{notification.body}</p> : null}
        <p className="mt-1 text-xs text-muted-foreground">{formatRelative(notification.createdAt)}</p>
      </div>
    </div>
  );

  if (href) {
    return (
      <Link href={href} onClick={handleClick}>
        {content}
      </Link>
    );
  }
  return <div onClick={handleClick}>{content}</div>;
}

function targetHref(n: AppNotification): string | null {
  switch (n.targetType) {
    case "task":
      return "/tasks";
    case "deal":
      return "/pipeline";
    case "project":
      return "/projects";
    case "time":
      return "/time";
    case "payout":
      return "/payouts";
    case "customer":
      return "/customers";
    default:
      return null;
  }
}
