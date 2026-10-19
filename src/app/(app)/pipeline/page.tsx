import { KanbanSquare, Table2 } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { colorFor, initials } from "@/lib/avatar-utils";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PipelineKanban } from "@/components/pipeline/pipeline-kanban";
import { getPipelines, getDeals, getCustomers, getUserMap } from "@/lib/queries";
import { formatCurrency, formatRelative } from "@/lib/format";
import { STAGE_COLORS } from "@/lib/constants";

export const dynamic = "force-dynamic";

export default async function PipelinePage() {
  const [pipelines, deals, customers, userMap] = await Promise.all([
    getPipelines(),
    getDeals(),
    getCustomers(),
    getUserMap(),
  ]);

  const totalPipeline = deals
    .filter((d) => !d.won && !d.lost)
    .reduce((s, d) => s + d.value, 0);
  const wonValue = deals.filter((d) => d.won).reduce((s, d) => s + d.value, 0);

  const customerName = (id: string) =>
    customers.find((c) => c.id === id)?.company ?? customers.find((c) => c.id === id)?.name ?? "—";

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pipeline"
        description="Drag deals across stages. Dropping on Won auto-creates a project."
      />

      {/* Summary chips */}
      <div className="flex flex-wrap gap-3">
        <Card className="px-4 py-3">
          <p className="text-xs text-muted-foreground">Open Pipeline</p>
          <p className="text-lg font-semibold">{formatCurrency(totalPipeline)}</p>
        </Card>
        <Card className="px-4 py-3">
          <p className="text-xs text-muted-foreground">Won</p>
          <p className="text-lg font-semibold text-emerald-600 dark:text-emerald-400">
            {formatCurrency(wonValue)}
          </p>
        </Card>
        <Card className="px-4 py-3">
          <p className="text-xs text-muted-foreground">Active Deals</p>
          <p className="text-lg font-semibold">
            {deals.filter((d) => !d.won && !d.lost).length}
          </p>
        </Card>
      </div>

      <Tabs defaultValue="kanban">
        <TabsList>
          <TabsTrigger value="kanban">
            <KanbanSquare className="h-4 w-4" /> Kanban
          </TabsTrigger>
          <TabsTrigger value="table">
            <Table2 className="h-4 w-4" /> Table
          </TabsTrigger>
        </TabsList>

        <TabsContent value="kanban">
          <PipelineKanban
            pipelines={pipelines}
            deals={deals}
            customers={customers}
            users={Object.values(userMap)}
          />
        </TabsContent>

        <TabsContent value="table">
          <Card className="overflow-hidden p-0">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Deal</TableHead>
                  <TableHead className="hidden md:table-cell">Customer</TableHead>
                  <TableHead>Stage</TableHead>
                  <TableHead className="hidden lg:table-cell">Owner</TableHead>
                  <TableHead className="text-right">Value</TableHead>
                  <TableHead className="hidden sm:table-cell text-right">Updated</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {deals.map((d) => (
                  <TableRow key={d.id}>
                    <TableCell className="font-medium">{d.title}</TableCell>
                    <TableCell className="hidden md:table-cell text-muted-foreground">
                      {customerName(d.customerId)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className={`h-2 w-2 rounded-full ${STAGE_COLORS[d.stage] ?? "bg-slate-400"}`} />
                        <span className="text-sm">{d.stage}</span>
                      </div>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      {userMap[d.ownerId] ? (
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            <AvatarFallback className={colorFor(userMap[d.ownerId].id)}>
                              {initials(userMap[d.ownerId].name)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm">{userMap[d.ownerId].name}</span>
                        </div>
                      ) : null}
                    </TableCell>
                    <TableCell className="text-right font-medium tabular-nums">
                      {formatCurrency(d.value)}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-right text-xs text-muted-foreground">
                      {formatRelative(d.updatedAt)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
