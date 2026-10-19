"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { CheckCheck } from "lucide-react";
import { markAllNotificationsRead } from "@/app/actions";
import { useAuthStore } from "@/store/auth-store";

export function MarkAllReadButton({ userId }: { userId: string }) {
  const [pending, startTransition] = useTransition();
  const user = useAuthStore((s) => s.user);
  const router = useRouter();

  return (
    <Button
      size="sm"
      variant="outline"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          try {
            await markAllNotificationsRead(user!.id, userId);
            toast.success("All notifications marked read");
            router.refresh();
          } catch {
            toast.error("Failed to update notifications");
          }
        })
      }
    >
      <CheckCheck className="h-3.5 w-3.5" /> Mark all read
    </Button>
  );
}
