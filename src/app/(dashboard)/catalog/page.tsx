"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import type { Product } from "@/types/database";
import { useShop } from "@/hooks/use-shop";
import { useProducts, useArchiveProduct } from "@/hooks/use-products";
import { useCatalogStore } from "@/stores/catalog-store";
import { CatalogToolbar } from "@/components/products/catalog-toolbar";
import { ProductCard } from "@/components/products/product-card";
import { ProductForm } from "@/components/products/product-form";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function CatalogPage() {
  const { data: shop } = useShop();
  const { search, saleType, sortBy, sortDir } = useCatalogStore();
  const { data: products, isLoading } = useProducts({
    search,
    saleType,
    sortBy,
    sortDir,
  });
  const archiveMut = useArchiveProduct();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);

  function openAdd() {
    setEditing(null);
    setDialogOpen(true);
  }
  function openEdit(p: Product) {
    setEditing(p);
    setDialogOpen(true);
  }

  async function handleArchive(p: Product) {
    if (!confirm(`"${p.name}" mahsulotini arxivlashni tasdiqlaysizmi?`)) return;
    try {
      await archiveMut.mutateAsync(p.id);
      toast.success("Mahsulot arxivlandi");
    } catch {
      toast.error("Arxivlashda xato");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Mahsulotlar</h1>
        <Button onClick={openAdd} disabled={!shop}>
          <Plus className="mr-1 h-4 w-4" /> Qo&apos;shish
        </Button>
      </div>

      <CatalogToolbar />

      {isLoading ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="aspect-[3/4] w-full rounded-xl" />
          ))}
        </div>
      ) : !products || products.length === 0 ? (
        <div className="rounded-xl border border-dashed py-16 text-center">
          <p className="text-gray-500">
            {search ? "Hech narsa topilmadi" : "Hali mahsulot yo'q"}
          </p>
          {!search && (
            <Button onClick={openAdd} variant="outline" className="mt-4" disabled={!shop}>
              <Plus className="mr-1 h-4 w-4" /> Birinchi mahsulotni qo&apos;shing
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {products.map((p) => (
            <ProductCard
              key={p.id}
              product={p}
              onEdit={openEdit}
              onArchive={handleArchive}
            />
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editing ? "Mahsulotni tahrirlash" : "Yangi mahsulot"}
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
    </div>
  );
}
