import Link from "next/link";
import { FolderKanban, Clock, CheckCircle2 } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { EmptyState } from "@/components/shared/empty-state";
import { CreateProjectDialog } from "@/components/projects/create-project-dialog";
import { UserAvatar } from "@/components/shared/user-avatar";
import { getProjects, getCustomers, getUsers, getUserMap } from "@/lib/queries";
import { getState } from "@/lib/db";
import { PROJECT_STATUS_COLORS } from "@/lib/constants";
import { formatRelative } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function ProjectsPage() {
  const [projects, customers, users] = await Promise.all([getProjects(), getCustomers(), getUsers()]);
  const userMap = Object.fromEntries(users.map((u) => [u.id, u]));
  const customerName = (id: string) =>
    customers.find((c) => c.id === id)?.company ?? customers.find((c) => c.id === id)?.name ?? "—";

  // task counts per project
  const tasksByProject = new Map<string, { total: number; done: number }>();
  for (const p of projects) {
    const tasks = getState().tasks.filter((t) => t.projectId === p.id);
    tasksByProject.set(p.id, {
      total: tasks.length,
      done: tasks.filter((t) => t.status === "Done").length,
    });
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Projects"
        description={`${projects.length} ${projects.length === 1 ? "project" : "projects"} in delivery`}
        actions={<CreateProjectDialog customers={customers} users={users} />}
      />

      {projects.length === 0 ? (
        <EmptyState
          icon={FolderKanban}
          title="No projects yet"
          description="Create a project, or win a deal to auto-generate one."
          action={<CreateProjectDialog customers={customers} users={users} />}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {projects.map((p) => {
            const counts = tasksByProject.get(p.id) ?? { total: 0, done: 0 };
            const manager = userMap[p.managerId];
            return (
              <Link key={p.id} href={`/projects/${p.id}`}>
                <Card className="h-full transition-shadow hover:shadow-md">
                  <CardContent className="flex h-full flex-col p-5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate font-semibold">{p.name}</p>
                        <p className="truncate text-xs text-muted-foreground">{customerName(p.customerId)}</p>
                      </div>
                      <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${PROJECT_STATUS_COLORS[p.status]}`} />
                    </div>

                    {p.description ? (
                      <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">{p.description}</p>
                    ) : null}

                    <div className="mt-4 space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Progress</span>
                        <span className="font-medium">{p.progress}%</span>
                      </div>
                      <Progress value={p.progress} className="h-1.5" />
                    </div>

                    <div className="mt-4 flex items-center justify-between border-t pt-3">
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          {counts.done}/{counts.total}
                        </span>
                        {p.budgetHours ? (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5" />
                            {p.budgetHours}h
                          </span>
                        ) : null}
                      </div>
                      {manager ? (
                        <div className="flex -space-x-2">
                          <UserAvatar user={manager} size="sm" className="ring-2 ring-background" />
                        </div>
                      ) : null}
                    </div>
                    <p className="mt-3 text-[10px] text-muted-foreground">Updated {formatRelative(p.updatedAt)}</p>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
