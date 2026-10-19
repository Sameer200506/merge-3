"use client";

import { useState, useEffect, useRef, useTransition } from "react";
import { Play, Pause, Square, Plus } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
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
import { Badge } from "@/components/ui/badge";
import { createTimeEntry } from "@/app/actions";
import { useAuthStore } from "@/store/auth-store";
import { formatDuration } from "@/lib/format";
import type { Task, Project, User } from "@/lib/db/types";

interface Props {
  projects: Project[];
  tasks: Task[];
  users: User[];
}

/** Live stopwatch timer for tracking time on a task. */
export function TimerWidget() {
  const [running, setRunning] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [taskId, setTaskId] = useState("");
  const user = useAuthStore((s) => s.user);
  const intervalRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (running && !intervalRef.current) {
      intervalRef.current = window.setInterval(() => setSeconds((s) => s + 1), 1000);
    } else if (!running && intervalRef.current) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = undefined;
    }
    return () => {
      if (intervalRef.current) window.clearInterval(intervalRef.current);
    };
  }, [running]);

  const handleSave = async () => {
    if (!user || seconds < 60) {
      toast.error("Timer must run at least 1 minute");
      return;
    }
    setRunning(false);
    const entry = await createTimeEntry(user.id, {
      taskId: taskId || undefined,
      durationSeconds: seconds,
      billable: true,
      hourlyRate: user.hourlyRate,
      startedAt: new Date(Date.now() - seconds * 1000).toISOString(),
      endedAt: new Date().toISOString(),
    });
    toast.success(`Logged ${formatDuration(seconds)}`);
    setSeconds(0);
    setTaskId("");
  };

  const handleStop = () => {
    setRunning(false);
  };

  return (
    <div className="flex items-center gap-3">
      <Button
        variant={running ? "destructive" : "default"}
        size="icon"
        className="h-9 w-9 rounded-full"
        onClick={() => (running ? handleStop() : setRunning(true))}
      >
        {running ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
      </Button>
      <div className="font-mono text-lg tabular-nums">{formatDuration(seconds)}</div>
      {running && (
        <Badge variant="success" className="animate-pulse">
          Recording
        </Badge>
      )}
      {!running && seconds > 0 && (
        <Button size="sm" onClick={handleSave}>
          Save Entry
        </Button>
      )}
    </div>
  );
}

/** Manual time entry dialog. */
export function ManualEntryDialog({ projects, tasks, users }: Props) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const user = useAuthStore((s) => s.user);

  const [form, setForm] = useState({
    taskId: "",
    projectId: "",
    description: "",
    durationHours: "",
    durationMinutes: "",
    billable: true,
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const hours = Number(form.durationHours) || 0;
    const minutes = Number(form.durationMinutes) || 0;
    const durationSeconds = hours * 3600 + minutes * 60;
    if (durationSeconds < 60) {
      toast.error("Enter at least 1 minute");
      return;
    }
    startTransition(async () => {
      try {
        await createTimeEntry(user!.id, {
          taskId: form.taskId || undefined,
          projectId: form.projectId || undefined,
          description: form.description,
          durationSeconds,
          billable: form.billable,
          hourlyRate: user!.hourlyRate,
        });
        toast.success(`Logged ${formatDuration(durationSeconds)}`);
        setOpen(false);
        setForm({ ...form, taskId: "", description: "", durationHours: "", durationMinutes: "" });
      } catch {
        toast.error("Failed to log time");
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <Plus className="h-4 w-4" /> Manual Entry
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Log Time</DialogTitle>
          <DialogDescription>Enter time manually.</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
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
              <Label className="text-xs">Task</Label>
              <Select value={form.taskId} onValueChange={(v) => setForm({ ...form, taskId: v })}>
                <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
                <SelectContent>
                  {tasks
                    .filter((t) => t.status !== "Done")
                    .map((t) => (
                      <SelectItem key={t.id} value={t.id}>{t.title}</SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Description</Label>
            <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Hours</Label>
              <Input type="number" min="0" max="24" value={form.durationHours} onChange={(e) => setForm({ ...form, durationHours: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Minutes</Label>
              <Input type="number" min="0" max="59" value={form.durationMinutes} onChange={(e) => setForm({ ...form, durationMinutes: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={pending}>{pending ? "Saving..." : "Log time"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
