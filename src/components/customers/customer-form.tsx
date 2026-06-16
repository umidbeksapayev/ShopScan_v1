"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import type { Customer } from "@/types/database";
import { useCreateCustomer } from "@/hooks/use-customers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface CustomerFormProps {
  shopId: string;
  onSuccess: (customer: Customer) => void;
}

export function CustomerForm({ shopId, onSuccess }: CustomerFormProps) {
  const { t } = useTranslation();
  const createMut = useCreateCustomer();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [note, setNote] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      toast.error(t("customers.nameRequired"));
      return;
    }
    try {
      const customer = await createMut.mutateAsync({
        shop_id: shopId,
        name,
        phone: phone || null,
        note: note || null,
      });
      toast.success(t("customers.added"));
      onSuccess(customer);
    } catch (err) {
      toast.error(t("customers.saveError"), {
        description: err instanceof Error ? err.message : undefined,
      });
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="cust-name">{t("customers.name")}</Label>
        <Input
          id="cust-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          autoFocus
          placeholder={t("customers.namePlaceholder")}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="cust-phone">{t("customers.phone")}</Label>
        <Input
          id="cust-phone"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          inputMode="tel"
          placeholder="+998 90 123 45 67"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="cust-note">{t("customers.note")}</Label>
        <Input
          id="cust-note"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder={t("customers.notePlaceholder")}
        />
      </div>
      <Button type="submit" className="w-full" disabled={createMut.isPending}>
        {createMut.isPending ? t("common.saving") : t("common.save")}
      </Button>
    </form>
  );
}
