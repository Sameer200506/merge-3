"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { approveTimeEntry, rejectTimeEntry } from "@/app/actions";
import { useAuthStore } from "@/store/auth-store";
import { Check, X } from "lucide-react";

export function ApproveTimeActions({ entryId }: { entryId: string }) {
  const [pending, startTransition] = useTransition();
  const user = useAuthStore((s) => s.user);

  const handleApprove = () => {
    startTransition(async () => {
      try {
        await approveTimeEntry(user!.id, entryId);
        toast.success("Time approved");
      } catch {
        toast.error("Failed to approve");
      }
    });
  };

  const handleReject = () => {
    startTransition(async () => {
      try {
        await rejectTimeEntry(user!.id, entryId);
        toast.success("Time rejected");
      } catch {
        toast.error("Failed to reject");
      }
    });
  };

  return (
    <div className="flex items-center justify-end gap-1">
      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={handleApprove} disabled={pending} title="Approve">
        <Check className="h-3.5 w-3.5 text-emerald-600" />
      </Button>
      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={handleReject} disabled={pending} title="Reject">
        <X className="h-3.5 w-3.5 text-red-500" />
      </Button>
    </div>
  );
}
