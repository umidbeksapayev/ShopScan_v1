import { Skeleton } from "@/components/ui/skeleton";

// Sotuv ekraniga o'tilganda darhol ko'rinadigan skeleton (qidiruv + savat + jami).
export default function SellLoading() {
  return (
    <div className="space-y-4">
      {/* Qidiruv / skaner qatori */}
      <div className="flex gap-2">
        <Skeleton className="h-12 flex-1 rounded-xl" />
        <Skeleton className="h-12 w-12 rounded-xl" />
      </div>

      {/* Savat qatorlari */}
      <div className="space-y-2.5">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-16 rounded-2xl" />
        ))}
      </div>

      {/* Jami + to'lov tugmasi (pastda) */}
      <div className="fixed inset-x-0 bottom-0 space-y-2 border-t border-border bg-card p-4">
        <div className="mx-auto max-w-md space-y-2">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-12 w-full rounded-xl" />
        </div>
      </div>
    </div>
  );
}
