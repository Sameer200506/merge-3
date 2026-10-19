import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { TimerWidget, ManualEntryDialog } from "@/components/time/time-widgets";
import { ApproveTimeActions } from "@/components/time/approve-actions";
import { StatCard } from "@/components/shared/stat-card";
import { UserAvatar } from "@/components/shared/user-avatar";
import { getTimeEntries, getTasks, getProjects, getUsers } from "@/lib/queries";
import { formatDuration, formatRelative, formatCurrency, hoursFromSeconds } from "@/lib/format";
import { Clock, CheckCircle2, AlertCircle } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function TimePage() {
  const [entries, tasks, projects, users] = await Promise.all([
    getTimeEntries(),
    getTasks(),
    getProjects(),
    getUsers(),
  ]);

  const userMap = Object.fromEntries(users.map((u) => [u.id, u]));
  const projectMap = Object.fromEntries(projects.map((p) => [p.id, p]));
  const taskMap = Object.fromEntries(tasks.map((t) => [t.id, t]));

  const pendingEntries = entries.filter((e) => e.approval === "Pending");
  const approvedEntries = entries.filter((e) => e.approval === "Approved");
  const totalLogged = entries.reduce((s, e) => s + e.duration, 0);
  const totalBillable = entries.filter((e) => e.billable).reduce((s, e) => s + e.duration, 0);
  const billableValue = entries
    .filter((e) => e.billable)
    .reduce((s, e) => s + (e.duration / 3600) * (e.hourlyRate ?? 0), 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Time Tracking"
        description="Track hours, approve timesheets, and generate payouts."
        actions={<ManualEntryDialog projects={projects} tasks={tasks} users={users} />}
      />

      {/* Timer + stats */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
        <Card className="lg:col-span-1">
          <CardContent className="flex items-center justify-center p-6">
            <TimerWidget />
          </CardContent>
        </Card>
        <StatCard
          label="Total Logged"
          value={formatDuration(totalLogged)}
          icon={Clock}
          accent="bg-sky-500"
        />
        <StatCard
          label="Billable"
          value={formatDuration(totalBillable)}
          icon={CheckCircle2}
          accent="bg-emerald-600"
          hint={formatCurrency(billableValue)}
        />
        <StatCard
          label="Pending Approval"
          value={String(pendingEntries.length)}
          icon={AlertCircle}
          accent="bg-amber-500"
        />
      </div>

      {/* Time entries table */}
      <Card className="overflow-hidden p-0">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>User</TableHead>
              <TableHead className="hidden md:table-cell">Task / Project</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="text-right">Duration</TableHead>
              <TableHead className="hidden lg:table-cell text-right">Rate</TableHead>
              <TableHead className="hidden sm:table-cell">Status</TableHead>
              <TableHead className="hidden lg:table-cell text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {entries.map((e) => {
              const task = e.taskId ? taskMap[e.taskId] : null;
              const project = e.projectId ? projectMap[e.projectId] : null;
              const owner = userMap[e.userId];
              return (
                <TableRow key={e.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <UserAvatar user={owner} size="sm" />
                      <span className="text-sm font-medium">{owner?.name ?? "—"}</span>
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                    {task?.title ?? project?.name ?? "—"}
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate text-sm">
                    {e.description ?? "—"}
                  </TableCell>
                  <TableCell className="text-right font-medium tabular-nums">
                    {formatDuration(e.duration)}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell text-right text-sm tabular-nums">
                    {e.hourlyRate ? `$${e.hourlyRate}/h` : "—"}
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <Badge
                      variant={
                        e.approval === "Approved"
                          ? "success"
                          : e.approval === "Rejected"
                            ? "destructive"
                            : "warning"
                      }
                    >
                      {e.approval}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell text-right">
                    {e.approval === "Pending" ? (
                      <ApproveTimeActions entryId={e.id} />
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
