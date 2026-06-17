import { describe, it, expect } from "vitest";
import { matchBarcode } from "@/lib/offline-lookup";
import type { Product } from "@/types/database";

function product(p: Partial<Product>): Product {
  return {
    id: p.id ?? "1",
    shop_id: "s1",
    name: p.name ?? "Mahsulot",
    sale_type: "unit",
    cost_price: 1000,
    selling_price: 1500,
    profit_per_unit: 500,
    quantity: p.quantity ?? 10,
    low_stock_alert: 2,
    barcode: p.barcode ?? null,
    image_url: null,
    category_id: null,
    is_active: p.is_active ?? true,
    created_at: p.created_at ?? "2026-01-01T00:00:00Z",
  };
}

describe("matchBarcode (offline)", () => {
  const products = [
    product({ id: "a", barcode: "5449000000996", created_at: "2026-01-01T00:00:00Z" }),
    product({ id: "b", barcode: "5449000000996", created_at: "2026-03-01T00:00:00Z" }),
    product({ id: "c", barcode: "111", quantity: 0 }), // qoldiq yo'q
    product({ id: "d", barcode: "222", is_active: false }), // arxivlangan
    product({ id: "e", barcode: null }),
  ];

  it("barcode bo'yicha topadi, eng yangi birinchi", () => {
    const res = matchBarcode(products, "5449000000996");
    expect(res.map((p) => p.id)).toEqual(["b", "a"]);
  });

  it("bo'sh joy/belgili barcode normalizatsiya qilinadi", () => {
    expect(matchBarcode(products, " 5449-0000-00996 ").map((p) => p.id)).toEqual(["b", "a"]);
  });

  it("qoldig'i yo'q yoki arxivlangan mahsulot chiqmaydi", () => {
    expect(matchBarcode(products, "111")).toHaveLength(0);
    expect(matchBarcode(products, "222")).toHaveLength(0);
  });

  it("topilmasa bo'sh massiv", () => {
    expect(matchBarcode(products, "999")).toHaveLength(0);
    expect(matchBarcode(products, "")).toHaveLength(0);
  });

  it("limit'ni hurmat qiladi", () => {
    const many = [
      product({ id: "1", barcode: "7", created_at: "2026-01-01T00:00:00Z" }),
      product({ id: "2", barcode: "7", created_at: "2026-02-01T00:00:00Z" }),
      product({ id: "3", barcode: "7", created_at: "2026-03-01T00:00:00Z" }),
      product({ id: "4", barcode: "7", created_at: "2026-04-01T00:00:00Z" }),
    ];
    expect(matchBarcode(many, "7")).toHaveLength(3);
    expect(matchBarcode(many, "7", 2)).toHaveLength(2);
  });
});
