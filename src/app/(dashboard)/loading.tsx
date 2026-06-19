import { Skeleton } from "@/components/ui/skeleton";

// Har qanday dashboard sahifasiga o'tilganda DARHOL ko'rinadigan skeleton.
// Tugma bosilishi bilan ekran "qotmaydi" — silliq, tez his beradi.
export default function DashboardLoading() {
  return (
    <div className="space-y-5">
      {/* Sarlavha qatori */}
      <div className="space-y-2">
        <Skeleton className="h-7 w-40" />
        <Skeleton className="h-4 w-56" />
      </div>

      {/* Statistik kartochkalar */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-2xl" />
        ))}
      </div>

      {/* Ro'yxat qatorlari */}
      <div className="space-y-2.5">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-16 rounded-2xl" />
        ))}
      </div>
    </div>
  );
}
