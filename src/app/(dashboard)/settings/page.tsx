"use client";

import { useState } from "react";
import { Sparkles, Loader2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { useShop } from "@/hooks/use-shop";
import { getUnindexedProducts, addProductEmbedding } from "@/lib/products";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface BackfillResult {
  indexed: number;
  failed: number;
  total: number;
}

export default function SettingsPage() {
  const queryClient = useQueryClient();
  const { data: shop } = useShop();
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [result, setResult] = useState<BackfillResult | null>(null);

  async function handleBackfill() {
    if (!shop) return;
    setRunning(true);
    setResult(null);
    setProgress(null);
    try {
      const products = await getUnindexedProducts();
      const total = products.length;

      if (total === 0) {
        setResult({ indexed: 0, failed: 0, total: 0 });
        toast.success("Barcha mahsulotlar allaqachon indekslangan");
        return;
      }

      setProgress({ done: 0, total });
      let indexed = 0;
      let failed = 0;

      // Brauzerda ketma-ket indekslaymiz (model bir marta yuklanadi, keyin tez)
      for (const p of products) {
        try {
          await addProductEmbedding(p.id, shop.id, p.image_url, p.image_url);
          indexed++;
        } catch {
          failed++;
        }
        setProgress({ done: indexed + failed, total });
      }

      setResult({ indexed, failed, total });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success(`${indexed} ta mahsulot indekslandi`, {
        description: failed > 0 ? `${failed} ta muvaffaqiyatsiz` : undefined,
      });
    } catch (err) {
      toast.error("Indekslash xatosi", {
        description: err instanceof Error ? err.message : undefined,
      });
    } finally {
      setRunning(false);
      setProgress(null);
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Sozlamalar</h1>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Vizual qidiruv indeksi
          </CardTitle>
          <CardDescription>
            Mahsulot rasmlarini CLIP bilan indekslaydi — shundan keyin sotuvda kamera
            orqali rasmga qarab mahsulot topish mumkin. Indekslash{" "}
            <strong>brauzeringizda</strong> bajariladi (bepul, server kerak emas).
            Yangi mahsulotlar avtomatik indekslanadi; bu tugma eski mahsulotlar uchun.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={handleBackfill} disabled={running}>
            {running ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {progress
                  ? `Indekslanmoqda... ${progress.done}/${progress.total}`
                  : "Tayyorlanmoqda..."}
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Indekslashni boshlash
              </>
            )}
          </Button>

          {result && (
            <div className="flex items-center gap-2 rounded-md bg-green-50 px-3 py-2 text-sm text-green-700 dark:bg-green-500/15 dark:text-green-400">
              <CheckCircle2 className="h-4 w-4" />
              <span>
                {result.total === 0
                  ? "Indekslanmagan mahsulot yo'q."
                  : `${result.indexed}/${result.total} indekslandi` +
                    (result.failed > 0 ? `, ${result.failed} xato` : "")}
              </span>
            </div>
          )}

          <p className="text-xs text-muted-foreground">
            Eslatma: birinchi marta CLIP modeli yuklanadi (~25MB), keyin brauzerda
            keshlanadi. Internet aloqasi kerak.
          </p>
        </CardContent>
      </Card>

      <p className="py-4 text-center text-sm text-muted-foreground">
        Qolgan do&apos;kon sozlamalari keyingi yangilanishlarda tayyor bo&apos;ladi
      </p>
    </div>
  );
}
