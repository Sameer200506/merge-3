"use client";

import { useAuthStore } from "@/store/auth-store";
import { useTheme } from "next-themes";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { ROLE_LABELS } from "@/lib/auth/roles";
import type { User } from "@/lib/db/types";

/** Role switcher + theme preference — lets you experience different access levels. */
export function SettingsClient({ users }: { users: User[] }) {
  const { user, organization, switchUser, theme, setTheme } = useAuthStore();
  const { setTheme: setNextTheme } = useTheme();

  const handleSwitchUser = (userId: string) => {
    const next = users.find((u) => u.id === userId);
    if (next) switchUser(next);
  };

  const handleSetTheme = (t: "light" | "dark" | "system") => {
    setTheme(t);
    setNextTheme(t);
  };

  return (
    <div className="space-y-6">
      {/* Role switcher */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Demo Session</CardTitle>
          <CardDescription>
            Switch users to see how access differs by role. This is mock auth — no real login.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs">Active user</Label>
            <Select value={user?.id} onValueChange={handleSwitchUser}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {users.map((u) => (
                  <SelectItem key={u.id} value={u.id}>
                    {u.name} · {ROLE_LABELS[u.role]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {user ? (
            <div className="flex items-center gap-2 rounded-lg bg-muted/40 p-3 text-sm">
              <span className="text-muted-foreground">Signed in as</span>
              <span className="font-medium">{user.name}</span>
              <span className="text-muted-foreground">({ROLE_LABELS[user.role]})</span>
            </div>
          ) : null}
        </CardContent>
      </Card>

      {/* Appearance */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Appearance</CardTitle>
          <CardDescription>Theme preference is saved per user.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-1.5">
            <Label className="text-xs">Theme</Label>
            <Select value={theme} onValueChange={(v) => handleSetTheme(v as typeof theme)}>
              <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="light">Light</SelectItem>
                <SelectItem value="dark">Dark</SelectItem>
                <SelectItem value="system">System</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Organization */}
      {organization ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Organization</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <Row label="Name" value={organization.name} />
            <Row label="Slug" value={organization.slug} />
            <Row label="Plan" value={organization.plan} />
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b pb-2 last:border-0 last:pb-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium capitalize">{value}</span>
    </div>
  );
}
