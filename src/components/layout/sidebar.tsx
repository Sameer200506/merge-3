"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { NAV_GROUPS } from "@/lib/constants";
import { canAccessRoute, ROLE_LABELS } from "@/lib/auth/roles";
import { useAuthStore } from "@/store/auth-store";
import { useState } from "react";

/** Sidebar navigation with grouped, role-filtered links. */
export function Sidebar() {
  const pathname = usePathname();
  const user = useAuthStore((s) => s.user);

  return (
    <div className="hidden lg:flex h-full w-64 flex-col border-r bg-card">
      {/* Brand */}
      <div className="flex h-14 items-center gap-2 border-b px-4">
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground text-xs font-bold">
          S
        </div>
        <span className="font-semibold text-sm">StartupOS</span>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 py-2">
        <nav className="space-y-1 px-2">
          {NAV_GROUPS.map((group) => {
            const visible = group.items.filter((item) =>
              canAccessRoute(user?.role, item.roles),
            );
            if (visible.length === 0) return null;
            return (
              <SidebarGroup
                key={group.label}
                label={group.label}
                items={visible}
                pathname={pathname}
              />
            );
          })}
        </nav>
      </ScrollArea>

      {/* User badge */}
      {user && (
        <div className="border-t p-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-semibold">
              {user.name
                .split(" ")
                .map((p) => p[0])
                .join("")
                .toUpperCase()
                .slice(0, 2)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-medium">{user.name}</p>
              <p className="truncate text-[10px] text-muted-foreground">
                {ROLE_LABELS[user.role]}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SidebarGroup({
  label,
  items,
  pathname,
}: {
  label: string;
  items: typeof NAV_GROUPS[number]["items"];
  pathname: string;
}) {
  return (
    <Accordion type="multiple" defaultValue={[label]} className="px-0">
      <AccordionItem value={label} className="border-none">
        <AccordionTrigger className="py-1.5 px-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground hover:no-underline">
          {label}
        </AccordionTrigger>
        <AccordionContent className="pb-1 pt-0">
          <div className="space-y-0.5">
            {items.map((item) => {
              const active = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm font-medium transition-colors",
                    active
                      ? "bg-accent text-accent-foreground"
                      : "text-muted-foreground hover:bg-accent/50 hover:text-foreground",
                  )}
                >
                  <item.icon className={cn("h-4 w-4 shrink-0", active && "text-primary")} />
                  {item.title}
                </Link>
              );
            })}
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
