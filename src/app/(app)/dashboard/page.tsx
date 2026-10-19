import Link from "next/link";
import {
  TrendingUp,
  Users,
  FolderKanban,
  AlertTriangle,
  DollarSign,
  ArrowRight,
  Clock,
} from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { RevenueAreaChart, PipelineBarChart, WorkloadBars } from "@/components/shared/charts";
import { ActivityFeed } from "@/components/shared/activity-feed";
import { UserAvatar } from "@/components/shared/user-avatar";
import { getDashboardData, getUserMap } from "@/lib/queries";
import { formatCurrency, formatCompactCurrency, formatRelative, hoursFromSeconds } from "@/lib/format";
import { STAGE_COLORS, PRIORITY_COLORS } from "@/lib/constants";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [data, userMap] = await Promise.all([getDashboardData(), getUserMap()]);

  const wonTrend = data.wonValue > 0 ? `${formatCompactCurrency(data.wonValue)} won total` : undefined;
  const stageBars = data.dealsByStage
    .filter((s) => s.value > 0)
    .map((s) => ({ label: s.stage, value: s.value }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="Your business at a glance — pipeline, delivery, and team activity."
      />

      {/* KPI cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Pipeline Value"
          value={formatCurrency(data.pipelineValue)}
          icon={TrendingUp}
          accent="bg-indigo-600"
          hint={`${formatCompactCurrency(data.weightedPipeline)} weighted`}
        />
        <StatCard
          label="Won Revenue"
          value={formatCurrency(data.wonValue)}
          icon={DollarSign}
          accent="bg-emerald-600"
          trend={{ value: wonTrend ?? "—", positive: true }}
        />
        <StatCard
          label="New Leads"
          value={String(data.leadsCreated)}
          icon={Users}
          accent="bg-sky-500"
          hint="Last 7 days"
        />
        <StatCard
          label="Active Projects"
          value={String(data.activeProjects)}
          icon={FolderKanban}
          accent="bg-violet-500"
          hint="In delivery"
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-base">Revenue</CardTitle>
            <Badge variant="success">Last 8 weeks</Badge>
          </CardHeader>
          <CardContent>
            <RevenueAreaChart data={data.revenueByWeek} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Pipeline by Stage</CardTitle>
          </CardHeader>
          <CardContent>
            {stageBars.length > 0 ? (
              <PipelineBarChart data={stageBars} />
            ) : (
              <p className="py-16 text-center text-sm text-muted-foreground">No deals yet.</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Overdue + workload + activity */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Upcoming / overdue tasks */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-base">Upcoming & Overdue</CardTitle>
            <Button asChild variant="ghost" size="sm" className="h-7 text-xs">
              <Link href="/tasks">
                View all <ArrowRight className="ml-1 h-3 w-3" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.overdueTasks > 0 && (
              <div className="flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/5 px-3 py-2">
                <AlertTriangle className="h-4 w-4 text-red-500" />
                <span className="text-sm font-medium text-red-600 dark:text-red-400">
                  {data.overdueTasks} overdue task{data.overdueTasks !== 1 ? "s" : ""}
                </span>
              </div>
            )}
            {data.upcomingTasks.length === 0 && data.overdueTasks === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">All caught up 🎉</p>
            ) : (
              data.upcomingTasks.slice(0, 5).map((task) => {
                const overdue = task.dueDate && Date.parse(task.dueDate) < Date.now();
                return (
                  <Link
                    key={task.id}
                    href="/tasks"
                    className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 transition-colors hover:bg-accent/50"
                  >
                    <span className={`h-2 w-2 shrink-0 rounded-full ${PRIORITY_COLORS[task.priority]}`} />
                    <span className="min-w-0 flex-1 truncate text-sm">{task.title}</span>
                    {task.assigneeId ? (
                      <UserAvatar user={userMap[task.assigneeId]} size="sm" />
                    ) : null}
                    <span
                      className={`shrink-0 text-xs ${overdue ? "font-medium text-red-500" : "text-muted-foreground"}`}
                    >
                      {formatRelative(task.dueDate!)}
                    </span>
                  </Link>
                );
              })
            )}
          </CardContent>
        </Card>

        {/* Team workload */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Team Workload</CardTitle>
          </CardHeader>
          <CardContent>
            {data.teamWorkload.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">No active assignments.</p>
            ) : (
              <WorkloadBars
                data={data.teamWorkload.map((w) => ({
                  label: w.user.name,
                  value: w.openTasks,
                  sub: w.pendingHours > 0 ? `${hoursFromSeconds(w.pendingHours * 3600)}h pending` : undefined,
                }))}
              />
            )}
          </CardContent>
        </Card>

        {/* Recent activity */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-base">Recent Activity</CardTitle>
            <Button asChild variant="ghost" size="sm" className="h-7 text-xs">
              <Link href="/activity">
                All <ArrowRight className="ml-1 h-3 w-3" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <ActivityFeed
              activities={data.recentActivities}
              users={userMap}
              emptyLabel="No recent activity."
            />
          </CardContent>
        </Card>
      </div>

      {/* Lifecycle stages legend */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Pipeline Lifecycle</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-x-6 gap-y-3">
            {Object.entries(STAGE_COLORS).map(([stage, color]) => {
              const found = data.dealsByStage.find((s) => s.stage === stage);
              return (
                <div key={stage} className="flex items-center gap-2">
                  <span className={`h-2.5 w-2.5 rounded-full ${color}`} />
                  <span className="text-sm text-muted-foreground">{stage}</span>
                  {found ? (
                    <span className="text-sm font-medium">{found.count}</span>
                  ) : null}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
