"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TASK_STATUSES, TASK_PRIORITIES, TASK_TYPES } from "@/lib/constants";
import { createTask } from "@/app/actions";
import { useAuthStore } from "@/store/auth-store";
import type { User, Project, Customer } from "@/lib/db/types";

interface Props {
  projects: Project[];
  customers: Customer[];
  users: User[];
  trigger?: React.ReactNode;
  defaultProjectId?: string;
}

/** "New task" dialog. */
export function CreateTaskDialog({ projects, customers, users, trigger, defaultProjectId }: Props) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const user = useAuthStore((s) => s.user);

  const [form, setForm] = useState({
    title: "",
    description: "",
    projectId: defaultProjectId ?? "",
    assigneeId: user?.id ?? "",
    status: "To Do" as (typeof TASK_STATUSES)[number],
    priority: "Medium" as (typeof TASK_PRIORITIES)[number],
    type: "Project" as (typeof TASK_TYPES)[number],
    estimateHours: "",
    dueDate: "",
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) {
      toast.error("Title is required");
      return;
    }
    startTransition(async () => {
      try {
        await createTask(user!.id, {
          title: form.title,
          description: form.description,
          projectId: form.projectId || undefined,
          assigneeId: form.assigneeId || undefined,
          status: form.status,
          priority: form.priority,
          type: form.type,
          estimateHours: form.estimateHours ? Number(form.estimateHours) : undefined,
          dueDate: form.dueDate || undefined,
        });
        toast.success("Task created");
        setOpen(false);
        setForm({ ...form, title: "", description: "" });
      } catch {
        toast.error("Failed to create task");
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button size="sm">
            <Plus className="h-4 w-4" /> New Task
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>New Task</DialogTitle>
          <DialogDescription>Add a task to a project or leave it unassigned.</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs">Title *</Label>
            <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Description</Label>
            <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Project</Label>
              <Select value={form.projectId} onValueChange={(v) => setForm({ ...form, projectId: v })}>
                <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
                <SelectContent>
                  {projects.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Assignee</Label>
              <Select value={form.assigneeId} onValueChange={(v) => setForm({ ...form, assigneeId: v })}>
                <SelectTrigger><SelectValue placeholder="Unassigned" /></SelectTrigger>
                <SelectContent>
                  {users.map((u) => (
                    <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Status</Label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as typeof form.status })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TASK_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Priority</Label>
              <Select value={form.priority} onValueChange={(v) => setForm({ ...form, priority: v as typeof form.priority })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TASK_PRIORITIES.map((p) => (
                    <SelectItem key={p} value={p}>{p}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Type</Label>
              <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v as typeof form.type })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TASK_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Est. hours</Label>
              <Input type="number" value={form.estimateHours} onChange={(e) => setForm({ ...form, estimateHours: e.target.value })} />
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label className="text-xs">Due date</Label>
              <Input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={pending}>{pending ? "Creating..." : "Create task"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
