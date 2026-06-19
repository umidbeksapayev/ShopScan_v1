import { Skeleton } from "@/components/ui/skeleton";

// Dashboard skeletoni: statistik kartochkalar + daromad grafigi + kam qolgan ro'yxat.
export default function DashboardPageLoading() {
  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <Skeleton className="h-7 w-44" />
        <Skeleton className="h-4 w-60" />
      </div>

      {/* Statistik kartochkalar */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-2xl" />
        ))}
      </div>

      {/* Daromad grafigi */}
      <Skeleton className="h-[280px] rounded-2xl" />

      {/* Kam qolgan mahsulotlar */}
      <div className="space-y-2.5">
        <Skeleton className="h-5 w-36" />
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-14 rounded-xl" />
        ))}
      </div>
    </div>
  );
}
