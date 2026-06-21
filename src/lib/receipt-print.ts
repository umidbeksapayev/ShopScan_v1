import { formatCurrency, formatWeight } from "@/lib/utils";
import { printHtmlAuto } from "@/lib/native-print";
import type { SaleType } from "@/types/database";

/**
 * Chek satr elementi (savatdagi bitta mahsulot snapshot'i).
 * MUHIM: bu yerda tan narxi (cost_price) yoki foyda YO'Q — narx maxfiyligi (CLAUDE.md).
 */
export interface ReceiptLineItem {
  name: string;
  quantity: number;
  saleType: SaleType;
  unitPrice: number; // selling_price snapshot
}

export interface ReceiptData {
  shopName: string;
  items: ReceiptLineItem[];
  total: number;
  itemCount: number;
  soldAt?: Date;
}

/** XSS / HTML buzilishining oldini olish uchun matnni xavfsizlash. */
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/** Mahsulot miqdorini sotuv turiga qarab formatlaydi (donali/vazn). */
function formatQuantity(item: ReceiptLineItem): string {
  return item.saleType === "weight"
    ? formatWeight(item.quantity)
    : `${item.quantity} dona`;
}

function formatDateTime(date: Date): string {
  return new Intl.DateTimeFormat("uz-UZ", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

/**
 * 58/80mm termal printer yoki oddiy A4 uchun mos chek HTML'ini quradi.
 * window.print() OS dialogidan istalgan printer (termal, lazer, PDF) tanlanadi.
 */
export function buildReceiptHtml(data: ReceiptData): string {
  const soldAt = data.soldAt ?? new Date();

  const rows = data.items
    .map((item) => {
      const lineTotal = item.unitPrice * item.quantity;
      return `
        <tr>
          <td class="name">${escapeHtml(item.name)}</td>
          <td class="total">${escapeHtml(formatCurrency(lineTotal))}</td>
        </tr>
        <tr class="sub">
          <td colspan="2">${escapeHtml(formatQuantity(item))} × ${escapeHtml(
        formatCurrency(item.unitPrice)
      )}</td>
        </tr>`;
    })
    .join("");

  return `<!DOCTYPE html>
<html lang="uz">
<head>
  <meta charset="utf-8" />
  <title>Chek</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body {
      font-family: "Courier New", ui-monospace, monospace;
      color: #000;
      background: #fff;
    }
    .receipt {
      width: 280px;
      margin: 0 auto;
      padding: 12px 10px;
      font-size: 12px;
      line-height: 1.4;
    }
    .center { text-align: center; }
    .shop-name { font-size: 16px; font-weight: bold; letter-spacing: 1px; }
    .muted { color: #333; font-size: 11px; }
    .divider { border-top: 1px dashed #000; margin: 8px 0; }
    table { width: 100%; border-collapse: collapse; }
    td { vertical-align: top; padding: 1px 0; }
    td.name { text-align: left; padding-right: 8px; }
    td.total { text-align: right; white-space: nowrap; font-weight: bold; }
    tr.sub td { color: #444; font-size: 11px; padding-bottom: 4px; }
    .grand { display: flex; justify-content: space-between; font-size: 14px; font-weight: bold; margin-top: 4px; }
    .footer { margin-top: 10px; font-size: 11px; }
    @media print {
      @page { margin: 4mm; }
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    }
  </style>
</head>
<body>
  <div class="receipt">
    <div class="center shop-name">${escapeHtml(data.shopName)}</div>
    <div class="center muted">${escapeHtml(formatDateTime(soldAt))}</div>
    <div class="divider"></div>
    <table>${rows}</table>
    <div class="divider"></div>
    <div class="muted">Mahsulotlar: ${data.itemCount} ta</div>
    <div class="grand">
      <span>JAMI</span>
      <span>${escapeHtml(formatCurrency(data.total))}</span>
    </div>
    <div class="divider"></div>
    <div class="center footer">Xaridingiz uchun rahmat!</div>
  </div>
</body>
</html>`;
}

/**
 * Chekni chop etadi: native (Android) bo'lsa tizim print dialogi (PrintManager),
 * web'da yashirin iframe + window.print(). Klient component'dan chaqiriladi.
 */
export function printReceipt(data: ReceiptData): void {
  if (typeof window === "undefined") return;
  void printHtmlAuto(buildReceiptHtml(data), "Chek");
}
