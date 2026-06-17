"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import type { Supplier } from "@/types/database";
import { useCreateSupplier } from "@/hooks/use-suppliers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface SupplierFormProps {
  shopId: string;
  onSuccess: (supplier: Supplier) => void;
}

export function SupplierForm({ shopId, onSuccess }: SupplierFormProps) {
  const { t } = useTranslation();
  const createMut = useCreateSupplier();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [note, setNote] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      toast.error(t("suppliers.nameRequired"));
      return;
    }
    try {
      const supplier = await createMut.mutateAsync({
        shop_id: shopId,
        name,
        phone: phone || null,
        note: note || null,
      });
      toast.success(t("suppliers.added"));
      onSuccess(supplier);
    } catch (err) {
      toast.error(t("suppliers.saveError"), {
        description: err instanceof Error ? err.message : undefined,
      });
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="sup-name">{t("suppliers.name")}</Label>
        <Input
          id="sup-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          autoFocus
          placeholder={t("suppliers.namePlaceholder")}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="sup-phone">{t("suppliers.phone")}</Label>
        <Input
          id="sup-phone"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          inputMode="tel"
          placeholder="+998 90 123 45 67"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="sup-note">{t("suppliers.note")}</Label>
        <Input
          id="sup-note"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder={t("suppliers.notePlaceholder")}
        />
      </div>
      <Button type="submit" className="w-full" disabled={createMut.isPending}>
        {createMut.isPending ? t("common.saving") : t("common.save")}
      </Button>
    </form>
  );
}
