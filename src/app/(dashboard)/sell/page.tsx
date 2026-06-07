"use client";

import { useState } from "react";
import { Search, ScanLine, Sparkles } from "lucide-react";
import { toast } from "sonner";
import type { Product, SearchMethod } from "@/types/database";
import { useShop } from "@/hooks/use-shop";
import { useProcessCartSale } from "@/hooks/use-sale";
import { useCartStore } from "@/stores/cart-store";
import dynamic from "next/dynamic";
import {
  findProductsByBarcode,
  searchProductsByName,
  searchProductsByImage,
  type CartSaleResult,
} from "@/lib/sales";
import type { ReceiptLineItem } from "@/lib/receipt-print";
import { AddToCartDialog } from "@/components/sales/add-to-cart-dialog";

// Og'ir kutubxonalar (react-webcam + @zxing/library) faqat kerak bo'lganda yuklanadi
const cameraLoading = () => (
  <div className="flex aspect-video w-full items-center justify-center rounded-xl bg-muted text-sm text-muted-foreground">
    Kamera yuklanmoqda...
  </div>
);

const BarcodeScanner = dynamic(
  () => import("@/components/sales/barcode-scanner").then((m) => m.BarcodeScanner),
  { ssr: false, loading: cameraLoading }
);

const VisualSearch = dynamic(
  () => import("@/components/sales/visual-search").then((m) => m.VisualSearch),
  { ssr: false, loading: cameraLoading }
);
import { CartPanel } from "@/components/sales/cart-panel";
import { Receipt } from "@/components/sales/receipt";
import { Input } from "@/components/ui/input";
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
  const { data: shop } = useShop();
  const { items, addItem, clear, totalRevenue } = useCartStore();
  const saleMut = useProcessCartSale();

  const [candidates, setCandidates] = useState<Product[]>([]);
  const [method, setMethod] = useState<SearchMethod>("manual");
  const [addOpen, setAddOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [receipt, setReceipt] = useState<CartSaleResult | null>(null);
  const [receiptItems, setReceiptItems] = useState<ReceiptLineItem[]>([]);
  const [visualSearching, setVisualSearching] = useState(false);

  async function handleBarcode(barcode: string) {
    try {
      const found = await findProductsByBarcode(barcode);
      if (found.length === 0) {
        toast.error("Mahsulot topilmadi", {
          description: `Barcode: ${barcode}. Qo'lda qidirib ko'ring.`,
        });
        return;
      }
      if (found.length > 1) {
        toast.info("Bir nechta mahsulot topildi — birini tanlang");
      }
      setMethod("barcode");
      setCandidates(found);
      setAddOpen(true);
    } catch {
      toast.error("Qidiruvda xato");
    }
  }

  async function handleVisualSearch(imageDataUri: string) {
    setVisualSearching(true);
    try {
      const found = await searchProductsByImage(imageDataUri);
      if (found.length === 0) {
        toast.error("O'xshash mahsulot topilmadi", {
          description: "Mahsulotlar indekslanganmi? Sozlamalardan tekshiring.",
        });
        return;
      }
      setMethod("visual");
      setCandidates(found);
      setAddOpen(true);
    } catch (err) {
      toast.error("Vizual qidiruv xatosi", {
        description: err instanceof Error ? err.message : undefined,
      });
    } finally {
      setVisualSearching(false);
    }
  }

  async function handleManualSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!searchTerm.trim()) return;
    try {
      const found = await searchProductsByName(searchTerm);
      if (found.length === 0) {
        toast.error("Hech narsa topilmadi");
        return;
      }
      setMethod("manual");
      setCandidates(found);
      setAddOpen(true);
    } catch {
      toast.error("Qidiruvda xato");
    }
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
      toast.error("Sotuv amalga oshmadi", {
        description: err instanceof Error ? err.message : undefined,
      });
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Sotuv</h1>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Chap: topish */}
        <div>
          <Tabs defaultValue="barcode">
            <TabsList className="w-full">
              <TabsTrigger value="barcode" className="flex-1 gap-1.5">
                <ScanLine className="h-4 w-4" /> Barcode
              </TabsTrigger>
              <TabsTrigger value="visual" className="flex-1 gap-1.5">
                <Sparkles className="h-4 w-4" /> Vizual
              </TabsTrigger>
              <TabsTrigger value="manual" className="flex-1 gap-1.5">
                <Search className="h-4 w-4" /> Qidirish
              </TabsTrigger>
            </TabsList>

            <TabsContent value="barcode">
              <BarcodeScanner onDetected={handleBarcode} />
            </TabsContent>

            <TabsContent value="visual">
              <VisualSearch onCapture={handleVisualSearch} searching={visualSearching} />
            </TabsContent>

            <TabsContent value="manual">
              <form onSubmit={handleManualSearch} className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Mahsulot nomi..."
                    className="pl-9"
                  />
                </div>
                <Button type="submit">Qidirish</Button>
              </form>
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
          toast.success("Savatga qo'shildi");
        }}
        onClose={() => setAddOpen(false)}
      />

      {/* Tasdiqlash modali (FR-28) */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Sotuvni tasdiqlang</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            {items.length} ta mahsulot, jami{" "}
            <span className="font-semibold">{totalRevenue().toLocaleString("uz-UZ")} so&apos;m</span>.
            Davom etamizmi?
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>
              Bekor
            </Button>
            <Button onClick={handleConfirmSale} disabled={saleMut.isPending}>
              {saleMut.isPending ? "Sotilmoqda..." : "Sotish"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Chek */}
      <Receipt
        open={!!receipt}
        result={receipt}
        items={receiptItems}
        shopName={shop?.name ?? "Do'kon"}
        onNext={() => setReceipt(null)}
      />
    </div>
  );
}
