"use client";

import { useState } from "react";
import { Plus, Upload, FolderTree } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import type { Product } from "@/types/database";
import { useShop } from "@/hooks/use-shop";
import { useProducts, useArchiveProduct } from "@/hooks/use-products";
import { usePermissionGuard } from "@/hooks/use-guards";
import { useCatalogStore } from "@/stores/catalog-store";
import { CatalogToolbar } from "@/components/products/catalog-toolbar";
import { ProductCard } from "@/components/products/product-card";
import { ProductTable } from "@/components/products/product-table";
import { ProductForm } from "@/components/products/product-form";
import { CategoryManager } from "@/components/products/category-manager";
import { ImportDialog } from "@/components/products/import-dialog";
import { LabelPrintDialog } from "@/components/products/label-print-dialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function CatalogPage() {
  const { t } = useTranslation();
  const { data: shop } = useShop();
  const { search, saleType, categoryId, sortBy, sortDir, viewMode } = useCatalogStore();
  const { data: products, isLoading } = useProducts({
    search,
    saleType,
    categoryId,
    sortBy,
    sortDir,
  });
  const archiveMut = useArchiveProduct();
  const { checking } = usePermissionGuard("manage_products");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [catManagerOpen, setCatManagerOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [labelProduct, setLabelProduct] = useState<Product | null>(null);

  function openAdd() {
    setEditing(null);
    setDialogOpen(true);
  }
  function openEdit(p: Product) {
    setEditing(p);
    setDialogOpen(true);
  }

  async function handleArchive(p: Product) {
    if (!confirm(t("catalog.archiveConfirm", { name: p.name }))) return;
    try {
      await archiveMut.mutateAsync(p.id);
      toast.success(t("catalog.archived"));
    } catch {
      toast.error(t("catalog.archiveError"));
    }
  }

  if (checking) return null;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-bold text-foreground">{t("catalog.title")}</h1>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => setCatManagerOpen(true)} disabled={!shop}>
            <FolderTree className="mr-1 h-4 w-4" /> {t("category.manageBtn")}
          </Button>
          <Button variant="outline" onClick={() => setImportOpen(true)} disabled={!shop}>
            <Upload className="mr-1 h-4 w-4" /> {t("import.btn")}
          </Button>
          <Button onClick={openAdd} disabled={!shop}>
            <Plus className="mr-1 h-4 w-4" /> {t("common.add")}
          </Button>
        </div>
      </div>

      <CatalogToolbar />

      {isLoading ? (
        viewMode === "grid" ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="aspect-[3/4] w-full rounded-xl" />
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-[72px] w-full rounded-xl" />
            ))}
          </div>
        )
      ) : !products || products.length === 0 ? (
        <div className="rounded-2xl border border-dashed py-16 text-center">
          <p className="text-muted-foreground">
            {search ? t("catalog.notFound") : t("catalog.empty")}
          </p>
          {!search && (
            <Button onClick={openAdd} variant="outline" className="mt-4" disabled={!shop}>
              <Plus className="mr-1 h-4 w-4" /> {t("catalog.addFirst")}
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground">
            {t("catalog.count", { count: products.length })}
          </p>
          {viewMode === "grid" ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {products.map((p) => (
                <ProductCard
                  key={p.id}
                  product={p}
                  onEdit={openEdit}
                  onArchive={handleArchive}
                  onPrintLabel={setLabelProduct}
                />
              ))}
            </div>
          ) : (
            <ProductTable
              products={products}
              onEdit={openEdit}
              onArchive={handleArchive}
              onPrintLabel={setLabelProduct}
            />
          )}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editing ? t("catalog.editProduct") : t("catalog.newProduct")}
            </DialogTitle>
          </DialogHeader>
          {shop && (
            <ProductForm
              shopId={shop.id}
              product={editing}
              onSuccess={() => setDialogOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>

      <CategoryManager open={catManagerOpen} onOpenChange={setCatManagerOpen} />
      <ImportDialog open={importOpen} onOpenChange={setImportOpen} />
      <LabelPrintDialog
        product={labelProduct}
        shopName={shop?.name ?? ""}
        open={!!labelProduct}
        onClose={() => setLabelProduct(null)}
      />
    </div>
  );
}
