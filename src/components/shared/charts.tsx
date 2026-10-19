"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatCompactCurrency, formatCurrency } from "@/lib/format";

/** Shared axis + grid styling so every chart looks like one design system. */
const axisProps = {
  tick: { fontSize: 11, fill: "hsl(var(--muted-foreground))" },
  tickLine: false,
  axisLine: false,
};

const tooltipStyle = {
  borderRadius: 8,
  border: "1px solid hsl(var(--border))",
  background: "hsl(var(--popover))",
  color: "hsl(var(--popover-foreground))",
  fontSize: 12,
  boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
};

interface SeriesPoint {
  label: string;
  value: number;
}

/** Revenue area chart — last 8 weeks. */
export function RevenueAreaChart({ data }: { data: Array<{ week: string; revenue: number }> }) {
  const formatted = data.map((d) => ({ week: d.week, revenue: Math.round(d.revenue) }));
  return (
    <ResponsiveContainer width="100%" height={240}>
      <AreaChart data={formatted} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
        <defs>
          <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="hsl(243 75% 59%)" stopOpacity={0.35} />
            <stop offset="100%" stopColor="hsl(243 75% 59%)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
        <XAxis dataKey="week" {...axisProps} />
        <YAxis {...axisProps} tickFormatter={(v) => formatCompactCurrency(v)} width={56} />
        <Tooltip
          contentStyle={tooltipStyle}
          formatter={(v: number) => [formatCurrency(v), "Revenue"]}
        />
        <Area
          type="monotone"
          dataKey="revenue"
          stroke="hsl(243 75% 59%)"
          strokeWidth={2}
          fill="url(#revGrad)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

const STAGE_CHART_COLORS = [
  "hsl(243 75% 59%)",
  "hsl(199 89% 48%)",
  "hsl(262 83% 58%)",
  "hsl(38 92% 50%)",
  "hsl(158 64% 52%)",
  "hsl(330 81% 60%)",
];

/** Pipeline-by-stage bar chart. */
export function PipelineBarChart({ data }: { data: SeriesPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
        <XAxis dataKey="label" {...axisProps} />
        <YAxis {...axisProps} tickFormatter={(v) => formatCompactCurrency(v)} width={56} />
        <Tooltip
          cursor={{ fill: "hsl(var(--muted))", opacity: 0.4 }}
          contentStyle={tooltipStyle}
          formatter={(v: number) => [formatCurrency(v), "Value"]}
        />
        <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={48}>
          {data.map((_, i) => (
            <Cell key={i} fill={STAGE_CHART_COLORS[i % STAGE_CHART_COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

/** Compact horizontal bars for team workload. */
export function WorkloadBars({ data }: { data: Array<{ label: string; value: number; sub?: string }> }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <div className="space-y-3">
      {data.map((d) => (
        <div key={d.label} className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium">{d.label}</span>
            <span className="text-muted-foreground">
              {d.value} {d.sub ? `· ${d.sub}` : ""}
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${(d.value / max) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
