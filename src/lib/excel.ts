import type { Product } from "@/types/database";

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
  wb.creator = "ShopScan";
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
    (shopName || "shopscan")
      .replace(/[\\/:*?"<>|]+/g, "")
      .trim()
      .replace(/\s+/g, "_")
      .slice(0, 40) || "shopscan";

  const a = document.createElement("a");
  a.href = url;
  a.download = `${safeName}_mahsulotlar_${date}.xlsx`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
