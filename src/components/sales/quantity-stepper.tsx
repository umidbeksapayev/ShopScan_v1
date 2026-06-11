"use client";

import { Minus, Plus } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { SaleType } from "@/types/database";
import { Input } from "@/components/ui/input";

interface QuantityStepperProps {
  saleType: SaleType;
  value: number;
  max: number;
  onChange: (v: number) => void;
}

/**
 * DONALI: butun son stepper (−/+). VAZN: kg raqam maydoni (3 kasr).
 */
export function QuantityStepper({ saleType, value, max, onChange }: QuantityStepperProps) {
  const { t } = useTranslation();
  const isWeight = saleType === "weight";

  if (isWeight) {
    return (
      <Input
        type="number"
        inputMode="decimal"
        min="0.001"
        max={max}
        step="0.001"
        value={value || ""}
        onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
        placeholder="0.000"
        className="text-center text-lg font-semibold"
      />
    );
  }

  return (
    <div className="flex items-center justify-center gap-3">
      <button
        type="button"
        onClick={() => onChange(Math.max(1, value - 1))}
        disabled={value <= 1}
        className="flex h-10 w-10 items-center justify-center rounded-full border bg-background hover:bg-accent disabled:opacity-40"
        aria-label={t("common.decrease")}
      >
        <Minus className="h-4 w-4" />
      </button>
      <span className="min-w-[3rem] text-center text-xl font-bold tabular-nums">
        {value}
      </span>
      <button
        type="button"
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
        className="flex h-10 w-10 items-center justify-center rounded-full border bg-background hover:bg-accent disabled:opacity-40"
        aria-label={t("common.increase")}
      >
        <Plus className="h-4 w-4" />
      </button>
    </div>
  );
}
