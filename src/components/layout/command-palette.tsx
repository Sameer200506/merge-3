"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator } from "@/components/ui/command";
import { NAV_GROUPS, ALL_NAV_ITEMS, APP_NAME } from "@/lib/constants";

/** Ctrl+K / Cmd+K command palette for quick navigation across all modules. */
export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const run = useCallback(
    (href: string) => {
      setOpen(false);
      router.push(href);
    },
    [router],
  );

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder={`Search ${APP_NAME}...`} />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        {NAV_GROUPS.map((group) => (
          <CommandGroup key={group.label} heading={group.label}>
            {group.items.map((item) => (
              <CommandItem
                key={item.href}
                value={`${item.title} ${item.href}`}
                onSelect={() => run(item.href)}
              >
                <item.icon className="mr-2 h-4 w-4 text-muted-foreground" />
                <span>{item.title}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        ))}
        <CommandSeparator />
        <CommandGroup heading="Help">
          <CommandItem onSelect={() => run("/settings")}>
            Settings
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
