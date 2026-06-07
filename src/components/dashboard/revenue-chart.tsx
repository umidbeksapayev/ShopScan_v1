"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { SalesTrendPoint } from "@/lib/dashboard";
import { formatCurrency } from "@/lib/utils";

interface RevenueChartProps {
  data: SalesTrendPoint[];
}

/** "2026-06-07" → "07.06" (mahalliy o'q yorlig'i) */
function dayLabel(iso: string): string {
  const [, m, d] = iso.split("-");
  return `${d}.${m}`;
}

/** Y o'qi uchun qisqa son: 1 200 000 → "1.2M", 15 000 → "15k" */
function compactSom(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${Math.round(n / 1_000)}k`;
  return `${n}`;
}

interface TooltipPayloadItem {
  name?: string;
  value?: number;
  color?: string;
  dataKey?: string | number;
}

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border bg-white px-3 py-2 text-sm shadow-md">
      <p className="mb-1 font-medium text-gray-900">{label}</p>
      {payload.map((item) => (
        <p key={item.dataKey} className="flex items-center gap-2 tabular-nums">
          <span
            className="inline-block h-2 w-2 rounded-full"
            style={{ backgroundColor: item.color }}
          />
          <span className="text-gray-600">{item.name}:</span>
          <span className="font-semibold">{formatCurrency(item.value ?? 0)}</span>
        </p>
      ))}
    </div>
  );
}

export function RevenueChart({ data }: RevenueChartProps) {
  const chartData = data.map((d) => ({ ...d, label: dayLabel(d.day) }));

  return (
    <ResponsiveContainer width="100%" height={260}>
      <AreaChart data={chartData} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
        <defs>
          <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#2563eb" stopOpacity={0.25} />
            <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="profitGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#16a34a" stopOpacity={0.25} />
            <stop offset="95%" stopColor="#16a34a" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 12, fill: "#6b7280" }}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          tickFormatter={compactSom}
          tick={{ fontSize: 12, fill: "#6b7280" }}
          tickLine={false}
          axisLine={false}
          width={44}
        />
        <Tooltip content={<ChartTooltip />} />
        <Area
          type="monotone"
          dataKey="revenue"
          name="Tushum"
          stroke="#2563eb"
          strokeWidth={2}
          fill="url(#revGrad)"
        />
        <Area
          type="monotone"
          dataKey="profit"
          name="Foyda"
          stroke="#16a34a"
          strokeWidth={2}
          fill="url(#profitGrad)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
