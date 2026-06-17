"use client";

import { useMemo, useState } from "react";
import { Search, Truck, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { Supplier } from "@/types/database";
import { useSuppliers } from "@/hooks/use-suppliers";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { SupplierForm } from "@/components/purchases/supplier-form";

interface SupplierPickerProps {
  shopId: string;
  value: Supplier | null;
  onChange: (supplier: Supplier | null) => void;
}

/** Kirimda ta'minotchi tanlash: keshlangan ro'yxatdan qidiruv + tezkor qo'shish. */
export function SupplierPicker({ shopId, value, onChange }: SupplierPickerProps) {
  const { t } = useTranslation();
  const { data: suppliers } = useSuppliers(shopId);
  const [term, setTerm] = useState("");
  const [addOpen, setAddOpen] = useState(false);

  const filtered = useMemo(() => {
    const list = suppliers ?? [];
    if (!term.trim()) return list.slice(0, 6);
    const q = term.trim().toLowerCase();
    return list
      .filter((s) => s.name.toLowerCase().includes(q) || (s.phone ?? "").includes(q))
      .slice(0, 6);
  }, [suppliers, term]);

  if (value) {
    return (
      <div className="flex items-center justify-between rounded-xl border border-border bg-accent/40 px-3 py-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{value.name}</p>
          {value.phone && (
            <p className="text-xs text-muted-foreground">{value.phone}</p>
          )}
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => onChange(null)}
          aria-label={t("common.clear")}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          placeholder={t("suppliers.searchPlaceholder")}
          className="pl-9"
        />
      </div>

      {filtered.length > 0 && (
        <ul className="max-h-40 space-y-1 overflow-auto">
          {filtered.map((s) => (
            <li key={s.id}>
              <button
                type="button"
                onClick={() => onChange(s)}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-accent"
              >
                <Truck className="h-4 w-4 shrink-0 text-muted-foreground" />
                <span className="truncate">
                  {s.name}
                  {s.phone ? ` · ${s.phone}` : ""}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      <Button
        type="button"
        variant="outline"
        size="sm"
        className="w-full"
        onClick={() => setAddOpen(true)}
      >
        <Truck className="mr-1 h-4 w-4" /> {t("suppliers.addNew")}
      </Button>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("suppliers.newSupplier")}</DialogTitle>
          </DialogHeader>
          <SupplierForm
            shopId={shopId}
            onSuccess={(s) => {
              setAddOpen(false);
              onChange(s);
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
