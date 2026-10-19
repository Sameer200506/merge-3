import { KanbanSquare, List, ListChecks } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { TaskBoard } from "@/components/tasks/task-board";
import { CreateTaskDialog } from "@/components/tasks/create-task-dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { UserAvatar } from "@/components/shared/user-avatar";
import { getTasks, getProjects, getUsers, getCustomers } from "@/lib/queries";
import { formatRelative } from "@/lib/format";
import { PRIORITY_COLORS } from "@/lib/constants";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function TasksPage() {
  const [tasks, projects, users, customers] = await Promise.all([getTasks(), getProjects(), getUsers(), getCustomers()]);
  const userMap = Object.fromEntries(users.map((u) => [u.id, u]));
  const projectMap = Object.fromEntries(projects.map((p) => [p.id, p]));

  const openTasks = tasks.filter((t) => t.status !== "Done");
  const doneTasks = tasks.filter((t) => t.status === "Done");

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tasks"
        description={`${openTasks.length} open · ${doneTasks.length} done`}
        actions={<CreateTaskDialog projects={projects} customers={customers} users={users} />}
      />

      <Tabs defaultValue="board">
        <TabsList>
          <TabsTrigger value="board">
            <KanbanSquare className="h-4 w-4" /> Board
          </TabsTrigger>
          <TabsTrigger value="list">
            <List className="h-4 w-4" /> List
          </TabsTrigger>
        </TabsList>

        <TabsContent value="board">
          {tasks.length === 0 ? (
            <EmptyState
              icon={ListChecks}
              title="No tasks yet"
              description="Create your first task to get started."
              action={<CreateTaskDialog projects={projects} customers={customers} users={users} />}
            />
          ) : (
            <TaskBoard tasks={tasks} users={userMap} projects={projectMap} />
          )}
        </TabsContent>

        <TabsContent value="list">
          <Card className="overflow-hidden p-0">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-10" />
                  <TableHead>Task</TableHead>
                  <TableHead className="hidden md:table-cell">Project</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden lg:table-cell">Priority</TableHead>
                  <TableHead className="hidden lg:table-cell">Assignee</TableHead>
                  <TableHead className="hidden sm:table-cell text-right">Due</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tasks.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell>
                      <Checkbox checked={t.status === "Done"} disabled />
                    </TableCell>
                    <TableCell>
                      <div className="min-w-0">
                        <p className={cn("truncate text-sm font-medium", t.status === "Done" && "line-through text-muted-foreground")}>
                          {t.title}
                        </p>
                        {t.type !== "Project" ? (
                          <Badge variant="outline" className="mt-0.5 h-4 px-1 text-[10px]">{t.type}</Badge>
                        ) : null}
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-muted-foreground text-sm">
                      {t.projectId ? projectMap[t.projectId]?.name ?? "—" : "—"}
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{t.status}</span>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <div className="flex items-center gap-1.5">
                        <span className={cn("h-2 w-2 rounded-full", PRIORITY_COLORS[t.priority])} />
                        <span className="text-sm">{t.priority}</span>
                      </div>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      {t.assigneeId ? <UserAvatar user={userMap[t.assigneeId]} size="sm" /> : null}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-right text-xs text-muted-foreground">
                      {t.dueDate ? formatRelative(t.dueDate) : "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
