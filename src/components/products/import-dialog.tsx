"use client";

import { useState } from "react";
import {
  Download,
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  Copy,
  Loader2,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { useShop } from "@/hooks/use-shop";
import { useImportProducts } from "@/hooks/use-products";
import { downloadImportTemplateXlsx, parseProductsFile } from "@/lib/excel";
import { listExistingBarcodes, type ImportResult } from "@/lib/products";
import {
  buildPreview,
  toImportPayload,
  type ImportPreviewResult,
  type ImportPreviewRow,
} from "@/lib/import-products";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

interface ImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const STATUS_BADGE: Record<ImportPreviewRow["status"], "success" | "warning" | "destructive"> = {
  valid: "success",
  duplicate: "warning",
  error: "destructive",
};

export function ImportDialog({ open, onOpenChange }: ImportDialogProps) {
  const { t } = useTranslation();
  const { data: shop } = useShop();
  const importMut = useImportProducts();

  const [parsing, setParsing] = useState(false);
  const [fileName, setFileName] = useState("");
  const [preview, setPreview] = useState<ImportPreviewResult | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);

  function reset() {
    setParsing(false);
    setFileName("");
    setPreview(null);
    setResult(null);
  }

  function handleOpenChange(o: boolean) {
    if (!o) reset();
    onOpenChange(o);
  }

  async function handleTemplate() {
    try {
      await downloadImportTemplateXlsx();
    } catch {
      toast.error(t("import.templateError"));
    }
  }

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // bir xil faylni qayta tanlash mumkin bo'lsin
    if (!file) return;
    setParsing(true);
    setResult(null);
    setFileName(file.name);
    try {
      const [grid, existing] = await Promise.all([
        parseProductsFile(file),
        shop ? listExistingBarcodes(shop.id) : Promise.resolve(new Set<string>()),
      ]);
      const pv = buildPreview(grid, { existingBarcodes: existing });
      setPreview(pv);
      if (pv.headerError) toast.error(t("import.headerError"));
    } catch (err) {
      setPreview(null);
      toast.error(t("import.parseError"), {
        description: err instanceof Error ? err.message : undefined,
      });
    } finally {
      setParsing(false);
    }
  }

  async function handleImport() {
    if (!preview) return;
    const payload = toImportPayload(preview.rows);
    if (payload.length === 0) return;
    try {
      const res = await importMut.mutateAsync(payload);
      setResult(res);
      toast.success(t("import.done"));
    } catch (err) {
      toast.error(t("import.importError"), {
        description: err instanceof Error ? err.message : undefined,
      });
    }
  }

  const importableCount = preview ? toImportPayload(preview.rows).length : 0;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t("import.title")}</DialogTitle>
          <DialogDescription>{t("import.subtitle")}</DialogDescription>
        </DialogHeader>

        {/* ===== Natija bosqichi ===== */}
        {result ? (
          <div className="space-y-4">
            <div className="flex flex-col items-center gap-2 rounded-xl border border-green-200 bg-green-50 py-8 text-center dark:border-green-500/30 dark:bg-green-500/10">
              <CheckCircle2 className="h-10 w-10 text-green-600 dark:text-green-400" />
              <p className="text-lg font-semibold text-foreground">
                {t("import.resultInserted", { count: result.inserted })}
              </p>
              <div className="flex flex-wrap justify-center gap-2 text-sm">
                {result.categories_created > 0 && (
                  <Badge variant="secondary">
                    {t("import.resultCategories", { count: result.categories_created })}
                  </Badge>
                )}
                {result.skipped > 0 && (
                  <Badge variant="warning">
                    {t("import.resultSkipped", { count: result.skipped })}
                  </Badge>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={reset}>
                {t("import.importMore")}
              </Button>
              <Button onClick={() => handleOpenChange(false)}>{t("common.close")}</Button>
            </DialogFooter>
          </div>
        ) : preview && !preview.headerError ? (
          /* ===== Preview / tekshiruv bosqichi ===== */
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="success" className="gap-1">
                <CheckCircle2 className="h-3 w-3" />
                {t("import.countValid", { count: preview.validCount })}
              </Badge>
              {preview.duplicateCount > 0 && (
                <Badge variant="warning" className="gap-1">
                  <Copy className="h-3 w-3" />
                  {t("import.countDuplicate", { count: preview.duplicateCount })}
                </Badge>
              )}
              {preview.errorCount > 0 && (
                <Badge variant="destructive" className="gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  {t("import.countError", { count: preview.errorCount })}
                </Badge>
              )}
            </div>

            <div className="max-h-[45vh] space-y-1.5 overflow-y-auto rounded-xl border p-2">
              {preview.rows.map((row) => (
                <div
                  key={row.rowNumber}
                  className="flex items-start gap-2 rounded-lg px-2 py-1.5 text-sm odd:bg-muted/40"
                >
                  <span className="w-6 shrink-0 pt-0.5 text-right text-xs text-muted-foreground">
                    {row.rowNumber}
                  </span>
                  <div className="min-w-0 flex-1">
                    <span className="font-medium text-foreground">
                      {row.name || <span className="text-muted-foreground">—</span>}
                    </span>
                    {row.status === "error" && (
                      <span className="ml-2 text-xs text-destructive">
                        {row.errors.map((c) => t(`import.err.${c}`)).join(", ")}
                      </span>
                    )}
                    {row.status === "duplicate" && (
                      <span className="ml-2 text-xs text-amber-600 dark:text-amber-500">
                        {t("import.err.duplicate")}
                      </span>
                    )}
                  </div>
                  <Badge variant={STATUS_BADGE[row.status]} className="shrink-0">
                    {t(`import.status_${row.status}`)}
                  </Badge>
                </div>
              ))}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={reset} disabled={importMut.isPending}>
                {t("import.chooseAnother")}
              </Button>
              <Button onClick={handleImport} disabled={importMut.isPending || importableCount === 0}>
                {importMut.isPending && <Loader2 className="mr-1 h-4 w-4 animate-spin" />}
                {t("import.confirmBtn", { count: importableCount })}
              </Button>
            </DialogFooter>
          </div>
        ) : (
          /* ===== Yuklash bosqichi ===== */
          <div className="space-y-4">
            <div className="rounded-xl border bg-muted/40 p-4">
              <p className="text-sm font-medium text-foreground">{t("import.step1Title")}</p>
              <p className="mb-3 mt-0.5 text-xs text-muted-foreground">
                {t("import.columnsHint")}
              </p>
              <Button variant="outline" size="sm" onClick={handleTemplate}>
                <Download className="mr-1 h-4 w-4" />
                {t("import.downloadTemplate")}
              </Button>
            </div>

            <label
              className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed py-10 text-center transition-colors hover:border-primary hover:bg-accent/50"
              aria-disabled={parsing}
            >
              {parsing ? (
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              ) : (
                <Upload className="h-8 w-8 text-muted-foreground" />
              )}
              <span className="text-sm font-medium text-foreground">
                {parsing ? t("import.parsing") : t("import.step2Title")}
              </span>
              {fileName && !parsing && (
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <FileSpreadsheet className="h-3.5 w-3.5" /> {fileName}
                </span>
              )}
              <span className="text-xs text-muted-foreground">{t("import.fileTypes")}</span>
              <input
                type="file"
                accept=".xlsx,.csv,text/csv"
                className="hidden"
                onChange={handleFile}
                disabled={parsing}
              />
            </label>

            {preview?.headerError && (
              <p className="flex items-center gap-1.5 text-sm text-destructive">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                {t("import.headerError")}
              </p>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
