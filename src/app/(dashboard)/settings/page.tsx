"use client";

import { useState } from "react";
import { Sparkles, Loader2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
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
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<BackfillResult | null>(null);

  async function handleBackfill() {
    setRunning(true);
    setResult(null);
    try {
      const res = await fetch("/api/embed/backfill", { method: "POST" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Indekslash xatosi");

      setResult(json as BackfillResult);
      queryClient.invalidateQueries({ queryKey: ["products"] });

      if (json.total === 0) {
        toast.success("Barcha mahsulotlar allaqachon indekslangan");
      } else {
        toast.success(`${json.indexed} ta mahsulot indekslandi`, {
          description: json.failed > 0 ? `${json.failed} ta muvaffaqiyatsiz` : undefined,
        });
      }
    } catch (err) {
      toast.error("Indekslash xatosi", {
        description: err instanceof Error ? err.message : undefined,
      });
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Sozlamalar</h1>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-600" />
            Vizual qidiruv indeksi
          </CardTitle>
          <CardDescription>
            Mahsulot rasmlarini CLIP bilan indekslaydi — shundan keyin sotuvda
            kamera orqali rasmga qarab mahsulot topish mumkin bo&apos;ladi. Yangi
            mahsulotlar avtomatik indekslanadi; bu tugma eski mahsulotlar uchun.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={handleBackfill} disabled={running}>
            {running ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Indekslanmoqda...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Indekslashni boshlash
              </>
            )}
          </Button>

          {result && (
            <div className="flex items-center gap-2 rounded-md bg-green-50 px-3 py-2 text-sm text-green-700">
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
            Eslatma: bu funksiya uchun <code>REPLICATE_API_TOKEN</code> sozlangan
            bo&apos;lishi kerak.
          </p>
        </CardContent>
      </Card>

      <p className="py-4 text-center text-sm text-muted-foreground">
        Qolgan do&apos;kon sozlamalari Sprint 6 da tayyor bo&apos;ladi
      </p>
    </div>
  );
}
