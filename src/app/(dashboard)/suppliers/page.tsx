"use client";

import { useMemo, useState } from "react";
import { Plus, Search, Truck, Phone } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useShop } from "@/hooks/use-shop";
import { useSuppliers } from "@/hooks/use-suppliers";
import { SupplierForm } from "@/components/purchases/supplier-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function SuppliersPage() {
  const { t } = useTranslation();
  const { data: shop } = useShop();
  const { data: suppliers, isLoading } = useSuppliers(shop?.id);
  const [term, setTerm] = useState("");
  const [addOpen, setAddOpen] = useState(false);

  const filtered = useMemo(() => {
    const list = suppliers ?? [];
    if (!term.trim()) return list;
    const q = term.trim().toLowerCase();
    return list.filter(
      (s) => s.name.toLowerCase().includes(q) || (s.phone ?? "").includes(q)
    );
  }, [suppliers, term]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">{t("suppliers.title")}</h1>
        <Button onClick={() => setAddOpen(true)} disabled={!shop}>
          <Plus className="mr-1 h-4 w-4" /> {t("suppliers.addNew")}
        </Button>
      </div>

      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          placeholder={t("suppliers.searchPlaceholder")}
          className="pl-9"
        />
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed py-16 text-center">
          <Truck className="mx-auto h-10 w-10 text-muted-foreground/40" />
          <p className="mt-2 text-muted-foreground">
            {term ? t("suppliers.notFound") : t("suppliers.empty")}
          </p>
        </div>
      ) : (
        <ul className="space-y-2">
          {filtered.map((s) => (
            <li
              key={s.id}
              className="flex items-center gap-3 rounded-xl border border-border bg-card p-3 shadow-soft"
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground">
                <Truck className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{s.name}</p>
                {s.phone && (
                  <p className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Phone className="h-3 w-3" />
                    {s.phone}
                  </p>
                )}
                {s.note && (
                  <p className="truncate text-xs text-muted-foreground">{s.note}</p>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("suppliers.newSupplier")}</DialogTitle>
          </DialogHeader>
          {shop && (
            <SupplierForm shopId={shop.id} onSuccess={() => setAddOpen(false)} />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
