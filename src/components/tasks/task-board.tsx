"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { moveTask, toggleTaskDone } from "@/app/actions";
import { useAuthStore } from "@/store/auth-store";
import { formatRelative } from "@/lib/format";
import { PRIORITY_COLORS, TASK_STATUSES } from "@/lib/constants";
import { UserAvatar } from "@/components/shared/user-avatar";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import type { Task, User, Project } from "@/lib/db/types";

interface Props {
  tasks: Task[];
  users: Record<string, User>;
  projects: Record<string, Project>;
}

/** Kanban board organized by task status columns. */
export function TaskBoard({ tasks, users, projects }: Props) {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);

  const grouped = TASK_STATUSES.map((status) => ({
    status,
    tasks: tasks.filter((t) => t.status === status),
  }));

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {grouped.map((col) => (
        <TaskColumn key={col.status} status={col.status} tasks={col.tasks} users={users} projects={projects} />
      ))}
    </div>
  );
}

function TaskColumn({
  status,
  tasks,
  users,
  projects,
}: {
  status: string;
  tasks: Task[];
  users: Record<string, User>;
  projects: Record<string, Project>;
}) {
  return (
    <div className="flex w-72 shrink-0 flex-col">
      <div className="mb-2 flex items-center justify-between px-1">
        <span className="text-sm font-semibold">{status}</span>
        <span className="text-xs text-muted-foreground">{tasks.length}</span>
      </div>
      <div className="flex-1 space-y-2 rounded-xl border bg-surface/50 p-2 min-h-[120px]">
        {tasks.map((task) => (
          <TaskCard key={task.id} task={task} users={users} projects={projects} />
        ))}
        {tasks.length === 0 && (
          <div className="rounded-lg border border-dashed py-6 text-center text-xs text-muted-foreground">
            No tasks
          </div>
        )}
      </div>
    </div>
  );
}

function TaskCard({ task, users, projects }: { task: Task; users: Record<string, User>; projects: Record<string, Project> }) {
  const [pending, startTransition] = useTransition();
  const user = useAuthStore((s) => s.user);
  const isDone = task.status === "Done";
  const project = task.projectId ? projects[task.projectId] : null;
  const assignee = task.assigneeId ? users[task.assigneeId] : null;

  const handleCheck = () => {
    startTransition(async () => {
      try {
        await toggleTaskDone(user!.id, task.id, !isDone);
      } catch {
        toast.error("Failed to update task");
      }
    });
  };

  return (
    <div className="group rounded-lg border bg-card p-3 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-start gap-2">
        <Checkbox
          checked={isDone}
          onCheckedChange={handleCheck}
          disabled={pending}
          className="mt-0.5"
        />
        <div className="min-w-0 flex-1 space-y-1.5">
          <p
            className={cn(
              "text-sm font-medium leading-snug",
              isDone && "text-muted-foreground line-through",
            )}
          >
            {task.title}
          </p>

          {project ? (
            <p className="text-[10px] text-muted-foreground">{project.name}</p>
          ) : null}

          {/* Subtasks indicator */}
          {task.subtasks.length > 0 ? (
            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
              <span>
                {task.subtasks.filter((s) => s.done).length}/{task.subtasks.length} subtasks
              </span>
            </div>
          ) : null}

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className={cn("h-2 w-2 rounded-full", PRIORITY_COLORS[task.priority])} />
              <span className="text-[10px] text-muted-foreground">{task.priority}</span>
              <Badge variant="outline" className="ml-1 h-4 px-1 text-[10px]">
                {task.type}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              {task.dueDate ? (
                <span className="text-[10px] text-muted-foreground">
                  {formatRelative(task.dueDate)}
                </span>
              ) : null}
              {assignee ? <UserAvatar user={assignee} size="sm" /> : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
