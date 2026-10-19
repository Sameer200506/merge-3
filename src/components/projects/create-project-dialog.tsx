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
import { PROJECT_STATUSES } from "@/lib/constants";
import { createProject } from "@/app/actions";
import { useAuthStore } from "@/store/auth-store";
import type { Customer, User } from "@/lib/db/types";

interface Props {
  customers: Customer[];
  users: User[];
  trigger?: React.ReactNode;
}

/** "New project" dialog. */
export function CreateProjectDialog({ customers, users, trigger }: Props) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);

  const [form, setForm] = useState({
    name: "",
    description: "",
    customerId: "",
    managerId: user?.id ?? "",
    status: "Planning" as (typeof PROJECT_STATUSES)[number],
    budgetHours: "",
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.customerId) {
      toast.error("Name and client are required");
      return;
    }
    startTransition(async () => {
      try {
        const project = await createProject(user!.id, {
          name: form.name,
          description: form.description,
          customerId: form.customerId,
          managerId: form.managerId,
          memberIds: form.managerId ? [form.managerId] : [],
          status: form.status,
          budgetHours: form.budgetHours ? Number(form.budgetHours) : undefined,
        });
        toast.success("Project created");
        setOpen(false);
        router.push(`/projects/${project.id}`);
      } catch {
        toast.error("Failed to create project");
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button size="sm">
            <Plus className="h-4 w-4" /> New Project
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New Project</DialogTitle>
          <DialogDescription>Create a delivery project for a client.</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs">Name *</Label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Description</Label>
            <Textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={2}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Client *</Label>
              <Select value={form.customerId} onValueChange={(v) => setForm({ ...form, customerId: v })}>
                <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                <SelectContent>
                  {customers.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.company || c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Manager</Label>
              <Select value={form.managerId} onValueChange={(v) => setForm({ ...form, managerId: v })}>
                <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
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
                  {PROJECT_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Budget (hours)</Label>
              <Input
                type="number"
                value={form.budgetHours}
                onChange={(e) => setForm({ ...form, budgetHours: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={pending}>{pending ? "Creating..." : "Create project"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
