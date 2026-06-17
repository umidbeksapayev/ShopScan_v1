"use client";

import { useState } from "react";
import { Search, ScanLine, WifiOff } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import type { Product, SearchMethod } from "@/types/database";
import { formatCurrency } from "@/lib/utils";
import { useShop } from "@/hooks/use-shop";
import { useProcessCartSale } from "@/hooks/use-sale";
import { useOnlineStatus } from "@/hooks/use-online-status";
import { useCartStore } from "@/stores/cart-store";
import dynamic from "next/dynamic";
import { findProductsByBarcode, type CartSaleResult } from "@/lib/sales";
import { matchBarcode } from "@/lib/offline-lookup";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  CustomerPicker,
  type PickableCustomer,
} from "@/components/customers/customer-picker";
import { remainingDebt } from "@/lib/debt";

export default function SellPage() {
  const { t } = useTranslation();
  const { data: shop } = useShop();
  const { data: allProducts } = useProducts({});
  const { items, addItem, clear, totalRevenue } = useCartStore();
  const saleMut = useProcessCartSale();
  const online = useOnlineStatus();

  const [candidates, setCandidates] = useState<Product[]>([]);
  const [method, setMethod] = useState<SearchMethod>("manual");
  const [addOpen, setAddOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [receipt, setReceipt] = useState<CartSaleResult | null>(null);
  const [receiptItems, setReceiptItems] = useState<ReceiptLineItem[]>([]);
  // Nasiya: mijoz + to'lov turi (checkout paytida)
  const [customer, setCustomer] = useState<PickableCustomer | null>(null);
  const [isCredit, setIsCredit] = useState(false);
  const [paidInput, setPaidInput] = useState("");

  async function handleBarcode(barcode: string) {
    // Dialog ochiq bo'lsa — uzluksiz skan savatni buzmasin (qo'shimcha himoya).
    if (addOpen || !shop) return;
    // Offline (yoki tarmoq xatosi) — keshlangan katalogdan qidiramiz.
    let found: Product[];
    try {
      found = online
        ? await findProductsByBarcode(barcode, shop.id)
        : matchBarcode(allProducts ?? [], barcode);
    } catch {
      found = matchBarcode(allProducts ?? [], barcode);
    }
    if (found.length === 0) {
      toast.error(t("sell.notFound"), {
        description: t("sell.notFoundDesc", { code: barcode }),
      });
      return;
    }
    // Bir nechta moslik bo'lsa — ogohlantirish
    if (found.length > 1) {
      toast.info(t("sell.multipleFound"));
    }
    // DONALI ham, VAZN ham — miqdor dialogini ochamiz (+/− bilan sonni tanlash).
    setMethod("barcode");
    setCandidates(found);
    setAddOpen(true);
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
    if (!shop || !online) return;
    const total = totalRevenue();
    const paid = customer ? (isCredit ? Number(paidInput) || 0 : total) : total;
    try {
      const result = await saleMut.mutateAsync({
        shopId: shop.id,
        items: items.map((i) => ({ product_id: i.product.id, quantity: i.quantity })),
        // Savatdagi birinchi element usulini umumiy usul sifatida olamiz
        method: items[0]?.method ?? "manual",
        customerId: customer?.id ?? null,
        paidAmount: customer ? paid : null,
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
      setCustomer(null);
      setIsCredit(false);
      setPaidInput("");
      setReceipt(result);
    } catch (err) {
      setConfirmOpen(false);
      toast.error(t("sell.saleFailed"), {
        description: err instanceof Error ? err.message : undefined,
      });
    }
  }

  const cartTotal = totalRevenue();
  const cartPaid = customer ? (isCredit ? Number(paidInput) || 0 : cartTotal) : cartTotal;
  const cartDebt = remainingDebt(cartTotal, cartPaid);

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
              <BarcodeScanner onDetected={handleBarcode} paused={addOpen} />
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
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {t("sell.confirmText", {
                count: items.length,
                total: formatCurrency(cartTotal),
              })}
            </p>

            {/* Mijoz (nasiya uchun ixtiyoriy) */}
            {shop && (
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">
                  {t("sell.customerLabel")}
                </Label>
                <CustomerPicker
                  shopId={shop.id}
                  value={customer}
                  onChange={(c) => {
                    setCustomer(c);
                    if (!c) setIsCredit(false);
                  }}
                />
              </div>
            )}

            {/* To'lov turi — faqat mijoz tanlanganda */}
            {customer && (
              <div className="space-y-3 rounded-xl border border-border p-3">
                <label className="flex items-center justify-between">
                  <span className="text-sm font-medium">{t("sell.onCredit")}</span>
                  <Switch checked={isCredit} onCheckedChange={setIsCredit} />
                </label>
                {isCredit && (
                  <div className="space-y-2">
                    <Label htmlFor="paid-input" className="text-xs text-muted-foreground">
                      {t("sell.paidAmount")}
                    </Label>
                    <Input
                      id="paid-input"
                      type="number"
                      inputMode="decimal"
                      min={0}
                      value={paidInput}
                      onChange={(e) => setPaidInput(e.target.value)}
                      placeholder="0"
                    />
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{t("sell.willOwe")}</span>
                      <span className="font-semibold tabular-nums text-amber-600 dark:text-amber-400">
                        {formatCurrency(cartDebt)}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
          {!online && (
            <p className="flex items-center gap-1.5 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-700 dark:bg-amber-500/10 dark:text-amber-400">
              <WifiOff className="h-4 w-4 shrink-0" />
              {t("offline.checkoutBlocked")}
            </p>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>
              {t("common.cancel")}
            </Button>
            <Button onClick={handleConfirmSale} disabled={saleMut.isPending || !online}>
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
