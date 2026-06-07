import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("uz-UZ", {
    style: "decimal",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount) + " so'm";
}

export function formatWeight(kg: number): string {
  if (kg >= 1) {
    return `${kg.toFixed(3)} kg`;
  }
  return `${(kg * 1000).toFixed(0)} gramm`;
}

export function calculateProfit(sellingPrice: number, costPrice: number) {
  const profit = sellingPrice - costPrice;
  const profitPercent = costPrice > 0 ? (profit / costPrice) * 100 : 0;
  return { profit, profitPercent };
}
