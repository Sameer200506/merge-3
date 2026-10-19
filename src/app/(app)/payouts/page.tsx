import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { colorFor, initials } from "@/lib/avatar-utils";
import { Separator } from "@/components/ui/separator";
import { ApprovePayoutButton, PayPayoutButton } from "@/components/payouts/payout-actions";
import { getPayouts, getUsers } from "@/lib/queries";
import { formatCurrency, formatDate } from "@/lib/format";
import { PAYOUT_STATUSES } from "@/lib/constants";
import { Wallet, Clock, CheckCircle2, Banknote, Info } from "lucide-react";
import type { Payout } from "@/lib/db/types";

export const dynamic = "force-dynamic";

const STATUS_VARIANT: Record<string, "secondary" | "default" | "warning" | "success"> = {
  Pending: "warning",
  Approved: "default",
  Processing: "secondary",
  Paid: "success",
};

export default async function PayoutsPage() {
  const [payouts, users] = await Promise.all([getPayouts(), getUsers()]);
  const userMap = Object.fromEntries(users.map((u) => [u.id, u]));

  const totalPaid = payouts.filter((p) => p.status === "Paid").reduce((s, p) => s + p.total, 0);
  const totalPending = payouts
    .filter((p) => p.status === "Pending" || p.status === "Approved")
    .reduce((s, p) => s + p.total, 0);
  const totalThisPeriod = payouts.reduce((s, p) => s + p.total, 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Payouts"
        description="Demo mode — simulated Wise transfers, no real payments."
      />

      {/* Demo banner */}
      <div className="flex items-start gap-3 rounded-lg border border-amber-500/30 bg-amber-500/5 p-4">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
        <div className="text-sm">
          <p className="font-medium text-amber-700 dark:text-amber-400">Demo Mode</p>
          <p className="text-muted-foreground">
            Phase 1 uses demo data only. Stripe and Wise integrations are deferred. Approving time entries
            automatically adds them to the weekly payout batch.
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Total Paid" value={formatCurrency(totalPaid)} icon={CheckCircle2} accent="bg-emerald-600" />
        <StatCard label="Pending Approval" value={formatCurrency(totalPending)} icon={Clock} accent="bg-amber-500" />
        <StatCard label="All Time" value={formatCurrency(totalThisPeriod)} icon={Wallet} accent="bg-indigo-600" />
      </div>

      {/* Payout batches */}
      <div className="space-y-4">
        {payouts.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Banknote className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">No payout batches yet.</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Approve time entries to auto-generate weekly batches.
              </p>
            </CardContent>
          </Card>
        ) : (
          payouts.map((payout) => (
            <PayoutBatchCard key={payout.id} payout={payout} userMap={userMap} />
          ))
        )}
      </div>
    </div>
  );
}

function PayoutBatchCard({
  payout,
  userMap,
}: {
  payout: Payout;
  userMap: Record<string, { id: string; name: string; jobTitle?: string }>;
}) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              Week of {formatDate(payout.weekStart)}
              <Badge variant={STATUS_VARIANT[payout.status]}>{payout.status}</Badge>
            </CardTitle>
            {payout.transferRef ? (
              <p className="mt-1 font-mono text-xs text-muted-foreground">Ref: {payout.transferRef}</p>
            ) : null}
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Total</p>
            <p className="text-xl font-semibold">{formatCurrency(payout.total)}</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Lines */}
        <div className="space-y-2">
          {payout.lines.map((line) => {
            const u = userMap[line.userId];
            return (
              <div key={line.userId} className="flex items-center justify-between rounded-lg border p-3">
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className={colorFor(line.userId)}>
                      {u ? initials(u.name) : "??"}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium">{u?.name ?? "Unknown"}</p>
                    <p className="text-xs text-muted-foreground">
                      {line.hours}h @ ${line.rate}/h
                    </p>
                  </div>
                </div>
                <span className="font-medium tabular-nums">{formatCurrency(line.amount)}</span>
              </div>
            );
          })}
          {payout.lines.length === 0 ? (
            <p className="rounded-lg border border-dashed py-4 text-center text-sm text-muted-foreground">
              No entries in this batch yet.
            </p>
          ) : null}
        </div>

        <Separator />

        {/* Actions */}
        <div className="flex items-center justify-end gap-2">
          {payout.status === "Pending" ? <ApprovePayoutButton payoutId={payout.id} /> : null}
          {payout.status === "Approved" ? (
            <PayPayoutButton payoutId={payout.id} total={payout.total} />
          ) : null}
          {payout.status === "Paid" && payout.paidAt ? (
            <p className="text-xs text-muted-foreground">Paid {formatDate(payout.paidAt)}</p>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
