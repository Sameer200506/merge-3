"use client";

import { useMemo, useState } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  useDroppable,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { useTransition } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { moveDeal, createDeal } from "@/app/actions";
import { useAuthStore } from "@/store/auth-store";
import { formatCurrency, formatRelative } from "@/lib/format";
import { Avatar, AvatarFallback, colorFor, initials } from "@/components/ui/avatar";
import { STAGE_COLORS } from "@/lib/constants";
import type { Deal, Pipeline, User } from "@/lib/db/types";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EmptyState } from "@/components/shared/empty-state";
import { KanbanSquare } from "lucide-react";

interface Props {
  pipelines: Pipeline[];
  deals: Deal[];
  customers: Array<{ id: string; name: string; company?: string }>;
  users: User[];
}

/** Multi-pipeline kanban board with dnd-kit drag-and-drop deal movement. */
export function PipelineKanban({ pipelines, deals, customers, users }: Props) {
  const [activePipelineId, setActivePipelineId] = useState(pipelines[0]?.id ?? "");
  const [activeDeal, setActiveDeal] = useState<Deal | null>(null);
  const [pending, startTransition] = useTransition();
  const user = useAuthStore((s) => s.user);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor),
  );

  const pipeline = pipelines.find((p) => p.id === activePipelineId) ?? pipelines[0];
  const pipelineDeals = useMemo(
    () => deals.filter((d) => d.pipelineId === activePipelineId),
    [deals, activePipelineId],
  );

  const customerName = (id: string) => customers.find((c) => c.id === id)?.company ?? customers.find((c) => c.id === id)?.name ?? "Unknown";
  const ownerFor = (id: string) => users.find((u) => u.id === id);

  function handleDragStart(e: DragStartEvent) {
    const deal = pipelineDeals.find((d) => d.id === e.active.id);
    setActiveDeal(deal ?? null);
  }

  function handleDragEnd(e: DragEndEvent) {
    setActiveDeal(null);
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const dealId = String(active.id);
    const newStage = String(over.id);
    const deal = deals.find((d) => d.id === dealId);
    if (!deal || deal.stage === newStage) return;

    startTransition(async () => {
      try {
        await moveDeal(user!.id, dealId, newStage);
        const isWon = ["Won", "Onboarding", "Delivery", "Completed"].includes(newStage);
        if (isWon) {
          toast.success(`🎉 Deal won! Project created automatically.`);
        } else {
          toast.success(`Moved to ${newStage}`);
        }
      } catch {
        toast.error("Failed to move deal");
      }
    });
  }

  if (!pipeline) {
    return (
      <EmptyState
        icon={KanbanSquare}
        title="No pipelines"
        description="Create a pipeline to start managing deals."
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* Pipeline selector + new deal */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {pipelines.map((p) => (
            <button
              key={p.id}
              onClick={() => setActivePipelineId(p.id)}
              className={cn(
                "rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors",
                activePipelineId === p.id
                  ? "border-primary bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-accent",
              )}
            >
              {p.name}
              <span className="ml-1.5 text-xs opacity-60">
                ({deals.filter((d) => d.pipelineId === p.id).length})
              </span>
            </button>
          ))}
        </div>
        <CreateDealDialog
          pipeline={pipeline}
          customers={customers}
          users={users}
          ownerDefault={user?.id}
        />
      </div>

      {/* Board */}
      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={() => setActiveDeal(null)}
      >
        <div className="flex gap-4 overflow-x-auto pb-4">
          {pipeline.stages.map((stage) => {
            const stageDeals = pipelineDeals.filter((d) => d.stage === stage);
            const total = stageDeals.reduce((s, d) => s + d.value, 0);
            return (
              <KanbanColumn
                key={stage}
                stage={stage}
                deals={stageDeals}
                total={total}
                customerName={customerName}
                ownerFor={ownerFor}
                dimmed={pending}
              />
            );
          })}
        </div>

        <DragOverlay>
          {activeDeal ? (
            <DealCard
              deal={activeDeal}
              customer={customerName(activeDeal.customerId)}
              owner={ownerFor(activeDeal.ownerId)}
              dragging
            />
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}

function KanbanColumn({
  stage,
  deals,
  total,
  customerName,
  ownerFor,
  dimmed,
}: {
  stage: string;
  deals: Deal[];
  total: number;
  customerName: (id: string) => string;
  ownerFor: (id: string) => User | undefined;
  dimmed?: boolean;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: stage });
  return (
    <div className="flex w-72 shrink-0 flex-col">
      <div className="mb-2 flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <span className={cn("h-2 w-2 rounded-full", STAGE_COLORS[stage] ?? "bg-slate-400")} />
          <span className="text-sm font-semibold">{stage}</span>
          <span className="text-xs text-muted-foreground">{deals.length}</span>
        </div>
        <span className="text-xs font-medium text-muted-foreground">
          {formatCurrency(total, "USD")}
        </span>
      </div>
      <div
        ref={setNodeRef}
        className={cn(
          "flex-1 space-y-2 rounded-xl border bg-surface/50 p-2 transition-colors min-h-[120px]",
          isOver && "border-primary bg-primary/5",
          dimmed && "opacity-60",
        )}
      >
        {deals.map((deal) => (
          <DraggableDeal
            key={deal.id}
            deal={deal}
            customer={customerName(deal.customerId)}
            owner={ownerFor(deal.ownerId)}
          />
        ))}
        {deals.length === 0 ? (
          <div className="rounded-lg border border-dashed py-6 text-center text-xs text-muted-foreground">
            Drop deals here
          </div>
        ) : null}
      </div>
    </div>
  );
}

function DraggableDeal({
  deal,
  customer,
  owner,
}: {
  deal: Deal;
  customer: string;
  owner?: User;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: deal.id });
  const style = {
    transform: transform ? CSS.Translate.toString(transform) : undefined,
  };
  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={cn(
        "cursor-grab touch-none rounded-lg border bg-card p-3 shadow-sm transition-shadow active:cursor-grabbing hover:shadow-md",
        isDragging && "opacity-40",
      )}
    >
      <DealCard deal={deal} customer={customer} owner={owner} />
    </div>
  );
}

