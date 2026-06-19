import { Skeleton } from "@/components/ui/skeleton";

// Katalog skeletoni: qidiruv + filtrlar + mahsulot qatorlari.
export default function CatalogLoading() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <Skeleton className="h-7 w-36" />
        <Skeleton className="h-10 w-28 rounded-xl" />
      </div>

      {/* Qidiruv qatori */}
      <Skeleton className="h-11 w-full rounded-xl" />

      {/* Mahsulot qatorlari */}
      <div className="space-y-2.5">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-3 rounded-2xl border border-border p-3"
          >
            <Skeleton className="h-12 w-12 shrink-0 rounded-xl" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-3 w-1/3" />
            </div>
            <Skeleton className="h-6 w-16 rounded-lg" />
          </div>
        ))}
      </div>
    </div>
  );
}
