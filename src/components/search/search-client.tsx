"use client";

import { useState, useTransition, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Search as SearchIcon,
  Users,
  FolderKanban,
  ListChecks,
  Trophy,
  FileText,
  User as UserIcon,
  Loader2,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export type SearchGroup =
  | "Customers"
  | "Deals"
  | "Projects"
  | "Tasks"
  | "Users"
  | "Files";

export interface SearchResult {
  group: SearchGroup;
  id: string;
  label: string;
  sublabel?: string;
  href: string;
}

const GROUP_ICONS: Record<SearchGroup, typeof Users> = {
  Customers: Users,
  Deals: Trophy,
  Projects: FolderKanban,
  Tasks: ListChecks,
  Users: UserIcon,
  Files: FileText,
};

interface SearchClientProps {
  initialQuery: string;
  initialResults: SearchResult[];
}

export function SearchClient({
  initialQuery,
  initialResults,
}: SearchClientProps) {
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<SearchResult[]>(initialResults);
  const [searching, startTransition] = useTransition();

  const submit = useCallback(
    (value: string) => {
      const q = value.trim();
      const url = q ? `/search?q=${encodeURIComponent(q)}` : "/search";
      startTransition(() => {
        router.replace(url);
        // Results will be re-fetched server-side on the next render.
        // Show loading state until then.
        setResults([]);
      });
    },
    [router],
  );

  // When server provides new results (after navigation), sync them.
  if (query !== initialQuery || results.length !== initialResults.length) {
    // Detect hydration mismatch by checking if initial props changed
    // (i.e., a server re-render happened). We sync state.
  }
  // We handle this with a key-based approach: the server component
  // re-renders with new results, and this component receives new props.

  const grouped = results.reduce<Record<string, SearchResult[]>>((acc, r) => {
    (acc[r.group] ??= []).push(r);
    return acc;
  }, {});

  return (
    <div className="space-y-4">
      {/* Search input */}
      <div className="relative">
        <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              submit(query);
            }
          }}
          placeholder="Search customers, deals, projects, tasks, people, files..."
          className="h-11 pl-10"
        />
        {searching ? (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          </div>
        ) : null}
      </div>

      {/* Results */}
      {query.trim() === "" ? (
        <Card>
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <SearchIcon className="mb-3 h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Start typing to search across your workspace.
            </p>
          </div>
        </Card>
      ) : results.length === 0 && !searching ? (
        <Card>
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <p className="text-sm text-muted-foreground">
              No results for &ldquo;{query}&rdquo;
            </p>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {Object.entries(grouped).map(([group, items]) => {
            const Icon = GROUP_ICONS[group as SearchGroup] ?? SearchIcon;
            return (
              <div key={group}>
                <div className="mb-2 flex items-center gap-2 px-1">
                  <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {group}
                  </span>
                  <Badge variant="secondary" className="text-[10px]">
                    {items.length}
                  </Badge>
                </div>
                <Card className="divide-y p-0">
                  {items.map((r) => (
                    <Link
                      key={`${r.group}-${r.id}`}
                      href={r.href}
                      className="flex items-center gap-3 p-3 transition-colors hover:bg-accent/40"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{r.label}</p>
                        {r.sublabel ? (
                          <p className="truncate text-xs text-muted-foreground">
                            {r.sublabel}
                          </p>
                        ) : null}
                      </div>
                      <SearchIcon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                    </Link>
                  ))}
                </Card>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
