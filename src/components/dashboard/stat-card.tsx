import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string;
  icon: LucideIcon;
  /** rang varianti — semantik (tushum/foyda/soni/ogohlantirish) */
  variant?: "blue" | "green" | "purple" | "orange";
  loading?: boolean;
}

const variants = {
  blue: { wrap: "bg-blue-50", icon: "bg-blue-100 text-blue-700", value: "text-blue-900" },
  green: { wrap: "bg-green-50", icon: "bg-green-100 text-green-700", value: "text-green-900" },
  purple: { wrap: "bg-purple-50", icon: "bg-purple-100 text-purple-700", value: "text-purple-900" },
  orange: { wrap: "bg-orange-50", icon: "bg-orange-100 text-orange-700", value: "text-orange-900" },
};

export function StatCard({ label, value, icon: Icon, variant = "blue", loading }: StatCardProps) {
  const v = variants[variant];
  return (
    <div className={cn("rounded-xl p-4", v.wrap)}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm font-medium text-gray-600">{label}</p>
          {loading ? (
            <div className="mt-2 h-7 w-20 animate-pulse rounded bg-gray-200" />
          ) : (
            <p className={cn("mt-1 text-xl font-bold tabular-nums sm:text-2xl", v.value)}>
              {value}
            </p>
          )}
        </div>
        <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-lg", v.icon)}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}
