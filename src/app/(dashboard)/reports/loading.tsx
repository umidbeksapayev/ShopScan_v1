import { Skeleton } from "@/components/ui/skeleton";

// Hisobot skeletoni: davr tanlash + KPI kartochkalar + grafik.
export default function ReportsLoading() {
  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <Skeleton className="h-7 w-40" />
        <Skeleton className="h-4 w-52" />
      </div>

      {/* Davr tanlagich */}
      <Skeleton className="h-10 w-full max-w-xs rounded-xl" />

      {/* KPI kartochkalar */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-2xl" />
        ))}
      </div>

      {/* Grafik */}
      <Skeleton className="h-[300px] rounded-2xl" />
    </div>
  );
}
