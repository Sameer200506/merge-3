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
import { useAuthStore } from "@/store/auth-store";
import { createCustomer } from "@/app/actions";

interface Props {
  trigger?: React.ReactNode;
}

/** "New customer" dialog. Creates a lead and routes to the new customer page. */
export function CreateCustomerDialog({ trigger }: Props) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);

  const [form, setForm] = useState({
    name: "",
    company: "",
    email: "",
    phone: "",
    website: "",
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!form.name.trim()) {
      toast.error("Name is required");
      return;
    }
    startTransition(async () => {
      try {
        const customer = await createCustomer(user.id, form);
        toast.success("Customer created");
        setOpen(false);
        setForm({ name: "", company: "", email: "", phone: "", website: "" });
        router.push(`/customers/${customer.id}`);
      } catch {
        toast.error("Failed to create customer");
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button size="sm">
            <Plus className="h-4 w-4" /> New Customer
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New Customer</DialogTitle>
          <DialogDescription>Add a new lead to your CRM.</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Contact name" required value={form.name} onChange={(v) => setForm({ ...form, name: v })} />
            <Field label="Company" value={form.company} onChange={(v) => setForm({ ...form, company: v })} />
            <Field label="Email" type="email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} />
            <Field label="Phone" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} />
            <div className="col-span-2">
              <Field label="Website" value={form.website} onChange={(v) => setForm({ ...form, website: v })} />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? "Creating..." : "Create customer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">
        {label}
        {required ? <span className="text-destructive"> *</span> : null}
      </Label>
      <Input type={type} value={value} onChange={(e) => onChange(e.target.value)} required={required} />
    </div>
  );
}
