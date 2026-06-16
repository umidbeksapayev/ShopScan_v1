"use client";

import { useState } from "react";
import { Search, ScanLine } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import type { Product, SearchMethod } from "@/types/database";
import { formatCurrency } from "@/lib/utils";
import { useShop } from "@/hooks/use-shop";
import { useProcessCartSale } from "@/hooks/use-sale";
import { useCartStore } from "@/stores/cart-store";
import dynamic from "next/dynamic";
import { findProductsByBarcode, type CartSaleResult } from "@/lib/sales";
import type { ReceiptLineItem } from "@/lib/receipt-print";
import { useProducts } from "@/hooks/use-products";
import { AddToCartDialog } from "@/components/sales/add-to-cart-dialog";
import { LiveProductSearch } from "@/components/sales/live-product-search";

// Og'ir kamera kutubxonasi (@zxing/library) faqat kerak bo'lganda yuklanadi
const cameraLoading = () => (
  <div className="flex aspect-video w-full items-center justify-center rounded-xl bg-muted text-sm text-muted-foreground">
    Kamera yuklanmoqda...
  </div>
);

const BarcodeScanner = dynamic(
  () => import("@/components/sales/barcode-scanner").then((m) => m.BarcodeScanner),
  { ssr: false, loading: cameraLoading }
);
import { CartPanel } from "@/components/sales/cart-panel";
import { Receipt } from "@/components/sales/receipt";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function SellPage() {
  const { t } = useTranslation();
  const { data: shop } = useShop();
  const { data: allProducts } = useProducts({});
  const { items, addItem, clear, totalRevenue } = useCartStore();
  const saleMut = useProcessCartSale();

  const [candidates, setCandidates] = useState<Product[]>([]);
  const [method, setMethod] = useState<SearchMethod>("manual");
  const [addOpen, setAddOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [receipt, setReceipt] = useState<CartSaleResult | null>(null);
  const [receiptItems, setReceiptItems] = useState<ReceiptLineItem[]>([]);

  async function handleBarcode(barcode: string) {
    try {
      const found = await findProductsByBarcode(barcode);
      if (found.length === 0) {
        toast.error(t("sell.notFound"), {
          description: t("sell.notFoundDesc", { code: barcode }),
        });
        return;
      }
      // Bitta DONALI mahsulot → darhol savatga (qo'shimcha klik yo'q)
      if (found.length === 1 && found[0].sale_type === "unit") {
        addItem(found[0], 1, "barcode");
        toast.success(t("sell.addedNamed", { name: found[0].name }));
        return;
      }
      // Vazn (kg kiritish kerak) yoki bir nechta moslik → dialog
      if (found.length > 1) {
        toast.info(t("sell.multipleFound"));
      }
      setMethod("barcode");
      setCandidates(found);
      setAddOpen(true);
    } catch {
      toast.error(t("sell.searchError"));
    }
  }

  function handleManualSelect(p: Product) {
    // Donali → darhol savatga; vazn → kg dialogi
    if (p.sale_type === "unit") {
      addItem(p, 1, "manual");
      toast.success(t("sell.addedNamed", { name: p.name }));
      return;
    }
    setMethod("manual");
    setCandidates([p]);
    setAddOpen(true);
  }

  async function handleConfirmSale() {
    if (!shop) return;
    try {
      const result = await saleMut.mutateAsync({
        shopId: shop.id,
        items: items.map((i) => ({ product_id: i.product.id, quantity: i.quantity })),
        // Savatdagi birinchi element usulini umumiy usul sifatida olamiz
        method: items[0]?.method ?? "manual",
      });
      // Savat tozalanishidan OLDIN chek uchun snapshot olamiz (narxsiz/foydasiz).
      setReceiptItems(
        items.map((i) => ({
          name: i.product.name,
          quantity: i.quantity,
          saleType: i.product.sale_type,
          unitPrice: i.product.selling_price,
        }))
      );
      setConfirmOpen(false);
      clear();
      setReceipt(result);
    } catch (err) {
      setConfirmOpen(false);
      toast.error(t("sell.saleFailed"), {
        description: err instanceof Error ? err.message : undefined,
      });
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">{t("sell.title")}</h1>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Chap: topish */}
        <div>
          <Tabs defaultValue="barcode">
            <TabsList className="w-full">
              <TabsTrigger value="barcode" className="flex-1 gap-1.5">
                <ScanLine className="h-4 w-4" /> {t("sell.tabBarcode")}
              </TabsTrigger>
              <TabsTrigger value="manual" className="flex-1 gap-1.5">
                <Search className="h-4 w-4" /> {t("sell.tabManual")}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="barcode">
              <BarcodeScanner onDetected={handleBarcode} />
            </TabsContent>

            <TabsContent value="manual">
              <LiveProductSearch
                products={allProducts ?? []}
                onSelect={handleManualSelect}
              />
            </TabsContent>
          </Tabs>
        </div>

        {/* O'ng: savat */}
        <CartPanel onCheckout={() => setConfirmOpen(true)} loading={saleMut.isPending} />
      </div>

      {/* Savatga qo'shish dialogi */}
      <AddToCartDialog
        open={addOpen}
        candidates={candidates}
        method={method}
        onAdd={(p, q, m) => {
          addItem(p, q, m);
          toast.success(t("sell.addedToCart"));
        }}
        onClose={() => setAddOpen(false)}
      />

      {/* Tasdiqlash modali (FR-28) */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{t("sell.confirmTitle")}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            {t("sell.confirmText", {
              count: items.length,
              total: formatCurrency(totalRevenue()),
            })}
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>
              {t("common.cancel")}
            </Button>
            <Button onClick={handleConfirmSale} disabled={saleMut.isPending}>
              {saleMut.isPending ? t("sell.selling") : t("sell.sellBtn")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Chek */}
      <Receipt
        open={!!receipt}
        result={receipt}
        items={receiptItems}
        shopName={shop?.name ?? t("auth.shopNamePlaceholder")}
        onNext={() => setReceipt(null)}
      />
    </div>
  );
}
