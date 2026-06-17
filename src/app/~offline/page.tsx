import { WifiOff } from "lucide-react";

// Oflayn fallback — keshlanmagan sahifaga internetsiz kirishga urinilganda
// service worker shu sahifani ko'rsatadi. Statik (ma'lumotsiz), default o'zbekcha.
export default function OfflinePage() {
  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center gap-4 bg-background p-6 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-100 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400">
        <WifiOff className="h-8 w-8" />
      </div>
      <h1 className="text-xl font-bold text-foreground">Internet aloqasi yo&apos;q</h1>
      <p className="max-w-sm text-sm text-muted-foreground">
        Bu sahifa hali keshlanmagan. Avval ochilgan sahifalar (Katalog, Sotuv) internetsiz
        ham ishlaydi. Ulanish tiklangach, qayta urinib ko&apos;ring.
      </p>
    </div>
  );
}
