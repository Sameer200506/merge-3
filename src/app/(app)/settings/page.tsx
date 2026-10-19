import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { colorFor, initials } from "@/lib/avatar-utils";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { SettingsClient } from "@/components/settings/settings-client";
import { getUsers, getOrganization, getSubscription } from "@/lib/queries";
import { ROLE_LABELS } from "@/lib/auth/roles";
import { formatCurrency, formatDate } from "@/lib/format";
import type { User } from "@/lib/db/types";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const [users, org, subscription] = await Promise.all([
    getUsers(),
    getOrganization(),
    getSubscription(),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader title="Settings" description="Manage your team, organization, and preferences." />

      <SettingsClient users={users} />

      {/* Team members */}
      <Card className="overflow-hidden p-0">
        <CardHeader>
          <CardTitle className="text-base">Team Members</CardTitle>
        </CardHeader>
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Member</TableHead>
              <TableHead className="hidden md:table-cell">Role</TableHead>
              <TableHead className="hidden lg:table-cell">Title</TableHead>
              <TableHead className="text-right">Rate</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((u: User) => (
              <TableRow key={u.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className={colorFor(u.id)}>{initials(u.name)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">{u.name}</p>
                      <p className="text-xs text-muted-foreground">{u.email}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  <Badge variant={u.role === "owner" ? "default" : "secondary"}>
                    {ROLE_LABELS[u.role]}
                  </Badge>
                </TableCell>
                <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
                  {u.jobTitle ?? "—"}
                </TableCell>
                <TableCell className="text-right text-sm tabular-nums">
                  {u.hourlyRate ? `${formatCurrency(u.hourlyRate)}/h` : "—"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {/* Subscription */}
      {subscription ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Subscription</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Plan</span>
              <Badge variant="default" className="capitalize">{subscription.plan}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Status</span>
              <Badge variant="success" className="capitalize">{subscription.status}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Seats</span>
              <span className="font-medium">{subscription.seats}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Renews</span>
              <span className="font-medium">{formatDate(subscription.currentPeriodEnd)}</span>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {org ? (
        <p className="text-center text-xs text-muted-foreground">
          Organization ID: <code className="rounded bg-muted px-1.5 py-0.5 font-mono">{org.id}</code>
        </p>
      ) : null}
    </div>
  );
}
