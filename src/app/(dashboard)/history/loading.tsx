import { Skeleton } from "@/components/ui/skeleton";

// Sotuv tarixiga o'tilganda darhol ko'rinadigan skeleton (sarlavha + sotuv qatorlari).
export default function HistoryLoading() {
  return (
    <div className="space-y-5">
      <Skeleton className="h-7 w-36" />

      {/* Kun bo'yicha guruhlangan sotuvlar */}
      <div className="space-y-3">
        {Array.from({ length: 7 }).map((_, i) => (
          <Skeleton key={i} className="h-20 rounded-2xl" />
        ))}
      </div>
    </div>
  );
}
