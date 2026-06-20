import JsBarcode from "jsbarcode";
import { formatCurrency } from "@/lib/utils";
import {
  LABEL_BARCODE_FORMAT,
  type BarcodeFormat,
  type LabelData,
} from "@/lib/barcode-format";

/**
 * Narx-yorlig'i (etiketka) chop etish — A4 varaqqa etiketkalar to'ri.
 * `receipt-print.ts` naqshi: yashirin iframe + window.print → istalgan printer
 * (oddiy A4/lazer, termal yoki PDF). Barcode jsbarcode bilan skanerlanadigan
 * rasm (canvas→PNG dataURL) qilib chiziladi.
 */

export type { LabelData, BarcodeFormat } from "@/lib/barcode-format";

/**
 * Barcode'ni PNG dataURL qiladi (jsbarcode → canvas). Brauzerda ishlaydi.
 * Xato (masalan noto'g'ri EAN13) bo'lsa CODE128 bilan qayta urinadi; baribir
 * bo'lmasa null qaytaradi (etiketka barcode'siz chiqadi).
 */
export function barcodeToDataUrl(
  value: string,
  format: BarcodeFormat = LABEL_BARCODE_FORMAT
): string | null {
  if (typeof document === "undefined") return null;
  try {
    const canvas = document.createElement("canvas");
    JsBarcode(canvas, value, {
      format,
      // Kengroq modul + yetarli "quiet zone" + balandlik → telefon ishonchli o'qiydi.
      // Raqamlar zich (CODE128) va chiziqqa yaqin (textMargin past).
      width: 3,
      height: 60,
      displayValue: true,
      fontSize: 18,
      textMargin: 2,
      margin: 10,
    });
    return canvas.toDataURL("image/png");
  } catch {
    return null;
  }
}

/** XSS / HTML buzilishining oldini olish. */
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export interface LabelSheetOptions {
  /** Bitta etiketka eni (mm). */
  labelWidthMm?: number;
  /** Bitta etiketka bo'yi (mm). */
  labelHeightMm?: number;
  /** Do'kon nomini ko'rsatish. */
  showShopName?: boolean;
}

/** Oldindan rasm qilingan barcode bilan etiketka (HTML builder uchun). */
interface RenderedLabel {
  name: string;
  price: number;
  shopName?: string;
  barcodeImg: string | null;
}

/** A4 varaqqa etiketkalar to'ri HTML'ini quradi (flex-wrap, mm o'lchamlar). */
export function buildLabelSheetHtml(
  labels: RenderedLabel[],
  opts: LabelSheetOptions = {}
): string {
  const w = opts.labelWidthMm ?? 50;
  const h = opts.labelHeightMm ?? 30;

  const cells = labels
    .map((l) => {
      const shop =
        opts.showShopName && l.shopName
          ? `<div class="shop">${escapeHtml(l.shopName)}</div>`
          : "";
      const bc = l.barcodeImg
        ? `<img class="bc" src="${l.barcodeImg}" alt="" />`
        : `<div class="nobc">${escapeHtml(l.name)}</div>`;
      return `
      <div class="label">
        ${shop}
        <div class="name">${escapeHtml(l.name)}</div>
        <div class="price">${escapeHtml(formatCurrency(l.price))}</div>
        ${bc}
      </div>`;
    })
    .join("");

  return `<!DOCTYPE html>
<html lang="uz">
<head>
  <meta charset="utf-8" />
  <title>Narx yorliqlari</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { font-family: Arial, "Helvetica Neue", sans-serif; color: #000; background: #fff; }
    .sheet { display: flex; flex-wrap: wrap; gap: 2mm; padding: 4mm; }
    .label {
      width: ${w}mm; height: ${h}mm;
      border: 0.2mm solid #bbb;
      padding: 1.5mm;
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      text-align: center; overflow: hidden;
      page-break-inside: avoid; break-inside: avoid;
    }
    .shop { font-size: 7pt; color: #444; line-height: 1.1; }
    .name {
      font-size: 8pt; font-weight: 600; line-height: 1.1;
      display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;
      overflow: hidden;
    }
    .price { font-size: 14pt; font-weight: 800; margin: 0.5mm 0; }
    .bc { max-width: 100%; height: auto; max-height: ${Math.max(8, h - 16)}mm; }
    .nobc { font-size: 7pt; color: #666; }
    @media print {
      @page { margin: 6mm; }
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    }
  </style>
</head>
<body>
  <div class="sheet">${cells}</div>
</body>
</html>`;
}

/**
 * Etiketkalarni yashirin iframe orqali chop etadi (popup-blocker'siz).
 * Barcode rasmlari shu yerda (brauzerda) chiziladi va qiymat bo'yicha keshlanadi.
 * Faqat brauzerda ishlaydi (client component'dan chaqiriladi).
 */
export function printLabelsSheet(
  labels: LabelData[],
  opts: LabelSheetOptions = {}
): void {
  if (typeof window === "undefined" || labels.length === 0) return;

  // Bir xil barcode'ni qayta chizmaslik uchun kesh
  const imgCache = new Map<string, string | null>();
  const rendered: RenderedLabel[] = labels.map((l) => {
    let img: string | null = null;
    if (l.barcode) {
      if (!imgCache.has(l.barcode)) {
        imgCache.set(l.barcode, barcodeToDataUrl(l.barcode));
      }
      img = imgCache.get(l.barcode) ?? null;
    }
    return { name: l.name, price: l.price, shopName: l.shopName, barcodeImg: img };
  });

  const html = buildLabelSheetHtml(rendered, opts);

  const iframe = document.createElement("iframe");
  iframe.setAttribute("aria-hidden", "true");
  iframe.style.position = "fixed";
  iframe.style.right = "0";
  iframe.style.bottom = "0";
  iframe.style.width = "0";
  iframe.style.height = "0";
  iframe.style.border = "0";
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow?.document;
  const win = iframe.contentWindow;
  if (!doc || !win) {
    iframe.remove();
    return;
  }

  win.onafterprint = () => window.setTimeout(() => iframe.remove(), 1000);

  doc.open();
  doc.write(html);
  doc.close();

  window.setTimeout(() => {
    try {
      win.focus();
      win.print();
    } catch {
      iframe.remove();
    }
  }, 300);
}
