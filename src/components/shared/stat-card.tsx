import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string;
  icon: LucideIcon;
  hint?: string;
  trend?: { value: string; positive?: boolean };
  accent?: string; // tailwind bg class for the icon chip
  className?: string;
}

/** Compact KPI card used across the dashboard and module overviews. */
export function StatCard({ label, value, icon: Icon, hint, trend, accent, className }: StatCardProps) {
  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardContent className="flex items-start justify-between gap-3 p-5">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
          <p className="mt-1.5 text-2xl font-semibold tracking-tight">{value}</p>
          {trend ? (
            <p
              className={cn(
                "mt-1 text-xs font-medium",
                trend.positive ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground",
              )}
            >
              {trend.value}
            </p>
          ) : hint ? (
            <p className="mt-1 truncate text-xs text-muted-foreground">{hint}</p>
          ) : null}
        </div>
        <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-lg", accent ?? "bg-primary/10")}>
          <Icon className={cn("h-5 w-5", accent ? "text-white" : "text-primary")} />
        </div>
      </CardContent>
    </Card>
  );
}
