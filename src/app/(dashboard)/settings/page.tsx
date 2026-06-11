"use client";

import { useState } from "react";
import { Sparkles, Loader2, CheckCircle2 } from "lucide-react";
import { useTranslation } from "react-i18next";
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
  const { t } = useTranslation();
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
        toast.success(t("settings.allIndexed"));
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
      toast.success(t("settings.indexedToast", { count: indexed }), {
        description: failed > 0 ? t("settings.indexFailed", { failed }) : undefined,
      });
    } catch (err) {
      toast.error(t("settings.indexError"), {
        description: err instanceof Error ? err.message : undefined,
      });
    } finally {
      setRunning(false);
      setProgress(null);
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">{t("settings.title")}</h1>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            {t("settings.visualIndex")}
          </CardTitle>
          <CardDescription>{t("settings.visualIndexDesc")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={handleBackfill} disabled={running}>
            {running ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {progress
                  ? `${t("settings.indexing")} ${progress.done}/${progress.total}`
                  : t("settings.preparing")}
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                {t("settings.startIndex")}
              </>
            )}
          </Button>

          {result && (
            <div className="flex items-center gap-2 rounded-md bg-green-50 px-3 py-2 text-sm text-green-700 dark:bg-green-500/15 dark:text-green-400">
              <CheckCircle2 className="h-4 w-4" />
              <span>
                {result.total === 0
                  ? t("settings.noUnindexed")
                  : t("settings.indexedCount", {
                      indexed: result.indexed,
                      total: result.total,
                    }) +
                    (result.failed > 0
                      ? ", " + t("settings.indexFailed", { failed: result.failed })
                      : "")}
              </span>
            </div>
          )}

          <p className="text-xs text-muted-foreground">{t("settings.indexNote")}</p>
        </CardContent>
      </Card>

      <p className="py-4 text-center text-sm text-muted-foreground">
        {t("settings.otherSettings")}
      </p>
    </div>
  );
}
