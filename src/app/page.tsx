import Link from "next/link";
import {
  ArrowRight,
  KanbanSquare,
  FolderKanban,
  ListChecks,
  Timer,
  Wallet,
  Users,
  Sparkles,
  Shield,
  Zap,
  CheckCircle2,
} from "lucide-react";
import { GeistSans } from "geist/font/sans";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { getCustomers, getDeals, getProjects, getUsers } from "@/lib/queries";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";

const FEATURES = [
  {
    icon: KanbanSquare,
    title: "Pipeline CRM",
    desc: "Drag deals across stages. Winning auto-creates a project.",
  },
  {
    icon: FolderKanban,
    title: "Projects",
    desc: "Track milestones, tasks, and progress in one place.",
  },
  {
    icon: ListChecks,
    title: "Tasks",
    desc: "Kanban & list views with priorities, subtasks, and dependencies.",
  },
  {
    icon: Timer,
    title: "Time Tracking",
    desc: "Live timers, manual entries, and approval workflows.",
  },
  {
    icon: Wallet,
    title: "Payouts",
    desc: "Weekly batches with simulated Wise transfers (demo mode).",
  },
  {
    icon: Users,
    title: "Multi-tenant",
    desc: "Every record is org-scoped. Role-based access for 6 roles.",
  },
];

const WORKFLOW = ["Lead", "Deal", "Customer", "Project", "Tasks", "Time", "Payout"];

export const dynamic = "force-dynamic";

export default async function LandingPage() {
  const [customers, deals, projects, users] = await Promise.all([
    getCustomers(),
    getDeals(),
    getProjects(),
    getUsers(),
  ]);

  const wonValue = deals.filter((d) => d.won).reduce((s, d) => s + d.value, 0);

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground text-xs font-bold">
              S
            </div>
            <span className="font-semibold">StartupOS</span>
            <Badge variant="secondary" className="ml-2 hidden sm:inline-flex">
              Phase 1 MVP
            </Badge>
          </div>
          <Button asChild size="sm">
            <Link href="/dashboard">
              Launch app <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />
        <div className="mx-auto max-w-6xl px-4 py-20 lg:py-28">
          <div className="mx-auto max-w-3xl text-center">
            <Badge variant="outline" className="mb-4 gap-1.5">
              <Sparkles className="h-3 w-3" /> Business Operating System
            </Badge>
            <h1 className="text-balance text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
              The connected OS for{" "}
              <span className="bg-gradient-to-r from-indigo-500 to-violet-500 bg-clip-text text-transparent">
                modern teams
              </span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-balance text-lg text-muted-foreground">
              CRM, project management, time tracking, and contractor payouts — unified in a single
              workflow. Lead → Deal → Customer → Project → Tasks → Time → Payout, without ever leaving the app.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button asChild size="lg">
                <Link href="/dashboard">
                  Open the demo <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/pipeline">View pipeline</Link>
              </Button>
            </div>
          </div>

          {/* Workflow chain */}
          <div className="mt-14">
            <div className="flex flex-wrap items-center justify-center gap-2">
              {WORKFLOW.map((step, i) => (
                <div key={step} className="flex items-center gap-2">
                  <span className="rounded-full border bg-card px-3 py-1 text-sm font-medium shadow-sm">
                    {step}
                  </span>
                  {i < WORKFLOW.length - 1 ? (
                    <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Stats strip */}
      <section className="border-y bg-surface/50">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-4 px-4 py-8 lg:grid-cols-4">
          <Stat value={formatCurrency(wonValue)} label="Won revenue" />
          <Stat value={String(customers.length)} label="Customers" />
          <Stat value={String(projects.length)} label="Active projects" />
          <Stat value={String(users.length)} label="Team roles" />
        </div>
      </section>

      {/* Features grid */}
      <section className="mx-auto max-w-6xl px-4 py-20">
        <div className="mx-auto mb-12 max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight">One platform, not five tools</h2>
          <p className="mt-3 text-muted-foreground">
            Every module shares a single customer data model. No copy-pasting, no sync issues.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <Card key={f.title} className="transition-shadow hover:shadow-md">
              <CardContent className="p-6">
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <f.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-semibold">{f.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{f.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Architecture */}
      <section className="border-t bg-surface/50">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-20 lg:grid-cols-3">
          <Pillar
            icon={Shield}
            title="Multi-tenant by design"
            points={["Every document carries organizationId", "Firestore-ready security rules", "6 roles with granular permissions"]}
          />
          <Pillar
            icon={Zap}
            title="Real-time automation"
            points={["Deal Won → auto project + tasks", "Task done → progress updated", "Time approved → payout batch"]}
          />
          <Pillar
            icon={CheckCircle2}
            title="Modern stack"
            points={["Next.js 15 + TypeScript", "Tailwind + Shadcn UI", "Recharts, dnd-kit, TanStack"]}
          />
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-4 py-20">
        <Card className="overflow-hidden border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
          <CardContent className="flex flex-col items-center gap-6 p-10 text-center lg:flex-row lg:justify-between lg:text-left">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">Try the full workflow now</h2>
              <p className="mt-2 text-muted-foreground">
                Create a lead, win a deal, watch a project auto-generate, track time, and run a payout.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button asChild size="lg">
                <Link href="/dashboard">
                  Launch app <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Footer */}
      <footer className="border-t">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 py-8 text-sm text-muted-foreground sm:flex-row">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded bg-primary text-primary-foreground text-[10px] font-bold">
              S
            </div>
            <span>StartupOS · Phase 1 MVP</span>
          </div>
          <p>Demo data only · No real payments</p>
        </div>
      </footer>
    </div>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="text-center">
      <p className="text-2xl font-bold tracking-tight lg:text-3xl">{value}</p>
      <p className="mt-1 text-sm text-muted-foreground">{label}</p>
    </div>
  );
}

function Pillar({
  icon: Icon,
  title,
  points,
}: {
  icon: typeof Shield;
  title: string;
  points: string[];
}) {
  return (
    <div>
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
        <Icon className="h-5 w-5 text-primary" />
      </div>
      <h3 className="font-semibold">{title}</h3>
      <ul className="mt-3 space-y-2">
        {points.map((p) => (
          <li key={p} className="flex items-start gap-2 text-sm text-muted-foreground">
            <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" />
            {p}
          </li>
        ))}
      </ul>
    </div>
  );
}
