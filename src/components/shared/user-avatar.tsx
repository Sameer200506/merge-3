"use client";

import { Avatar, AvatarFallback, AvatarImage, colorFor, initials } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import type { User } from "@/lib/db/types";

interface UserAvatarProps {
  user?: Pick<User, "id" | "name" | "avatarUrl"> | null;
  className?: string;
  size?: "sm" | "md" | "lg";
}

const SIZES = {
  sm: "h-6 w-6 text-[10px]",
  md: "h-9 w-9 text-xs",
  lg: "h-12 w-12 text-sm",
};

/** Avatar that renders the user's image or a deterministic colored-initials chip. */
export function UserAvatar({ user, className, size = "md" }: UserAvatarProps) {
  if (!user) {
    return (
      <Avatar className={cn(SIZES[size], "bg-muted", className)}>
        <AvatarFallback className="bg-muted text-muted-foreground">?</AvatarFallback>
      </Avatar>
    );
  }
  return (
    <Avatar className={cn(SIZES[size], className)}>
      {user.avatarUrl ? <AvatarImage src={user.avatarUrl} alt={user.name} /> : null}
      <AvatarFallback className={colorFor(user.id || user.name)}>{initials(user.name)}</AvatarFallback>
    </Avatar>
  );
}
