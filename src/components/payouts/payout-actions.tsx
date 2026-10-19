"use client";

import { useState, useTransition } from "react";
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
import { approvePayout, payPayout } from "@/app/actions";
import { useAuthStore } from "@/store/auth-store";
import { Check, Send } from "lucide-react";

export function ApprovePayoutButton({ payoutId }: { payoutId: string }) {
  const [pending, startTransition] = useTransition();
  const user = useAuthStore((s) => s.user);

  return (
    <Button
      size="sm"
      variant="outline"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          try {
            await approvePayout(user!.id, payoutId);
            toast.success("Payout approved");
          } catch {
            toast.error("Failed to approve payout");
          }
        })
      }
    >
      <Check className="h-3.5 w-3.5" /> Approve
    </Button>
  );
}

export function PayPayoutButton({ payoutId, total }: { payoutId: string; total: number }) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const user = useAuthStore((s) => s.user);

  const handlePay = () => {
    startTransition(async () => {
      try {
        await payPayout(user!.id, payoutId);
        toast.success(`Simulated Wise transfer of $${total.toLocaleString()} sent`);
        setOpen(false);
      } catch {
        toast.error("Failed to process payout");
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" disabled={pending}>
          <Send className="h-3.5 w-3.5" /> Process Payment
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Simulate Wise Transfer</DialogTitle>
          <DialogDescription>
            This is a demo payment. No real money will be moved. A transfer reference will be generated.
          </DialogDescription>
        </DialogHeader>
        <div className="rounded-lg border bg-muted/30 p-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Provider</span>
            <span className="font-medium">Wise (Demo)</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Amount</span>
            <span className="font-semibold">${total.toLocaleString()}</span>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handlePay} disabled={pending}>
            {pending ? "Processing..." : "Confirm transfer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
