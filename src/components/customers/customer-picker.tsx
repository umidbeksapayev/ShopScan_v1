"use client";

import { useMemo, useState } from "react";
import { Search, UserPlus, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { Customer } from "@/types/database";
import { useCustomerOptions } from "@/hooks/use-customers";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CustomerForm } from "@/components/customers/customer-form";

export type PickableCustomer = Customer;

interface CustomerPickerProps {
  shopId: string;
  value: PickableCustomer | null;
  onChange: (customer: PickableCustomer | null) => void;
}

/** Checkout'da mijoz tanlash: keshlangan ro'yxatdan qidiruv + tezkor qo'shish. */
export function CustomerPicker({ shopId, value, onChange }: CustomerPickerProps) {
  const { t } = useTranslation();
  const { data: customers } = useCustomerOptions(shopId);
  const [term, setTerm] = useState("");
  const [addOpen, setAddOpen] = useState(false);

  const filtered = useMemo(() => {
    const list = customers ?? [];
    if (!term.trim()) return list.slice(0, 6);
    const q = term.trim().toLowerCase();
    return list
      .filter(
        (c) =>
          c.name.toLowerCase().includes(q) || (c.phone ?? "").includes(q)
      )
      .slice(0, 6);
  }, [customers, term]);

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
          placeholder={t("customers.searchPlaceholder")}
          className="pl-9"
        />
      </div>

      {filtered.length > 0 && (
        <ul className="max-h-40 space-y-1 overflow-auto">
          {filtered.map((c) => (
            <li key={c.id}>
              <button
                type="button"
                onClick={() => onChange(c)}
                className="flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-accent"
              >
                <span className="truncate">
                  {c.name}
                  {c.phone ? ` · ${c.phone}` : ""}
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
        <UserPlus className="mr-1 h-4 w-4" /> {t("customers.addNew")}
      </Button>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("customers.newCustomer")}</DialogTitle>
          </DialogHeader>
          <CustomerForm
            shopId={shopId}
            onSuccess={(c) => {
              setAddOpen(false);
              onChange(c);
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
