import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string;
  icon: LucideIcon;
  /** rang varianti — semantik (tushum/foyda/soni/ogohlantirish) */
  variant?: "violet" | "blue" | "green" | "amber";
  loading?: boolean;
}

const variants = {
  violet: "bg-violet-100 text-violet-600",
  blue: "bg-sky-100 text-sky-600",
  green: "bg-emerald-100 text-emerald-600",
  amber: "bg-amber-100 text-amber-600",
};

export function StatCard({
  label,
  value,
  icon: Icon,
  variant = "violet",
  loading,
}: StatCardProps) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-soft transition-shadow hover:shadow-card sm:p-5">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <div
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
            variants[variant]
          )}
        >
          <Icon className="h-5 w-5" />
        </div>
      </div>
      {loading ? (
        <div className="mt-3 h-7 w-24 animate-pulse rounded bg-muted" />
      ) : (
        <p className="mt-2 text-xl font-bold tabular-nums text-foreground sm:text-2xl">
          {value}
        </p>
      )}
    </div>
  );
}
