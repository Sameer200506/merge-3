import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Clock, Users, Calendar, CheckCircle2 } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { UserAvatar } from "@/components/shared/user-avatar";
import { getProject, getTasks, getCustomers, getUserMap, getTimeEntries } from "@/lib/queries";
import { getState } from "@/lib/db";
import { formatRelative, formatDuration, hoursFromSeconds, formatDate } from "@/lib/format";
import { PRIORITY_COLORS, STAGE_COLORS } from "@/lib/constants";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const project = await getProject(id);
  if (!project) notFound();

  const [tasks, customers, userMap, timeEntries] = await Promise.all([
    getTasks(id),
    getCustomers(),
    getUserMap(),
    getTimeEntries(),
  ]);

  const customer = customers.find((c) => c.id === project.customerId);
  const manager = userMap[project.managerId];
  const members = project.memberIds.map((mid) => userMap[mid]).filter(Boolean);
  const projectTime = timeEntries.filter((t) => t.projectId === id);
  const loggedHours = projectTime.reduce((s, t) => s + t.duration, 0) / 3600;
  const doneTasks = tasks.filter((t) => t.status === "Done").length;

  // Group tasks by status
  const tasksByStatus = tasks.reduce<Record<string, typeof tasks>>((acc, t) => {
    (acc[t.status] ??= []).push(t);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <Button asChild variant="ghost" size="sm" className="-ml-2 h-8">
        <Link href="/projects">
          <ArrowLeft className="h-4 w-4" /> Projects
        </Link>
      </Button>

      <PageHeader
        title={project.name}
        description={customer ? `Client: ${customer.company || customer.name}` : undefined}
        actions={
          <Badge
            variant="outline"
            className="gap-1.5 capitalize"
          >
            <span className={cn("h-2 w-2 rounded-full", `bg-indigo-600`)} />
            {project.status}
          </Badge>
        }
      />

      {project.description ? (
        <p className="text-sm text-muted-foreground">{project.description}</p>
      ) : null}

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatTile icon={CheckCircle2} label="Tasks" value={`${doneTasks}/${tasks.length}`} />
        <StatTile icon={Clock} label="Logged" value={`${hoursFromSeconds(loggedHours * 3600)}h`} />
        <StatTile icon={Calendar} label="Budget" value={project.budgetHours ? `${project.budgetHours}h` : "—"} />
        <StatTile icon={Users} label="Team" value={String(members.length)} />
      </div>

      {/* Progress bar */}
      <Card>
        <CardContent className="flex items-center gap-4 p-5">
          <div className="flex-1">
            <div className="mb-1.5 flex items-center justify-between text-sm">
              <span className="font-medium">Overall progress</span>
              <span className="text-muted-foreground">{project.progress}%</span>
            </div>
            <Progress value={project.progress} />
          </div>
          {project.dueDate ? (
            <div className="hidden text-right text-xs text-muted-foreground sm:block">
              <p>Due</p>
              <p className="font-medium text-foreground">{formatDate(project.dueDate)}</p>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Tasks */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Tasks</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {tasks.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">No tasks yet.</p>
            ) : (
              Object.entries(tasksByStatus).map(([status, list]) => (
                <div key={status}>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {status} ({list.length})
                  </p>
                  <div className="space-y-1">
                    {list.map((t) => (
                      <div
                        key={t.id}
                        className="flex items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-accent/40"
                      >
                        <span className={cn("h-2 w-2 shrink-0 rounded-full", PRIORITY_COLORS[t.priority])} />
                        <div className="min-w-0 flex-1">
                          <p className={cn("truncate text-sm font-medium", t.status === "Done" && "text-muted-foreground line-through")}>
                            {t.title}
                          </p>
                          {t.estimateHours ? (
                            <p className="text-xs text-muted-foreground">Est. {t.estimateHours}h</p>
                          ) : null}
                        </div>
                        {t.assigneeId ? <UserAvatar user={userMap[t.assigneeId]} size="sm" /> : null}
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Team */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Team</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {manager ? (
              <div className="flex items-center gap-3">
                <UserAvatar user={manager} />
                <div>
                  <p className="text-sm font-medium">{manager.name}</p>
                  <p className="text-xs text-muted-foreground">Project Manager</p>
                </div>
              </div>
            ) : null}
            {members.filter((m) => m.id !== project.managerId).length > 0 ? (
              <>
                <Separator />
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Members</p>
                {members.filter((m) => m.id !== project.managerId).map((m) => (
                  <div key={m.id} className="flex items-center gap-3">
                    <UserAvatar user={m} size="sm" />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{m.name}</p>
                      <p className="truncate text-xs text-muted-foreground">{m.jobTitle}</p>
                    </div>
                  </div>
                ))}
              </>
            ) : null}
            {project.dealId ? (
              <>
                <Separator />
                <Link href="/pipeline" className="block text-xs text-muted-foreground hover:text-primary">
                  ← Created from a won deal
                </Link>
              </>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatTile({ icon: Icon, label, value }: { icon: typeof Clock; label: string; value: string }) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
          <Icon className="h-4 w-4 text-primary" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-lg font-semibold">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}
