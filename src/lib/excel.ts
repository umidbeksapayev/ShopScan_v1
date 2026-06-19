import type { Product } from "@/types/database";
import { parseCsv } from "@/lib/import-products";

/** Import namunasi (.xlsx) ustun sarlavhalari — detectColumns shularni tushunadi. */
const IMPORT_TEMPLATE_HEADERS = [
  "Nomi*",
  "Tur",
  "Tan narxi*",
  "Sotish narxi*",
  "Miqdor*",
  "Barcode",
  "Kategoriya",
];

/**
 * Mahsulotlar ro'yxatini .xlsx faylga eksport qilib, brauzerda yuklab beradi.
 * exceljs FAQAT shu yerda lazy yuklanadi — asosiy bundle'ga tushmaydi.
 * Faqat egasi (joriy foydalanuvchi) o'z ma'lumotini eksport qiladi (tan narxi ham kiradi).
 */
export async function exportProductsXlsx(
  products: Product[],
  shopName: string
): Promise<void> {
  const ExcelJS = await import("exceljs");
  const wb = new ExcelJS.Workbook();
  wb.creator = "uscan";
  wb.created = new Date();

  const ws = wb.addWorksheet("Mahsulotlar");
  ws.columns = [
    { header: "Nomi", key: "name", width: 30 },
    { header: "Tur", key: "type", width: 10 },
    { header: "Tan narxi", key: "cost", width: 14 },
    { header: "Sotish narxi", key: "selling", width: 14 },
    { header: "Foyda (birlik)", key: "profit", width: 14 },
    { header: "Miqdor", key: "qty", width: 12 },
    { header: "Kam qoldiq", key: "low", width: 12 },
    { header: "Barcode", key: "barcode", width: 18 },
  ];
  ws.getRow(1).font = { bold: true };

  for (const p of products) {
    ws.addRow({
      name: p.name,
      type: p.sale_type === "weight" ? "kg" : "dona",
      cost: p.cost_price,
      selling: p.selling_price,
      profit: p.selling_price - p.cost_price,
      qty: p.quantity,
      low: p.low_stock_alert,
      barcode: p.barcode ?? "",
    });
  }

  for (const key of ["cost", "selling", "profit"]) {
    ws.getColumn(key).numFmt = "#,##0";
  }

  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const date = new Date().toISOString().slice(0, 10);
  const safeName =
    (shopName || "uscan")
      .replace(/[\\/:*?"<>|]+/g, "")
      .trim()
      .replace(/\s+/g, "_")
      .slice(0, 40) || "uscan";

  const a = document.createElement("a");
  a.href = url;
  a.download = `${safeName}_mahsulotlar_${date}.xlsx`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/**
 * Ommaviy import uchun namuna (.xlsx) yuklab beradi: sarlavhalar + 2 ta misol qator.
 * Foydalanuvchi misollarni o'chirib o'z mahsulotlarini kiritadi.
 */
export async function downloadImportTemplateXlsx(): Promise<void> {
  const ExcelJS = await import("exceljs");
  const wb = new ExcelJS.Workbook();
  wb.creator = "uscan";
  wb.created = new Date();

  const ws = wb.addWorksheet("Mahsulotlar");
  ws.columns = IMPORT_TEMPLATE_HEADERS.map((header) => ({
    header,
    width: header.length < 10 ? 14 : 18,
  }));
  ws.getRow(1).font = { bold: true };

  // Misol qatorlar (Tur: "dona" yoki "kg"; bo'sh qoldirilsa — dona)
  ws.addRow(["Coca-Cola 1L (misol)", "dona", 7000, 9000, 24, "5449000000996", "Ichimliklar"]);
  ws.addRow(["Shakar (misol)", "kg", 9000, 11000, 50, "", "Oziq-ovqat"]);

  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "uscan_import_namuna.xlsx";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/** Excel katakcha qiymatini matnga aylantiradi (rich-text/formula/hyperlink/sana). */
function cellToString(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "object") {
    const o = value as Record<string, unknown>;
    if (typeof o.text === "string") return o.text;
    if ("result" in o) return o.result == null ? "" : String(o.result);
    if (Array.isArray(o.richText)) {
      return (o.richText as { text?: string }[]).map((p) => p.text ?? "").join("");
    }
    if (value instanceof Date) return value.toISOString();
  }
  return String(value);
}

/**
 * Yuklangan faylni (.xlsx yoki .csv) 2 o'lchamli grid (qator × ustun) ga aylantiradi.
 * 1-qator = sarlavha. exceljs FAQAT shu yerda lazy yuklanadi.
 */
export async function parseProductsFile(file: File): Promise<string[][]> {
  const isCsv =
    file.name.toLowerCase().endsWith(".csv") ||
    file.type === "text/csv" ||
    file.type === "application/csv";

  if (isCsv) {
    const text = await file.text();
    return parseCsv(text);
  }

  const ExcelJS = await import("exceljs");
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(await file.arrayBuffer());
  const ws = wb.worksheets[0];
  if (!ws) return [];

  const grid: string[][] = [];
  ws.eachRow({ includeEmpty: false }, (row) => {
    const values = row.values as unknown[]; // 1-indeksli (0 — bo'sh)
    const cells: string[] = [];
    for (let i = 1; i < values.length; i++) {
      cells.push(cellToString(values[i]).trim());
    }
    if (cells.some((c) => c !== "")) grid.push(cells);
  });
  return grid;
}