function DealCard({
  deal,
  customer,
  owner,
  dragging,
}: {
  deal: Deal;
  customer: string;
  owner?: User;
  dragging?: boolean;
}) {
  return (
    <div className={cn("space-y-2", dragging && "rotate-2 shadow-lg")}>
      <p className="text-sm font-medium leading-snug">{deal.title}</p>
      <p className="text-xs text-muted-foreground">{customer}</p>
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold tabular-nums">{formatCurrency(deal.value)}</span>
        {owner ? (
          <Avatar className="h-6 w-6" title={owner.name}>
            <AvatarFallback className={colorFor(owner.id)}>{initials(owner.name)}</AvatarFallback>
          </Avatar>
        ) : null}
      </div>
      <div className="flex items-center justify-between text-[10px] text-muted-foreground">
        <span>{deal.probability}% likely</span>
        {deal.expectedCloseDate ? <span>{formatRelative(deal.expectedCloseDate)}</span> : null}
      </div>
    </div>
  );
}

function CreateDealDialog({
  pipeline,
  customers,
  users,
  ownerDefault,
}: {
  pipeline: Pipeline;
  customers: Array<{ id: string; name: string; company?: string }>;
  users: User[];
  ownerDefault?: string;
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [form, setForm] = useState({
    title: "",
    customerId: "",
    stage: pipeline.stages[0] ?? "Lead",
    value: "",
    ownerId: ownerDefault ?? "",
    probability: "20",
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.customerId) {
      toast.error("Title and customer are required");
      return;
    }
    startTransition(async () => {
      try {
        await createDeal(ownerDefault ?? "system", {
          title: form.title,
          customerId: form.customerId,
          pipelineId: pipeline.id,
          stage: form.stage,
          value: Number(form.value) || 0,
          ownerId: form.ownerId,
          probability: Number(form.probability) || 0,
        });
        toast.success("Deal created");
        setOpen(false);
        setForm({ ...form, title: "", value: "" });
      } catch {
        toast.error("Failed to create deal");
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button size="sm" onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4" /> New Deal
      </Button>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New Deal</DialogTitle>
          <DialogDescription>Add a deal to the {pipeline.name}.</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs">Title *</Label>
            <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Customer *</Label>
              <Select value={form.customerId} onValueChange={(v) => setForm({ ...form, customerId: v })}>
                <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                <SelectContent>
                  {customers.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.company || c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Stage</Label>
              <Select value={form.stage} onValueChange={(v) => setForm({ ...form, stage: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {pipeline.stages.map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Value (USD)</Label>
              <Input
                type="number"
                value={form.value}
                onChange={(e) => setForm({ ...form, value: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Owner</Label>
              <Select value={form.ownerId} onValueChange={(v) => setForm({ ...form, ownerId: v })}>
                <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                <SelectContent>
                  {users.map((u) => (
                    <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={pending}>{pending ? "Creating..." : "Create deal"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
