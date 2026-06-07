import { formatCurrency, formatWeight } from "@/lib/utils";
import type { ReceiptData, ReceiptLineItem } from "@/lib/receipt-print";

/**
 * ESC/POS bayt generatori — Flutter `printer_helper.dart` (EscPos + printReceipt)
 * mantig'ining TypeScript porti. Natija: termal printerga BLE/USB orqali
 * yuboriladigan Uint8Array.
 *
 * MUHIM: chekda tan narxi (cost_price) yoki foyda YO'Q — narx maxfiyligi (CLAUDE.md).
 */

const ESC = 0x1b;
const GS = 0x1d;
const LF = 0x0a;

const CMD = {
  init: [ESC, 0x40],
  alignLeft: [ESC, 0x61, 0x00],
  alignCenter: [ESC, 0x61, 0x01],
  alignRight: [ESC, 0x61, 0x02],
  boldOn: [ESC, 0x45, 0x01],
  boldOff: [ESC, 0x45, 0x00],
  textNormal: [GS, 0x21, 0x00],
  textDouble: [GS, 0x21, 0x11], // ikki baravar bo'y+en
  feed: [LF],
  cut: [GS, 0x56, 0x00], // qog'ozni kesish (qo'llab-quvvatlamasa, e'tiborsiz)
};

/**
 * Matnni baytlarga aylantiradi (Latin-1). NBSP → bo'sh joy, Latin-1'dan tashqari
 * belgilar → '?'. Ko'pchilik arzon termal printerlar ASCII/Latin-1 ishlatadi.
 */
function encode(text: string): number[] {
  const out: number[] = [];
  for (let i = 0; i < text.length; i++) {
    let code = text.charCodeAt(i);
    if (code === 0x00a0) code = 0x20; // NBSP → space
    out.push(code <= 0xff ? code : 0x3f); // '?'
  }
  return out;
}

function quantityText(item: ReceiptLineItem): string {
  return item.saleType === "weight"
    ? formatWeight(item.quantity)
    : `${item.quantity} dona`;
}

/** Chap va o'ng matnni belgilangan kenglikda ikki ustunga joylaydi. */
function twoColumns(left: string, right: string, width: number): string {
  let l = left;
  if (l.length + right.length + 1 > width) {
    l = l.slice(0, Math.max(0, width - right.length - 1));
  }
  const gap = Math.max(1, width - l.length - right.length);
  return l + " ".repeat(gap) + right;
}

/**
 * Chek baytlarini quradi.
 * @param width belgi kengligi: 58mm printer ≈ 32, 80mm printer ≈ 48.
 */
export function buildReceiptBytes(data: ReceiptData, width = 32): Uint8Array {
  const soldAt = data.soldAt ?? new Date();
  const dateStr = new Intl.DateTimeFormat("uz-UZ", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(soldAt);

  const bytes: number[] = [];
  const push = (...chunks: number[][]) => {
    for (const c of chunks) bytes.push(...c);
  };
  const line = (s: string) => {
    bytes.push(...encode(s), ...CMD.feed);
  };

  push(CMD.init);

  // Do'kon nomi (markaz, qalin, katta)
  push(CMD.alignCenter, CMD.boldOn, CMD.textDouble);
  line(data.shopName);
  push(CMD.textNormal, CMD.boldOff);
  line(dateStr);
  line("-".repeat(width));

  // Mahsulotlar (chapdan)
  push(CMD.alignLeft);
  for (const item of data.items) {
    push(CMD.boldOn);
    line(item.name);
    push(CMD.boldOff);
    const lineTotal = item.unitPrice * item.quantity;
    line(
      twoColumns(
        `${quantityText(item)} x ${formatCurrency(item.unitPrice)}`,
        formatCurrency(lineTotal),
        width
      )
    );
  }

  line("-".repeat(width));
  line(`Mahsulotlar: ${data.itemCount} ta`);

  // Jami (qalin)
  push(CMD.boldOn);
  line(twoColumns("JAMI", formatCurrency(data.total), width));
  push(CMD.boldOff);
  line("-".repeat(width));

  // Footer (markaz)
  push(CMD.alignCenter);
  line("Xaridingiz uchun rahmat!");
  push(CMD.feed, CMD.feed, CMD.feed, CMD.cut);

  return Uint8Array.from(bytes);
}
