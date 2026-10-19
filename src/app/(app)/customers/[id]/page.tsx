import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Mail, Phone, Globe, Building2 } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { colorFor, initials } from "@/lib/avatar-utils";
import { ActivityFeed } from "@/components/shared/activity-feed";
import {
  getCustomer,
  getContacts,
  getDeals,
  getFiles,
  getActivities,
  getUserMap,
} from "@/lib/queries";
import { formatCurrency, formatRelative } from "@/lib/format";
import type { Customer } from "@/lib/db/types";

export const dynamic = "force-dynamic";

const LIFECYCLE_VARIANT: Record<Customer["lifecycleStage"], "secondary" | "default" | "success" | "warning"> = {
  lead: "secondary",
  deal: "warning",
  customer: "default",
  delivered: "success",
};

export default async function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const customer = await getCustomer(id);
  if (!customer) notFound();

  const [contacts, deals, files, activities, userMap] = await Promise.all([
    getContacts(id),
    getDeals(),
    getFiles("customer", id),
    getActivities(30),
    getUserMap(),
  ]);

  const customerDeals = deals.filter((d) => d.customerId === id);
  const wonValue = customerDeals.filter((d) => d.won).reduce((s, d) => s + d.value, 0);
  const customerActivities = activities.filter((a) =>
    customerDeals.some((d) => d.id === a.targetId) ||
    (a.targetType === "customer" && a.targetId === id),
  );

  return (
    <div className="space-y-6">
      <Button asChild variant="ghost" size="sm" className="-ml-2 h-8">
        <Link href="/customers">
          <ArrowLeft className="h-4 w-4" /> Customers
        </Link>
      </Button>

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <Avatar className="h-14 w-14">
            <AvatarFallback className={colorFor(customer.company || customer.name)}>
              {initials(customer.company || customer.name)}
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
              {customer.company || customer.name}
            </h1>
            <p className="text-sm text-muted-foreground">{customer.company ? customer.name : "Contact"}</p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <Badge variant={LIFECYCLE_VARIANT[customer.lifecycleStage]} className="capitalize">
                {customer.lifecycleStage}
              </Badge>
              {customer.tags.map((t) => (
                <Badge key={t} variant="outline" className="font-normal">
                  {t}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Contact info */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {customer.email ? (
          <InfoTile icon={Mail} label="Email" value={customer.email} />
        ) : null}
        {customer.phone ? (
          <InfoTile icon={Phone} label="Phone" value={customer.phone} />
        ) : null}
        {customer.website ? (
          <InfoTile icon={Globe} label="Website" value={customer.website} />
        ) : null}
        <InfoTile icon={Building2} label="Won Value" value={formatCurrency(wonValue)} />
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="contacts">Contacts ({contacts.length})</TabsTrigger>
          <TabsTrigger value="deals">Deals ({customerDeals.length})</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Open Deals</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {customerDeals.length === 0 ? (
                  <p className="py-4 text-center text-sm text-muted-foreground">No deals yet.</p>
                ) : (
                  customerDeals.map((d) => (
                    <Link
                      key={d.id}
                      href="/pipeline"
                      className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-accent/40"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{d.title}</p>
                        <p className="text-xs text-muted-foreground">{d.stage}</p>
                      </div>
                      <span className="shrink-0 font-medium tabular-nums">{formatCurrency(d.value)}</span>
                    </Link>
                  ))
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Primary Contact</CardTitle>
              </CardHeader>
              <CardContent>
                {contacts.length === 0 ? (
                  <p className="py-4 text-center text-sm text-muted-foreground">No contacts.</p>
                ) : (
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className={colorFor(contacts[0].name)}>
                        {initials(contacts[0].name)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">{contacts[0].name}</p>
                      <p className="text-xs text-muted-foreground">{contacts[0].position ?? "—"}</p>
                      <p className="text-xs text-muted-foreground">{contacts[0].email}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="contacts">
          <Card>
            <CardContent className="divide-y p-0">
              {contacts.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">No contacts yet.</p>
              ) : (
                contacts.map((c) => (
                  <div key={c.id} className="flex items-center gap-3 p-4">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className={colorFor(c.name)}>{initials(c.name)}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium">{c.name}</p>
                        {c.isPrimary ? <Badge variant="default" className="text-[10px]">Primary</Badge> : null}
                      </div>
                      <p className="text-xs text-muted-foreground">{c.position ?? "—"}</p>
                    </div>
                    <div className="hidden text-right text-xs text-muted-foreground sm:block">
                      <p>{c.email}</p>
                      {c.phone ? <p>{c.phone}</p> : null}
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="deals">
          <Card className="p-0">
            <div className="divide-y">
              {customerDeals.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">No deals yet.</p>
              ) : (
                customerDeals.map((d) => (
                  <Link
                    key={d.id}
                    href="/pipeline"
                    className="flex items-center justify-between p-4 transition-colors hover:bg-accent/40"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{d.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {d.stage} · {formatRelative(d.updatedAt)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium tabular-nums">{formatCurrency(d.value)}</p>
                      <p className="text-xs text-muted-foreground">{d.probability}% likely</p>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="activity">
          <Card>
            <CardContent>
              <ActivityFeed
                activities={customerActivities}
                users={userMap}
                emptyLabel="No activity for this customer yet."
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function InfoTile({ icon: Icon, label, value }: { icon: typeof Mail; label: string; value: string }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Icon className="h-3.5 w-3.5" />
          {label}
        </div>
        <p className="mt-1.5 truncate text-sm font-medium">{value}</p>
      </CardContent>
    </Card>
  );
}
