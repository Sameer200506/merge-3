import Link from "next/link";
import { Mail, Phone, Users as UsersIcon } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { colorFor, initials } from "@/lib/avatar-utils";
import { CreateCustomerDialog } from "@/components/customers/create-customer-dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getCustomers, getDeals } from "@/lib/queries";
import { formatRelative } from "@/lib/format";
import type { Customer } from "@/lib/db/types";

export const dynamic = "force-dynamic";

const LIFECYCLE_VARIANT: Record<Customer["lifecycleStage"], "secondary" | "default" | "success" | "warning"> = {
  lead: "secondary",
  deal: "warning",
  customer: "default",
  delivered: "success",
};

export default async function CustomersPage() {
  const [customers, deals] = await Promise.all([getCustomers(), getDeals()]);

  // Deal value per customer
  const valueByCustomer = new Map<string, number>();
  for (const d of deals) {
    valueByCustomer.set(d.customerId, (valueByCustomer.get(d.customerId) ?? 0) + (d.won ? d.value : 0));
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Customers"
        description={`${customers.length} ${customers.length === 1 ? "customer" : "customers"} in your CRM`}
        actions={<CreateCustomerDialog />}
      />

      {customers.length === 0 ? (
        <EmptyState
          icon={UsersIcon}
          title="No customers yet"
          description="Add your first lead to start building your pipeline."
          action={<CreateCustomerDialog />}
        />
      ) : (
        <Card className="overflow-hidden p-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Customer</TableHead>
                <TableHead className="hidden md:table-cell">Contact</TableHead>
                <TableHead>Lifecycle</TableHead>
                <TableHead className="hidden lg:table-cell">Tags</TableHead>
                <TableHead className="text-right">Value</TableHead>
                <TableHead className="hidden sm:table-cell text-right">Added</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {customers.map((c) => (
                <TableRow key={c.id}>
                  <TableCell>
                    <Link href={`/customers/${c.id}`} className="flex items-center gap-3">
                      <Avatar className="h-9 w-9">
                        <AvatarFallback className={colorFor(c.company || c.name)}>
                          {initials(c.company || c.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="truncate font-medium">{c.company || c.name}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          {c.company ? c.name : "—"}
                        </p>
                      </div>
                    </Link>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <div className="space-y-0.5 text-xs text-muted-foreground">
                      {c.email ? (
                        <div className="flex items-center gap-1.5">
                          <Mail className="h-3 w-3" /> <span className="truncate">{c.email}</span>
                        </div>
                      ) : null}
                      {c.phone ? (
                        <div className="flex items-center gap-1.5">
                          <Phone className="h-3 w-3" /> {c.phone}
                        </div>
                      ) : null}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={LIFECYCLE_VARIANT[c.lifecycleStage]} className="capitalize">
                      {c.lifecycleStage}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    <div className="flex flex-wrap gap-1">
                      {c.tags.slice(0, 2).map((t) => (
                        <Badge key={t} variant="outline" className="font-normal">
                          {t}
                        </Badge>
                      ))}
                      {c.tags.length > 2 ? (
                        <Badge variant="outline" className="font-normal">
                          +{c.tags.length - 2}
                        </Badge>
                      ) : null}
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-medium tabular-nums">
                    {valueByCustomer.get(c.id)
                      ? `$${valueByCustomer.get(c.id)!.toLocaleString()}`
                      : "—"}
                  </TableCell>
                  <TableCell className="hidden sm:table-cell text-right text-xs text-muted-foreground">
                    {formatRelative(c.createdAt)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
