import type { ReceiptData, ReceiptLineItem } from "@/lib/receipt-print";
import { formatCurrency, formatWeight } from "@/lib/utils";
import { pickBarcodeFormat, type LabelData } from "@/lib/barcode-format";

/**
 * Native (Capacitor) termal printer — Bluetooth Classic SPP, ESC/POS.
 * Flutter `print_bluetooth_thermal` oqimining ekvivalenti: paired skan → ulanish →
 * chek baytlari → chop etish. `capacitor-thermal-printer` plugini orqali.
 *
 * Importlar DINAMIK — web build/runtime'ga ta'sir qilmaydi (faqat native'da chaqiriladi).
 */

export interface PrinterDevice {
  name: string;
  address: string;
}

const LAST_PRINTER_KEY = "shopscan-printer-address";

export function getLastPrinter(): string | null {
  try {
    return localStorage.getItem(LAST_PRINTER_KEY);
  } catch {
    return null;
  }
}

export function setLastPrinter(address: string): void {
  try {
    localStorage.setItem(LAST_PRINTER_KEY, address);
  } catch {
    /* localStorage yo'q bo'lsa jim o'tadi */
  }
}

function qtyText(item: ReceiptLineItem): string {
  return item.saleType === "weight"
    ? formatWeight(item.quantity)
    : `${item.quantity} dona`;
}

/** Chap/o'ng matnni belgilangan kenglikda ikki ustunga joylaydi. */
function twoColumns(left: string, right: string, width: number): string {
  let l = left;
  if (l.length + right.length + 1 > width) {
    l = l.slice(0, Math.max(0, width - right.length - 1));
  }
  const gap = Math.max(1, width - l.length - right.length);
  return l + " ".repeat(gap) + right;
}

/**
 * Printerlarni skanlaydi. Topilgan qurilmalar `onDevices` orqali yetkaziladi.
 * Qaytaradi: skanni to'xtatuvchi funksiya.
 */
export async function scanPrinters(
  onDevices: (devices: PrinterDevice[]) => void
): Promise<() => Promise<void>> {
  const { CapacitorThermalPrinter } = await import("capacitor-thermal-printer");
  const found = new Map<string, PrinterDevice>();

  const sub = await CapacitorThermalPrinter.addListener(
    "discoverDevices",
    ({ devices }: { devices: PrinterDevice[] }) => {
      for (const d of devices) found.set(d.address, d);
      onDevices(Array.from(found.values()));
    }
  );

  await CapacitorThermalPrinter.startScan();

  return async () => {
    try {
      await CapacitorThermalPrinter.stopScan();
    } catch {
      /* */
    }
    try {
      await sub.remove();
    } catch {
      /* */
    }
  };
}

/**
 * Chekni native termal printerga chop etadi (kerak bo'lsa ulanadi).
 * @param width belgi kengligi: 58mm ≈ 32, 80mm ≈ 48.
 */
export async function printReceiptNative(
  data: ReceiptData,
  address: string,
  width = 32
): Promise<void> {
  const { CapacitorThermalPrinter } = await import("capacitor-thermal-printer");

  const connected = await CapacitorThermalPrinter.isConnected().catch(() => false);
  if (!connected) {
    await CapacitorThermalPrinter.connect({ address });
  }

  const soldAt = data.soldAt ?? new Date();
  const dateStr = new Intl.DateTimeFormat("uz-UZ", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(soldAt);

  let p = CapacitorThermalPrinter.begin()
    .align("center")
    .bold()
    .doubleWidth()
    .doubleHeight()
    .text(data.shopName + "\n")
    .clearFormatting()
    .align("center")
    .text(dateStr + "\n")
    .text("-".repeat(width) + "\n")
    .align("left");

  for (const item of data.items) {
    const lineTotal = item.unitPrice * item.quantity;
    p = p
      .bold()
      .text(item.name + "\n")
      .clearFormatting()
      .text(
        twoColumns(
          `${qtyText(item)} x ${formatCurrency(item.unitPrice)}`,
          formatCurrency(lineTotal),
          width
        ) + "\n"
      );
  }

  p = p
    .text("-".repeat(width) + "\n")
    .text(`Mahsulotlar: ${data.itemCount} ta\n`)
    .bold()
    .text(twoColumns("JAMI", formatCurrency(data.total), width) + "\n")
    .clearFormatting()
    .text("-".repeat(width) + "\n")
    .align("center")
    .text("Xaridingiz uchun rahmat!\n\n\n")
    .cutPaper();

  await p.write();
}

/**
 * Narx-yorliqlarini native termal printerga chop etadi (har biri alohida label).
 * Barcode'ni printer o'zi chizadi (.barcode) — skanerlanadigan.
 * `labels` allaqachon nusxalar bilan kengaytirilgan ro'yxat.
 */
export async function printLabelsNative(
  labels: LabelData[],
  address: string
): Promise<void> {
  if (labels.length === 0) return;
  const { CapacitorThermalPrinter } = await import("capacitor-thermal-printer");

  const connected = await CapacitorThermalPrinter.isConnected().catch(() => false);
  if (!connected) {
    await CapacitorThermalPrinter.connect({ address });
  }

  let p = CapacitorThermalPrinter.begin();

  for (const label of labels) {
    p = p.align("center");
    if (label.shopName) {
      p = p.text(label.shopName + "\n");
    }
    p = p
      .bold()
      .text(label.name + "\n")
      .clearFormatting()
      .bold()
      .doubleHeight()
      .doubleWidth()
      .text(formatCurrency(label.price) + "\n")
      .clearFormatting();

    if (label.barcode) {
      p = p
        .align("center")
        .barcodeTextPlacement("below")
        .barcodeWidth(3)
        .barcodeHeight(20)
        .barcode(pickBarcodeFormat(label.barcode), label.barcode);
    }
    // Har label alohida ajralishi uchun oxirida kesamiz
    p = p.text("\n").cutPaper();
  }

  await p.write();
}
