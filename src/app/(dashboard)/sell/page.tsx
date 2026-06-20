"use client";

import { useRef, useState } from "react";
import { Search, ScanLine, WifiOff, Banknote, CreditCard, NotebookPen, Check, QrCode } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import type { Product, SearchMethod } from "@/types/database";
import { cn, formatCurrency } from "@/lib/utils";
import { useQueryClient } from "@tanstack/react-query";
import { useShop } from "@/hooks/use-shop";
import { useProcessCartSale } from "@/hooks/use-sale";
import { useOnlineStatus } from "@/hooks/use-online-status";
import { useCartStore } from "@/stores/cart-store";
import { useOfflineSyncStore } from "@/stores/offline-sync-store";
import { ScannerView } from "@/components/sales/scanner-view";
import { findProductsByBarcode, type CartSaleResult } from "@/lib/sales";
import { matchBarcode } from "@/lib/offline-lookup";
import type { ReceiptLineItem } from "@/lib/receipt-print";
import { useProducts } from "@/hooks/use-products";
import { AddToCartDialog } from "@/components/sales/add-to-cart-dialog";
import { LiveProductSearch } from "@/components/sales/live-product-search";

import { CartPanel } from "@/components/sales/cart-panel";
import { QrPaymentSheet } from "@/components/sales/qr-payment-sheet";
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
  const qc = useQueryClient();
  const enqueueSale = useOfflineSyncStore((s) => s.enqueue);

  const [candidates, setCandidates] = useState<Product[]>([]);
  const [method, setMethod] = useState<SearchMethod>("manual");
  const [addOpen, setAddOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [receipt, setReceipt] = useState<CartSaleResult | null>(null);
  const [receiptItems, setReceiptItems] = useState<ReceiptLineItem[]>([]);
  const [receiptQueued, setReceiptQueued] = useState(false);
  // To'lov turi: naqd / plastik / QR / nasiya (checkout paytida)
  const [payMethod, setPayMethod] = useState<"cash" | "card" | "qr" | "credit">("cash");
  const [customer, setCustomer] = useState<PickableCustomer | null>(null);
  const [paidInput, setPaidInput] = useState("");
  // QR to'lov sheet'i (onlayn ekvayring)
  const [qrOpen, setQrOpen] = useState(false);
  const [qrPayload, setQrPayload] = useState<{
    saleItems: { product_id: string; quantity: number }[];
    method: SearchMethod;
    snapshot: ReceiptLineItem[];
    total: number;
    clientId: string;
  } | null>(null);
  // QR to'lov yoqilganmi (do'kon sozlamasi + online shart)
  const qrEnabled = !!shop?.acquiring_enabled && online;
  // Bir xil topilmagan barcode'ni qayta-qayta toast qilmaslik uchun (spam himoyasi)
  const lastNotFoundRef = useRef<{ code: string; at: number } | null>(null);

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
      const now = Date.now();
      const ln = lastNotFoundRef.current;
      lastNotFoundRef.current = { code: barcode, at: now };
      // Bir xil topilmagan kod 8s ichida qayta-qayta toast chiqarmaydi
      if (!ln || ln.code !== barcode || now - ln.at > 8000) {
        toast.error(t("sell.notFound"), {
          description: t("sell.notFoundDesc", { code: barcode }),
        });
      }
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

  function resetCheckout() {
    setConfirmOpen(false);
    clear();
    setCustomer(null);
    setPayMethod("cash");
    setPaidInput("");
  }

  async function handleConfirmSale() {
    if (!shop) return;
    const total = totalRevenue();
    // Nasiya = mijoz tanlangan kredit sotuv; naqd/plastik = to'liq to'lov
    const isCreditSale = payMethod === "credit" && !!customer;
    const paid = isCreditSale ? Number(paidInput) || 0 : total;
    const saleCustomerId = isCreditSale ? customer!.id : null;
    const saleItems = items.map((i) => ({ product_id: i.product.id, quantity: i.quantity }));
    const method = items[0]?.method ?? "manual";
    // Savat tozalanishidan OLDIN chek uchun snapshot (narxsiz/foydasiz).
    const snapshot = items.map((i) => ({
      name: i.product.name,
      quantity: i.quantity,
      saleType: i.product.sale_type,
      unitPrice: i.product.selling_price,
    }));
    const clientId = crypto.randomUUID();

    // ===== QR to'lov (faqat online): sotuv QR tasdiqlangach yakunlanadi =====
    if (payMethod === "qr" && online) {
      setQrPayload({ saleItems, method, snapshot, total, clientId });
      setConfirmOpen(false);
      setQrOpen(true);
      return;
    }

    // ===== Offline: navbatga qo'yamiz (S6b) =====
    if (!online) {
      const sold = items.map((i) => ({ id: i.product.id, qty: i.quantity }));
      await enqueueSale({
        clientId,
        shopId: shop.id,
        items: saleItems,
        method,
        customerId: saleCustomerId,
        paidAmount: isCreditSale ? paid : null,
        receiptItems: snapshot,
        totalRevenue: total,
        customerName: isCreditSale ? customer!.name : null,
        createdAt: new Date().toISOString(),
        status: "pending",
      });
      // Keshdagi qoldiqni optimistik kamaytiramiz (qayta sotuvda to'g'ri ko'rinsin)
      qc.setQueriesData<Product[]>({ queryKey: ["products"] }, (old) =>
        Array.isArray(old)
          ? old.map((p) => {
              const s = sold.find((x) => x.id === p.id);
              return s ? { ...p, quantity: p.quantity - s.qty } : p;
            })
          : old
      );
      setReceiptItems(snapshot);
      setReceiptQueued(true);
      setReceipt({
        sale_id: clientId,
        item_count: items.length,
        total_revenue: total,
        total_profit: 0,
        paid_amount: isCreditSale ? paid : total,
        debt: isCreditSale ? remainingDebt(total, paid) : 0,
      });
      resetCheckout();
      toast.success(t("sync.queuedToast"));
      return;
    }

    // ===== Online: odatdagi atomar sotuv =====
    try {
      const result = await saleMut.mutateAsync({
        shopId: shop.id,
        items: saleItems,
        method,
        customerId: saleCustomerId,
        paidAmount: isCreditSale ? paid : null,
        clientId,
      });
      setReceiptItems(snapshot);
      setReceiptQueued(false);
      setReceipt(result);
      resetCheckout();
    } catch (err) {
      setConfirmOpen(false);
      toast.error(t("sell.saleFailed"), {
        description: err instanceof Error ? err.message : undefined,
      });
    }
  }

  // QR to'lov tasdiqlandi → MAVJUD atomar sotuvni idempotent yakunlaymiz.
  // (Webhook faqat to'lov holatini belgilaydi; sotuvni kassir klienti yozadi.)
  async function handleQrPaid() {
    if (!shop || !qrPayload) return;
    try {
      const result = await saleMut.mutateAsync({
        shopId: shop.id,
        items: qrPayload.saleItems,
        method: qrPayload.method,
        customerId: null,
        paidAmount: null,
        clientId: qrPayload.clientId,
      });
      setReceiptItems(qrPayload.snapshot);
      setReceiptQueued(false);
      setReceipt(result);
      setQrOpen(false);
      setQrPayload(null);
      resetCheckout();
    } catch (err) {
      toast.error(t("sell.saleFailed"), {
        description: err instanceof Error ? err.message : undefined,
      });
    }
  }

  const cartTotal = totalRevenue();
  const isCredit = payMethod === "credit";
  const cartPaid = isCredit && customer ? Number(paidInput) || 0 : cartTotal;
  const cartDebt = isCredit && customer ? remainingDebt(cartTotal, cartPaid) : 0;

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
              <ScannerView onDetected={handleBarcode} paused={addOpen} />
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

            {/* To'lov turi: Naqd / Plastik / QR (katta) + Nasiya (kichik) */}
            <div className="space-y-2">
              <div className={cn("grid gap-2", qrEnabled ? "grid-cols-3" : "grid-cols-2")}>
                <button
                  type="button"
                  onClick={() => setPayMethod("cash")}
                  className={cn(
                    "flex flex-col items-center gap-1.5 rounded-xl border py-4 text-sm font-semibold transition-colors",
                    payMethod === "cash"
                      ? "border-primary bg-accent text-primary"
                      : "border-input bg-background text-muted-foreground hover:bg-muted"
                  )}
                >
                  <Banknote className="h-6 w-6" /> {t("sell.payCash")}
                </button>
                <button
                  type="button"
                  onClick={() => setPayMethod("card")}
                  className={cn(
                    "flex flex-col items-center gap-1.5 rounded-xl border py-4 text-sm font-semibold transition-colors",
                    payMethod === "card"
                      ? "border-primary bg-accent text-primary"
                      : "border-input bg-background text-muted-foreground hover:bg-muted"
                  )}
                >
                  <CreditCard className="h-6 w-6" /> {t("sell.payCard")}
                </button>
                {qrEnabled && (
                  <button
                    type="button"
                    onClick={() => setPayMethod("qr")}
                    className={cn(
                      "flex flex-col items-center gap-1.5 rounded-xl border py-4 text-sm font-semibold transition-colors",
                      payMethod === "qr"
                        ? "border-primary bg-accent text-primary"
                        : "border-input bg-background text-muted-foreground hover:bg-muted"
                    )}
                  >
                    <QrCode className="h-6 w-6" /> {t("sell.payQr")}
                  </button>
                )}
              </div>
              <button
                type="button"
                onClick={() => setPayMethod("credit")}
                className={cn(
                  "flex w-full items-center justify-center gap-1.5 rounded-lg border py-2 text-xs font-medium transition-colors",
                  payMethod === "credit"
                    ? "border-primary bg-accent text-primary"
                    : "border-input bg-background text-muted-foreground hover:bg-muted"
                )}
              >
                <NotebookPen className="h-4 w-4" /> {t("sell.payCredit")}
              </button>
            </div>

            {/* Nasiya tafsiloti — faqat nasiya tanlanganda */}
            {isCredit && shop && (
              <div className="space-y-3 rounded-xl border border-border p-3">
                <Label className="text-xs text-muted-foreground">
                  {t("sell.customerLabel")}
                </Label>
                <CustomerPicker shopId={shop.id} value={customer} onChange={setCustomer} />
                {customer ? (
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
                ) : (
                  <p className="text-xs text-muted-foreground">
                    {t("sell.selectCustomerForCredit")}
                  </p>
                )}
              </div>
            )}
          </div>
          {!online && (
            <p className="flex items-center gap-1.5 rounded-lg bg-sky-50 px-3 py-2 text-sm text-sky-700 dark:bg-sky-500/10 dark:text-sky-400">
              <WifiOff className="h-4 w-4 shrink-0" />
              {t("offline.checkoutQueued")}
            </p>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>
              {t("common.cancel")}
            </Button>
            <Button
              variant="success"
              onClick={handleConfirmSale}
              disabled={saleMut.isPending || (isCredit && !customer)}
            >
              {!saleMut.isPending && <Check className="mr-1.5 h-4 w-4" />}
              {saleMut.isPending
                ? t("sell.selling")
                : online
                  ? t("sell.sellBtn")
                  : t("offline.sellQueueBtn")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* QR to'lov sheet'i (onlayn ekvayring) */}
      {shop && qrPayload && (
        <QrPaymentSheet
          open={qrOpen}
          shopId={shop.id}
          items={qrPayload.saleItems}
          amount={qrPayload.total}
          searchMethod={qrPayload.method}
          clientId={qrPayload.clientId}
          onPaid={handleQrPaid}
          onClose={() => {
            setQrOpen(false);
            setQrPayload(null);
          }}
        />
      )}

      {/* Chek */}
      <Receipt
        open={!!receipt}
        result={receipt}
        items={receiptItems}
        shopName={shop?.name ?? t("auth.shopNamePlaceholder")}
        queued={receiptQueued}
        onNext={() => setReceipt(null)}
      />
    </div>
  );
}
