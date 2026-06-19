import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string;
  icon: LucideIcon;
  /** rang varianti — semantik (tushum/foyda/soni/ogohlantirish) */
  variant?: "brand" | "blue" | "green" | "amber";
  loading?: boolean;
}

// Jonli gradient ikona tiles (premium)
const variants = {
  brand: "from-[#2F80ED] to-[#0F3D6E]",
  blue: "from-sky-500 to-blue-500",
  green: "from-emerald-500 to-teal-500",
  amber: "from-amber-500 to-orange-500",
};

export function StatCard({
  label,
  value,
  icon: Icon,
  variant = "brand",
  loading,
}: StatCardProps) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-soft transition-all duration-200 hover:-translate-y-0.5 hover:shadow-card sm:p-5">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <div
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-sm",
            variants[variant]
          )}
        >
          <Icon className="h-5 w-5" />
        </div>
      </div>
      {loading ? (
        <div className="mt-3 h-8 w-24 animate-pulse rounded bg-muted" />
      ) : (
        <p className="mt-2 text-2xl font-bold tabular-nums text-foreground sm:text-3xl">
          {value}
        </p>
      )}
    </div>
  );
}
