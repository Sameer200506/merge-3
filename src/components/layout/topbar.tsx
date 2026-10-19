"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Menu, Search, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "./theme-toggle";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuthStore } from "@/store/auth-store";
import { canAccessRoute, ROLE_LABELS } from "@/lib/auth/roles";
import { NAV_GROUPS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MobileSidebar } from "./mobile-sidebar";

export function Topbar() {
  const pathname = usePathname();
  const user = useAuthStore((s) => s.user);
  const router = useRouter();

  // Resolve current page name from pathname
  const currentLabel = (() => {
    for (const g of NAV_GROUPS) {
      for (const item of g.items) {
        if (item.href === pathname || (item.href !== "/dashboard" && pathname.startsWith(item.href))) {
          return item.title;
        }
      }
    }
    return "Dashboard";
  })();

  return (
    <header className="sticky top-0 z-40 flex h-14 items-center gap-3 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 lg:px-6">
      {/* Mobile menu trigger */}
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="lg:hidden">
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-64 p-0">
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <MobileSidebar />
        </SheetContent>
      </Sheet>

      {/* Breadcrumb */}
      <nav className="hidden sm:flex items-center gap-1.5 text-sm">
        <Link href="/dashboard" className="text-muted-foreground hover:text-foreground transition-colors">
          StartupOS
        </Link>
        <span className="text-muted-foreground">/</span>
        <span className="font-medium">{currentLabel}</span>
      </nav>

      <div className="flex-1" />

      {/* Search button (triggers command palette) */}
      <Button
        variant="outline"
        className="hidden sm:inline-flex h-8 w-64 justify-start gap-2 text-muted-foreground font-normal"
        onClick={() => {
          // Dispatch Cmd+K
          document.dispatchEvent(
            new KeyboardEvent("keydown", { key: "k", metaKey: true, bubbles: true }),
          );
        }}
      >
        <Search className="h-3.5 w-3.5" />
        <span className="text-xs">Search...</span>
        <kbd className="ml-auto pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
          <span className="text-xs">⌘</span>K
        </kbd>
      </Button>

      {/* Notifications shortcut */}
      <Button variant="ghost" size="icon" className="relative" onClick={() => router.push("/notifications")}>
        <Bell className="h-4 w-4" />
      </Button>

      {/* Theme toggle */}
      <ThemeToggle />

      {/* User dropdown */}
      {user && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-8 w-8 rounded-full">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                  {user.name
                    .split(" ")
                    .map((p) => p[0])
                    .join("")
                    .toUpperCase()
                    .slice(0, 2)}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{user.name}</p>
                <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                <p className="text-xs leading-none text-muted-foreground">
                  {ROLE_LABELS[user.role]}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push("/settings")}>Settings</DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push("/notifications")}>Notifications</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push("/")}>Sign out</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </header>
  );
}
